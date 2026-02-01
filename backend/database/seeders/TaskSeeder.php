<?php

namespace Database\Seeders;

use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class TaskSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * Creates tasks for each user with dependencies and dependents
     */
    public function run(): void
    {
        $users = User::with('role')->get();
        
        if ($users->isEmpty()) {
            $this->command->error('No users found. Please run UserSeeder first.');
            return;
        }

        $managers = $users->filter(function ($user) {
            return $user->role?->name === 'manager';
        })->values();
        
        $workers = $users->filter(function ($user) {
            return $user->role?->name === 'worker';
        })->values();

        if ($managers->isEmpty() || $workers->isEmpty()) {
            $this->command->error('Both managers and workers are required. Please run UserSeeder first.');
            return;
        }

        $allTasks = collect();

        // Create tasks for each user
        foreach ($users as $user) {
            $isManager = $user->role?->name === 'manager';
            $userTasks = $this->createTasksForUser($user, $isManager, $managers, $workers);
            $allTasks = $allTasks->merge(collect($userTasks));
        }

        // Set up dependencies and dependents
        $this->createDependencies($allTasks);

        $this->command->info('');
        $this->command->info('Tasks seeded successfully!');
        $this->command->info('Total tasks created: ' . $allTasks->count());
        $this->command->info('');
    }

    /**
     * Create tasks for a specific user
     */
    private function createTasksForUser(User $user, bool $isManager, $managers, $workers): array
    {
        $tasks = [];
        $now = Carbon::now();
        
        // Determine creator (managers create tasks, workers can also create their own)
        $creator = $isManager ? $user : ($managers->first() ?? $user);
        
        // Determine assignee (mix of self and others)
        $assignees = $isManager 
            ? $workers->merge([$user]) 
            : collect([$user, $managers->first()])->filter();

        // Task templates with different scenarios
        $taskTemplates = [
            // Independent tasks
            [
                'title' => 'Review project documentation',
                'description' => 'Review and update project documentation for accuracy',
                'priority' => 'medium',
                'status' => 'to-do',
                'days_offset' => 5,
            ],
            [
                'title' => 'Prepare meeting agenda',
                'description' => 'Create agenda for weekly team meeting',
                'priority' => 'high',
                'status' => 'in-progress',
                'days_offset' => 2,
            ],
            [
                'title' => 'Update user guide',
                'description' => 'Update user guide with latest features',
                'priority' => 'low',
                'status' => 'review',
                'days_offset' => 7,
            ],
            [
                'title' => 'Complete code review',
                'description' => 'Review pull requests and provide feedback',
                'priority' => 'high',
                'status' => 'done',
                'days_offset' => -2, // Past date
            ],
            [
                'title' => 'Write unit tests',
                'description' => 'Write comprehensive unit tests for new features',
                'priority' => 'medium',
                'status' => 'to-do',
                'days_offset' => 10,
            ],
            [
                'title' => 'Deploy to staging',
                'description' => 'Deploy latest changes to staging environment',
                'priority' => 'high',
                'status' => 'in-progress',
                'days_offset' => 1,
            ],
            [
                'title' => 'Fix critical bug',
                'description' => 'Fix critical bug reported by QA team',
                'priority' => 'high',
                'status' => 'review',
                'days_offset' => 0, // Today
            ],
            [
                'title' => 'Update dependencies',
                'description' => 'Update project dependencies to latest versions',
                'priority' => 'low',
                'status' => 'done',
                'days_offset' => -5,
            ],
        ];

        // Create 2-3 tasks per user
        $taskCount = $isManager ? 3 : 2;
        $selectedTemplates = collect($taskTemplates)->random(min($taskCount, count($taskTemplates)));

        foreach ($selectedTemplates as $index => $template) {
            $assignee = $assignees->random();
            
            $task = Task::create([
                'creator_id' => $creator->id,
                'assignee_id' => $assignee->id,
                'title' => $template['title'] . ($index > 0 ? ' ' . ($index + 1) : ''),
                'description' => $template['description'],
                'due_date' => $now->copy()->addDays($template['days_offset']),
                'priority' => $template['priority'],
                'status' => $template['status'],
            ]);

            $tasks[] = $task;
        }

        return $tasks;
    }

    /**
     * Create dependencies and dependents between tasks
     */
    private function createDependencies($allTasks): void
    {
        // Ensure we have a collection of Task models
        $tasks = $allTasks instanceof \Illuminate\Support\Collection 
            ? $allTasks->shuffle() 
            : collect($allTasks)->shuffle();
            
        $taskCount = $tasks->count();

        if ($taskCount < 2) {
            return;
        }

        // Create dependency chains
        // Group tasks by assignee to create logical dependencies
        $tasksByAssignee = $tasks->groupBy('assignee_id');

        foreach ($tasksByAssignee as $assigneeId => $userTasks) {
            // Keep as collection to preserve Task model instances
            $userTaskList = $userTasks->values();
            $userTaskCount = $userTaskList->count();

            if ($userTaskCount < 2) {
                continue;
            }

            // Create a chain: Task 2 depends on Task 1, Task 3 depends on Task 2, etc.
            // This means later tasks cannot be completed until earlier tasks are done
            for ($i = 1; $i < $userTaskCount; $i++) {
                /** @var Task $currentTask */
                $currentTask = $userTaskList->get($i);
                /** @var Task $previousTask */
                $previousTask = $userTaskList->get($i - 1);

                // Only create dependency if previous task is not done
                // This creates realistic scenarios where some tasks block others
                if ($previousTask->status !== 'done') {
                    $currentTask->addDependency($previousTask);
                }
            }

            // Create some cross-dependencies (tasks that depend on multiple tasks)
            if ($userTaskCount >= 3) {
                /** @var Task $task1 */
                $task1 = $userTaskList->get(0);
                /** @var Task $task2 */
                $task2 = $userTaskList->get(1);
                /** @var Task $task3 */
                $task3 = $userTaskList->get(2);

                // Task 3 depends on both Task 1 and Task 2 (both must be done before Task 3)
                if ($task1->status !== 'done' && $task2->status !== 'done') {
                    $task3->addDependency($task1);
                    $task3->addDependency($task2);
                }
            }
        }

        // Create some cross-user dependencies (tasks from different users)
        $allTaskList = $tasks->values();
        $crossDependencyCount = min(3, (int)($taskCount / 4));

        for ($i = 0; $i < $crossDependencyCount; $i++) {
            /** @var Task $task1 */
            $task1 = $allTaskList->random();
            /** @var Task $task2 */
            $task2 = $allTaskList->random();

            // Avoid self-dependency and same assignee
            if ($task1->id !== $task2->id && $task1->assignee_id !== $task2->assignee_id) {
                // Only create dependency if the dependency task is not done
                if ($task2->status !== 'done') {
                    $task1->addDependency($task2);
                }
            }
        }

        $this->command->info('Dependencies and dependents created successfully.');
    }
}
