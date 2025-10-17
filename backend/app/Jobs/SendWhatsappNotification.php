<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Foundation\Events\Dispatchable;

class SendWhatsappNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $userId;
    public $message;

    public function __construct($userId, $message)
    {
        $this->userId = $userId;
        $this->message = $message;
    }

    public function handle()
    {
        try {
            // Example: integrate with your WhatsApp service here
            // WhatsappService::send($this->userId, $this->message);

            Log::info("WhatsApp notification sent to user {$this->userId}: {$this->message}");
        } catch (\Exception $e) {
            Log::error("WhatsApp notification failed for user {$this->userId}: " . $e->getMessage());
        }
    }
}
