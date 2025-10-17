<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Support\Facades\Log;

class Tasks implements ShouldBroadcast
{
    public $assignee_id;
    public $message;

    public function __construct($assignee_id, $message)
    {
        $this->assignee_id = $assignee_id;
        $this->message = $message;
    }

    public function broadcastOn()
    {
        return [new Channel('tasks')]; // Public channel
    }

    public function broadcastAs()
    {
        return 'tasks.updated.' . $this->assignee_id;
    }

    public function broadcastWith()
    {

        return ['message' =>  $this->message];
    }
}
