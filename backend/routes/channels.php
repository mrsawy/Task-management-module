<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('privateChannels', function ($user, $userId) {
    // Authorize only if the authenticated user's ID matches the channel userId
    return (int) $user->id === (int) $userId;
});
