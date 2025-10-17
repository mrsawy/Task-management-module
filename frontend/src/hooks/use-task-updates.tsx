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
        // Initialize Laravel Echo with Reverb
        const initEcho = async () => {
            try {
                // Set Pusher on window object
                window.Pusher = Pusher;

                // Create Echo instance
                echoRef.current = new Echo({
                    broadcaster: 'reverb',
                    key: import.meta.env.VITE_REVERB_APP_KEY,
                    wsHost: import.meta.env.VITE_REVERB_HOST || 'localhost',
                    wsPort: import.meta.env.VITE_REVERB_PORT || 8080,
                    wssPort: import.meta.env.VITE_REVERB_PORT || 8080,
                    forceTLS: false, // Set to false for local development
                    enabledTransports: ['ws'], // Only use 'ws' for local, not 'wss'
                    disableStats: true,
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

            } catch (error) {
                console.error('Echo initialization error:', error);
                setStatus('Connection Error');
                setMessages(prev => [
                    ...prev,
                    {
                        type: 'error',
                        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        time: new Date().toLocaleTimeString()
                    }
                ]);
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
