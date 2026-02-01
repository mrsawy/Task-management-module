import { useEffect, useRef, useState } from 'react';
import Pusher from "pusher-js";
import Echo from "laravel-echo";
import { useMeQuery } from '@/services/authApi';
import { store } from '@/store/store';
import { taskApi } from '@/services/taskApi';
import { toast } from 'sonner';


// Extend Window type to include Pusher
declare global {
    interface Window {
        Pusher: typeof Pusher;
    }
}

// Define Message type
type Message = {
    type: 'system' | 'received' | 'error';
    text: string;
    user?: string;
    time: string;
};

// Optional: Define a type for event data
type EventData = {
    message?: string;
    user?: string;
    [key: string]: any;
};

export function useTaskUpdates() {
    const [eventData, setEventData] = useState<EventData | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [status, setStatus] = useState('Disconnected');
    const echoRef = useRef<Echo<any> | null>(null);

    const { data: user } = useMeQuery()
    useEffect(() => {
        if (!user) return

        // Check if Reverb is enabled (optional env variable)
        // Default to disabled to prevent connection attempts
        const reverbEnabled = import.meta.env.VITE_REVERB_ENABLED === 'true';
        if (!reverbEnabled) {
            console.log('Reverb is disabled. Real-time updates will not be available.');
            setStatus('Disabled');
            return;
        }

        // Initialize Laravel Echo with Reverb
        const initEcho = async () => {
            try {
                // Set Pusher on window object
                window.Pusher = Pusher;

                // Create Echo instance with error handling
                echoRef.current = new Echo({
                    broadcaster: 'reverb',
                    key: import.meta.env.VITE_REVERB_APP_KEY,
                    wsHost: import.meta.env.VITE_REVERB_HOST || 'localhost',
                    wsPort: import.meta.env.VITE_REVERB_PORT || 8080,
                    wssPort: import.meta.env.VITE_REVERB_PORT || 8080,
                    forceTLS: false, // Set to false for local development
                    enabledTransports: ['ws'], // Only use 'ws' for local, not 'wss'
                    disableStats: true,
                    // Add connection timeout
                    activityTimeout: 30000,
                    pongTimeout: 6000,
                });

                // Listen to connection state
                echoRef.current.connector.pusher.connection.bind('connected', () => {
                    setIsConnected(true);
                    setStatus('Connected');
                    setMessages(prev => [
                        ...prev,
                        {
                            type: 'system',
                            text: 'Connected to Reverb server',
                            time: new Date().toLocaleTimeString()
                        }
                    ]);
                });

                echoRef.current.connector.pusher.connection.bind('disconnected', () => {
                    setIsConnected(false);
                    setStatus('Disconnected');
                });

                echoRef.current.connector.pusher.connection.bind('connecting', () => {
                    setStatus('Connecting...');
                });

                // Handle connection errors gracefully
                echoRef.current.connector.pusher.connection.bind('error', (error: any) => {
                    console.warn('Pusher connection error (non-critical):', error);
                    setIsConnected(false);
                    setStatus('Connection Failed');
                    // Don't show error to user - just log it
                    // The app will continue to work without real-time updates
                });

                // Handle failed connection attempts
                echoRef.current.connector.pusher.connection.bind('failed', () => {
                    console.warn('Pusher connection failed. Real-time updates unavailable.');
                    setIsConnected(false);
                    setStatus('Connection Failed');
                });

                // Handle state changes
                echoRef.current.connector.pusher.connection.bind('state_change', (states: any) => {
                    if (states.current === 'failed' || states.current === 'unavailable') {
                        console.warn('Pusher connection unavailable. App will continue without real-time updates.');
                        setIsConnected(false);
                        setStatus('Unavailable');
                    }
                });

                // Subscribe to a channel - replace 'test-channel' with your channel
                const channel = echoRef.current.channel('tasks');

                // Listen for events - replace 'test.event' with your event
                channel.listen('.tasks.updated.' + user.id, (data: EventData) => {
                    console.log("✅ Event received:", data);
                    setEventData(data);
                    setMessages(prev => [
                        ...prev,
                        {
                            type: 'received',
                            text: data.message || JSON.stringify(data),
                            user: data.user || 'System',
                            time: new Date().toLocaleTimeString()
                        }
                    ]);

                    toast.success(data.message);
                    store.dispatch(taskApi.util.invalidateTags(['Task']));

                });

                // Optional: Listen for subscription success
                channel.subscription.bind('pusher:subscription_succeeded', () => {
                    console.log('✅ Successfully subscribed to the channel');
                });

                // Handle subscription errors gracefully
                channel.subscription.bind('pusher:subscription_error', (error: any) => {
                    console.warn('Channel subscription error (non-critical):', error);
                    // Don't throw - just log the error
                });

            } catch (error) {
                // Silently handle connection errors - don't break the app
                console.warn('Echo initialization failed (non-critical). Real-time updates will not be available:', error);
                setStatus('Unavailable');
                setIsConnected(false);
                // Don't add error message to UI - app continues to work
            }
        };

        initEcho();

        // Cleanup
        return () => {
            if (echoRef.current) {
                echoRef.current.disconnect();
            }
        };
    }, [user]);

    return {
        eventData,
        messages,
        input,
        setInput,
        isConnected,
        status,
        echo: echoRef.current
    };
}
