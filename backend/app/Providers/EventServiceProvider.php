<?php

namespace App\Providers;

use App\Events\TaskAssigned;
use App\Events\TaskCompleted;
use App\Listeners\SendTaskAssignmentNotification;
use App\Listeners\SendTaskCompletionNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        TaskAssigned::class => [
            SendTaskAssignmentNotification::class,
        ],
    ];
}
