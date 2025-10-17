<?php

namespace App\Events;

use App\Models\Task;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TaskAssigned {
    use Dispatchable, SerializesModels;

    public function __construct(public Task $task) {}
}