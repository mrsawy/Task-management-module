<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;

class LMSTaskController extends Controller {
    
    /**
     * Create course assignment
     */
    public function createCourseAssignment(Request $request) {
        $validated = $request->validate([
            'course_id' => 'required|string',
            'course_name' => 'nullable|string',
            'assignee_email' => 'required|email|exists:users,email',
            'assignment_type' => 'required|in:homework,project,discussion',
            'title' => 'required|string',
            'description' => 'nullable|string',
            'due_date' => 'required|date',
        ]);

        $assignee = User::where('email', $validated['assignee_email'])->first();

        $task = Task::create([
            'creator_id' => $request->user()->id,
            'assignee_id' => $assignee->id,
            'title' => $validated['title'],
            'description' => $validated['description'],
            'due_date' => $validated['due_date'],
            'priority' => 'high',
            'meta' => [
                'lms_type' => 'assignment',
                'lms_course_id' => $validated['course_id'],
                'lms_course_name' => $validated['course_name'],
                'assignment_type' => $validated['assignment_type'],
                'lms_context' => 'course_task',
            ],
        ]);

        return response()->json([
            'message' => 'Course assignment created',
            'task' => $task,
        ], 201);
    }

    /**
     * Create quiz task
     */
    public function createQuizTask(Request $request) {
        $validated = $request->validate([
            'quiz_id' => 'required|string',
            'course_id' => 'required|string',
            'assignee_email' => 'required|email|exists:users,email',
            'title' => 'required|string',
            'passing_score' => 'nullable|numeric|min:0|max:100',
            'due_date' => 'required|date',
        ]);

        $assignee = User::where('email', $validated['assignee_email'])->first();

        $task = Task::create([
            'creator_id' => $request->user()->id,
            'assignee_id' => $assignee->id,
            'title' => $validated['title'],
            'description' => "Complete quiz for course: {$validated['course_id']}",
            'due_date' => $validated['due_date'],
            'priority' => 'high',
            'meta' => [
                'lms_type' => 'quiz',
                'lms_quiz_id' => $validated['quiz_id'],
                'lms_course_id' => $validated['course_id'],
                'lms_passing_score' => $validated['passing_score'] ?? 80,
                'lms_context' => 'quiz_task',
            ],
        ]);

        return response()->json([
            'message' => 'Quiz task created',
            'task' => $task,
        ], 201);
    }

    /**
     * Record quiz completion
     */
    public function recordQuizCompletion(Request $request, Task $task) {
        $validated = $request->validate([
            'score' => 'required|numeric|min:0|max:100',
        ]);

        $passingScore = $task->meta['lms_passing_score'] ?? 80;
        $passed = $validated['score'] >= $passingScore;

        $task->recordQuizScore($validated['score'], $passed);
        $task->update(['is_completed' => true]);

        return response()->json([
            'message' => 'Quiz completion recorded',
            'task' => $task,
            'score' => $validated['score'],
            'passed' => $passed,
            'passing_score' => $passingScore,
        ]);
    }

    /**
     * Get course progress
     */
    public function getCourseProgress(Request $request, string $courseId) {
        $tasks = Task::where('meta->lms_course_id', $courseId)
                     ->get();

        $completed = $tasks->where('is_completed', true)->count();
        $total = $tasks->count();

        $quizTasks = $tasks->where('meta.lms_type', 'quiz');
        $quizzesPassed = $quizTasks->where('meta.quiz_passed', true)->count();

        return response()->json([
            'course_id' => $courseId,
            'total_tasks' => $total,
            'completed_tasks' => $completed,
            'progress_percentage' => $total > 0 ? round(($completed / $total) * 100, 2) : 0,
            'quiz_tasks' => $quizTasks->count(),
            'quizzes_passed' => $quizzesPassed,
            'tasks' => $tasks,
        ]);
    }

    /**
     * Get learner transcript
     */
    public function getLearnerTranscript(Request $request, string $learnerId) {
        $user = User::where('id', $learnerId)->first();
        
        if (!$user) {
            return response()->json(['message' => 'Learner not found'], 404);
        }

        $tasks = Task::where('assignee_id', $learnerId)
                     ->where('meta->lms_type', '!=', null)
                     ->get();

        $quizTasks = $tasks->where('meta.lms_type', 'quiz');
        $assignmentTasks = $tasks->where('meta.lms_type', 'assignment');

        return response()->json([
            'learner_id' => $learnerId,
            'learner_name' => $user->name,
            'learner_email' => $user->email,
            'total_assignments' => $assignmentTasks->count(),
            'completed_assignments' => $assignmentTasks->where('is_completed', true)->count(),
            'total_quizzes' => $quizTasks->count(),
            'quizzes_passed' => $quizTasks->where('meta.quiz_passed', true)->count(),
            'average_quiz_score' => $quizTasks->avg('meta.quiz_score') ?? 0,
            'tasks' => $tasks,
        ]);
    }
}