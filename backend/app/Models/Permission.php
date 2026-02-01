<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Permission extends Model
{
    protected $fillable = [
        'subject',
        'action',
    ];

    /**
     * Get all roles that have this permission
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_permissions');
    }

    /**
     * Get permission identifier (subject.action format)
     */
    public function getIdentifierAttribute(): string
    {
        return "{$this->subject}.{$this->action}";
    }
}
