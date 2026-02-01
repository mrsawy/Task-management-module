<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create permissions
        $permissions = [
            // Task permissions
            ['subject' => 'tasks', 'action' => 'create'],
            ['subject' => 'tasks', 'action' => 'update'],
            ['subject' => 'tasks', 'action' => 'assign'],
            ['subject' => 'tasks', 'action' => 'view_all'],
            ['subject' => 'tasks', 'action' => 'view_assigned'],
            ['subject' => 'tasks', 'action' => 'update_status'],
            // User permissions
            ['subject' => 'users', 'action' => 'create'],
            ['subject' => 'users', 'action' => 'update'],
            ['subject' => 'users', 'action' => 'delete'],
            ['subject' => 'users', 'action' => 'view_all'],
        ];

        foreach ($permissions as $permissionData) {
            Permission::updateOrCreate($permissionData);
        }

        // Create Manager role
        $managerRole = Role::updateOrCreate(['name' => 'manager']);

        // Assign permissions to Manager
        $managerPermissions = Permission::where(function ($query) {
            $query->where('subject', 'tasks')
                ->whereIn('action', ['create', 'update', 'assign', 'view_all']);
        })->orWhere(function ($query) {
            $query->where('subject', 'users')
                ->whereIn('action', ['create', 'update', 'delete', 'view_all']);
        })->pluck('id');
        $managerRole->permissions()->sync($managerPermissions);

        // Create Worker role
        $workerRole = Role::updateOrCreate(['name' => 'worker']);

        // Assign permissions to Worker
        $workerPermissions = Permission::whereIn('subject', ['tasks'])
            ->whereIn('action', ['view_assigned', 'update_status'])
            ->pluck('id');
        $workerRole->permissions()->sync($workerPermissions);
    }
}
