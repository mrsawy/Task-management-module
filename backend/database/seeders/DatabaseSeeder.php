<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed roles first
        $this->call(RoleSeeder::class);

        // Seed users (managers and workers)
        $this->call(UserSeeder::class);

        // Seed tasks (with dependencies and dependents)
        $this->call(TaskSeeder::class);
    }
}
