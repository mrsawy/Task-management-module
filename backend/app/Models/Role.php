<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    protected $fillable = [
        'name',
    ];

    /**
     * Get all permissions for this role
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'role_permissions');
    }

    /**
     * Check if role has a specific permission by subject and action
     */
    public function hasPermission(string $subject, string $action): bool
    {
        return $this->permissions()
            ->where('subject', $subject)
            ->where('action', $action)
            ->exists();
    }

    /**
     * Check if role has a permission by identifier (subject.action format)
     */
    public function hasPermissionByIdentifier(string $identifier): bool
    {
        [$subject, $action] = explode('.', $identifier, 2);
        return $this->hasPermission($subject, $action);
    }

    /**
     * Get all users with this role
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
