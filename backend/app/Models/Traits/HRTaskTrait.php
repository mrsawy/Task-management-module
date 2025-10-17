<?php

namespace App\Models\Traits;

/**
 * HR Integration Trait
 * Enables tasks to link with HR employee profiles and workflows
 * Use Case: Onboarding checklists, training assignments, performance reviews
 */
trait HRTaskTrait
{

    /**
     * Link task to HR employee profile
     */
    public function linkToEmployee(int $employeeId)
    {
        $this->meta = $this->meta ?? [];
        $this->meta['hr_employee_id'] = $employeeId;
        $this->meta['hr_context'] = 'employee_task';
        $this->save();
        return $this;
    }

    /**
     * Link task to HR department workflow
     */
    public function linkToDepartment(string $departmentId)
    {
        $this->meta = $this->meta ?? [];
        $this->meta['hr_department_id'] = $departmentId;
        $this->meta['hr_context'] = 'department_task';
        $this->save();
        return $this;
    }

    /**
     * Mark as part of onboarding process
     */
    public function markAsOnboarding(int $employeeId, string $stage = 'initial')
    {
        $this->meta = $this->meta ?? [];
        $this->meta['hr_type'] = 'onboarding';
        $this->meta['hr_employee_id'] = $employeeId;
        $this->meta['onboarding_stage'] = $stage; // initial, training, certification, completion
        $this->save();
        return $this;
    }

    /**
     * Get HR context
     */
    public function getHRContext()
    {
        return $this->meta['hr_context'] ?? null;
    }

    /**
     * Get linked employee ID
     */
    public function getLinkedEmployeeId()
    {
        return $this->meta['hr_employee_id'] ?? null;
    }

    /**
     * Get HR task type
     */
    public function getHRType()
    {
        return $this->meta['hr_type'] ?? null;
    }
}
