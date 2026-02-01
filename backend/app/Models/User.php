<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
// use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    // use Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
        'created_by_id',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    // JWT Methods
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [];
    }
    public function tasks()
    {
        return $this->hasMany(Task::class);
    }

    /**
     * Get the user's role
     */
    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * Check if user has a specific permission by subject and action
     */
    public function hasPermission(string $subject, string $action): bool
    {
        return $this->role?->hasPermission($subject, $action) ?? false;
    }

    /**
     * Check if user has a permission by identifier (subject.action format)
     */
    public function hasPermissionByIdentifier(string $identifier): bool
    {
        return $this->role?->hasPermissionByIdentifier($identifier) ?? false;
    }

    /**
     * Check if user has a specific role
     */
    public function hasRole(string $roleName): bool
    {
        return $this->role?->name === $roleName;
    }

    /**
     * Get the user who created this user
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    /**
     * Get all users created by this user
     */
    public function createdUsers()
    {
        return $this->hasMany(User::class, 'created_by_id');
    }
}
