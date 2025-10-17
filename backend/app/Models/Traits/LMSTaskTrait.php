<?php

namespace App\Models\Traits;

/**
 * LMS Integration Trait
 * Enables tasks to link with courses, quizzes, and learning activities
 * Use Case: Course assignments, quiz tasks, training modules
 */
trait LMSTaskTrait {
    
    /**
     * Link task to course
     */
    public function linkToCourse(string $courseId, string $courseName = null) {
        $this->meta = $this->meta ?? [];
        $this->meta['lms_course_id'] = $courseId;
        $this->meta['lms_course_name'] = $courseName;
        $this->meta['lms_context'] = 'course_task';
        $this->save();
        return $this;
    }

    /**
     * Link task to quiz
     */
    public function linkToQuiz(string $quizId, float $passingScore = 80) {
        $this->meta = $this->meta ?? [];
        $this->meta['lms_quiz_id'] = $quizId;
        $this->meta['lms_passing_score'] = $passingScore;
        $this->meta['lms_context'] = 'quiz_task';
        $this->meta['lms_type'] = 'quiz';
        $this->save();
        return $this;
    }

    /**
     * Mark as course assignment
     */
    public function markAsCourseAssignment(string $assignmentType = 'homework') {
        $this->meta = $this->meta ?? [];
        $this->meta['lms_type'] = 'assignment';
        $this->meta['assignment_type'] = $assignmentType; // homework, project, discussion
        $this->save();
        return $this;
    }

    /**
     * Record quiz completion score
     */
    public function recordQuizScore(float $score, bool $passed) {
        $this->meta = $this->meta ?? [];
        $this->meta['quiz_score'] = $score;
        $this->meta['quiz_passed'] = $passed;
        $this->meta['quiz_completion_date'] = now()->toDateString();
        $this->save();
        return $this;
    }

    /**
     * Get LMS context
     */
    public function getLMSContext() {
        return $this->meta['lms_context'] ?? null;
    }

    /**
     * Get linked course ID
     */
    public function getLinkedCourseId() {
        return $this->meta['lms_course_id'] ?? null;
    }

    /**
     * Get LMS task type
     */
    public function getLMSType() {
        return $this->meta['lms_type'] ?? null;
    }

    /**
     * Check if quiz passed
     */
    public function isQuizPassed() {
        return $this->meta['quiz_passed'] ?? false;
    }
}