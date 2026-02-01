<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  $subject  Permission subject (e.g., 'tasks')
     * @param  string|null  $action  Permission action (e.g., 'create'). If null, expects format 'subject.action'
     */
    public function handle(Request $request, Closure $next, string $subject, ?string $action = null): Response
    {
        /** @var User|null $user */
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Please log in.'
            ], 401);
        }

        // If action is null, assume format is 'subject.action' in the first parameter
        if ($action === null) {
            $parts = explode('.', $subject, 2);
            if (count($parts) === 2) {
                [$subject, $action] = $parts;
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid permission format. Use "subject.action" or provide subject and action separately.'
                ], 400);
            }
        }

        // Load role with permissions to avoid N+1 queries
        if (!$user->relationLoaded('role')) {
            $user->load('role.permissions');
        }

        if (!$user->hasPermission($subject, $action)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to perform this action.'
            ], 403);
        }

        return $next($request);
    }
}
