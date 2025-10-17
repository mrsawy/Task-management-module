<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Routing\Controller as BaseController;

class BroadcastController extends BaseController
{
    public function __construct()
    {
        $this->middleware('auth:api');
    }

    /**
     * Authenticate the request for channel access.
     */
    public function authenticate(Request $request)
    {
        var_dump($request);
        return Broadcast::auth($request);
    }
}
