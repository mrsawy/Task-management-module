<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SanitizeInput {
    public function handle(Request $request, Closure $next): Response {
        // Sanitize all input fields
        $this->sanitizeInputs($request);
        return $next($request);
    }

    private function sanitizeInputs(Request $request) {
        $sanitized = [];
        
        foreach ($request->all() as $key => $value) {
            if (is_string($value)) {
                // Remove HTML tags and encode special characters
                $sanitized[$key] = $this->sanitize($value);
            } elseif (is_array($value)) {
                $sanitized[$key] = array_map([$this, 'sanitize'], $value);
            } else {
                $sanitized[$key] = $value;
            }
        }
        
        $request->replace($sanitized);
    }

    private function sanitize($value) {
        // Remove script tags and dangerous HTML
        $value = strip_tags($value);
        
        // Encode special characters to prevent XSS
        $value = htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
        
        // Remove any null bytes
        $value = str_replace(chr(0), '', $value);
        
        return trim($value);
    }
}