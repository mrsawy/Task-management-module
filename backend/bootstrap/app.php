<?php

use App\Http\Middleware\SanitizeInput;
use App\Http\Middleware\SecurityMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->api(prepend: [SecurityMiddleware::class]);
        $middleware->api(prepend: [SanitizeInput::class]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {})->create();
