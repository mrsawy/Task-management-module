<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Broadcasting\InteractsWithSockets;


class Tasks implements ShouldQueue, ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

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
