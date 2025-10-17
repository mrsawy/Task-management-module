<?php

namespace App\Listeners;

use App\Events\TaskAssigned;
use App\Jobs\SendWhatsappNotification;


class SendTaskAssignmentNotification
{
    
    public function __construct() {}

    public function handle(TaskAssigned $event)
    {
        SendWhatsappNotification::dispatch(
            $event->task->assignee_id,
            "You have been assigned a new task: {$event->task->title}"
        );
    }
}
