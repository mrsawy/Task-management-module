<?php

namespace App\Listeners;

use Illuminate\Support\Facades\Log;

class BroadcastUpdateListener
{
    /**
     * Handle the event.
     */
    public function handle($event): void
    {
        Log::info('Broadcasting update received', [
            'event' => get_class($event),
            'data' => $event,
        ]);
    }
}
