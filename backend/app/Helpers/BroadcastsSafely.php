<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Log;

trait BroadcastsSafely
{
    /**
     * Safely dispatch a broadcast event without throwing errors
     * 
     * @param mixed $event The event to dispatch
     * @return void
     */
    protected function safeBroadcast($event): void
    {
        try {
            event($event);
        } catch (\Illuminate\Broadcasting\BroadcastException $e) {
            // Log but don't throw - broadcasting is optional
            Log::warning('Broadcasting failed (non-critical): ' . $e->getMessage(), [
                'event' => get_class($event),
            ]);
        } catch (\Exception $e) {
            // Catch any other broadcasting-related errors
            Log::warning('Broadcasting error (non-critical): ' . $e->getMessage(), [
                'event' => get_class($event),
            ]);
        }
    }
}
