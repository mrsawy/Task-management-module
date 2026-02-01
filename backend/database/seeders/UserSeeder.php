<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * This seeder creates users with roles that have the following permissions:
     * 
     * Managers have ALL permissions:
     * - Tasks: create, update, assign, view_all
     * - Users: create, update, delete, view_all
     * 
     * Workers have limited permissions:
     * - Tasks: view_assigned, update_status
     * - Users: none
     */
    public function run(): void
    {
        // Get roles
        $managerRole = Role::where('name', 'manager')->first();
        $workerRole = Role::where('name', 'worker')->first();

        if (!$managerRole || !$workerRole) {
            $this->command->error('Roles not found. Please run RoleSeeder first.');
            return;
        }

        // Verify manager role has all user management permissions
        $requiredUserPermissions = ['create', 'update', 'delete', 'view_all'];
        $managerUserPermissions = $managerRole->permissions()
            ->where('subject', 'users')
            ->pluck('action')
            ->toArray();

        $missingPermissions = array_diff($requiredUserPermissions, $managerUserPermissions);

        if (!empty($missingPermissions)) {
            $this->command->warn('Manager role is missing user permissions: ' . implode(', ', $missingPermissions));
            $this->command->warn('Please run RoleSeeder to ensure all permissions are assigned.');
        } else {
            $this->command->info('✓ Manager role has all user management permissions (create, update, delete, view_all)');
        }

        // Create first Manager user (created by themselves - system user)
        $firstManager = User::updateOrCreate(
            ['email' => 'manager@example.com'],
            [
                'name' => 'John Manager',
                'email' => 'manager@example.com',
                'password' => Hash::make('password'),
                'role_id' => $managerRole->id,
                'created_by_id' => null, // First user created by system
            ]
        );

        // Create second Manager user (created by first manager)
        $secondManager = User::updateOrCreate(
            ['email' => 'sarah.manager@example.com'],
            [
                'name' => 'Sarah Manager',
                'email' => 'sarah.manager@example.com',
                'password' => Hash::make('password'),
                'role_id' => $managerRole->id,
                'created_by_id' => $firstManager->id,
            ]
        );

        // Create Worker users (all created by first manager)
        $workers = [
            [
                'name' => 'Alice Worker',
                'email' => 'worker@example.com',
                'password' => Hash::make('password'),
                'role_id' => $workerRole->id,
                'created_by_id' => $firstManager->id,
            ],
            [
                'name' => 'Bob Worker',
                'email' => 'bob.worker@example.com',
                'password' => Hash::make('password'),
                'role_id' => $workerRole->id,
                'created_by_id' => $firstManager->id,
            ],
            [
                'name' => 'Charlie Worker',
                'email' => 'charlie.worker@example.com',
                'password' => Hash::make('password'),
                'role_id' => $workerRole->id,
                'created_by_id' => $firstManager->id,
            ],
        ];

        foreach ($workers as $workerData) {
            User::updateOrCreate(
                ['email' => $workerData['email']],
                $workerData
            );
        }

        $this->command->info('');
        $this->command->info('Users seeded successfully!');
        $this->command->info('');
        $this->command->info('=== Manager Accounts (Full Permissions) ===');
        $this->command->info('Managers have permissions for:');
        $this->command->info('  - Tasks: create, update, assign, view_all');
        $this->command->info('  - Users: create, update, delete, view_all');
        $this->command->info('');
        $this->command->info('Manager emails:');
        $this->command->info('  - manager@example.com');
        $this->command->info('  - sarah.manager@example.com');
        $this->command->info('');
        $this->command->info('=== Worker Accounts (Limited Permissions) ===');
        $this->command->info('Workers have permissions for:');
        $this->command->info('  - Tasks: view_assigned, update_status');
        $this->command->info('  - Users: none');
        $this->command->info('');
        $this->command->info('Worker emails:');
        $this->command->info('  - worker@example.com');
        $this->command->info('  - bob.worker@example.com');
        $this->command->info('  - charlie.worker@example.com');
        $this->command->info('');
        $this->command->info('Default password for all users: password');
        $this->command->info('');
    }
}
