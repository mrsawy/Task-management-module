<?php

use Illuminate\Support\Facades\Route;

// Your catch-all route should EXCLUDE 'api' prefix
Route::get('/{any}', function () {
    return file_get_contents(storage_path('app/public/frontend/index.html'));
})->where('any', '^(?!api)(?!storage)(?!assets).*$');
