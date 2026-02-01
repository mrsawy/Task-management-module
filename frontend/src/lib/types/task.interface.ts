export interface Task {
    id: number;
    creator_id: number;
    assignee_id: number;
    title: string;
    description?: string;
    due_date: string;
    priority: 'low' | 'medium' | 'high';
    status: 'to-do' | 'in-progress' | 'review' | 'done';
    is_completed?: boolean; // Computed from status === 'done' for backward compatibility
    created_at: string;
    updated_at: string;
    creator?: {
        id: number;
        name: string;
        email: string;
    };
    assignee?: {
        id: number;
        name: string;
        email: string;
    };
    dependencies?: Task[];
    dependents?: Task[];
}

export interface CreateTaskRequest {
    title: string;
    description?: string;
    due_date: string;
    priority: 'low' | 'medium' | 'high';
    status?: 'to-do' | 'in-progress' | 'review' | 'done';
    assignee_id: number;
    dependency_ids?: number[];
    dependent_ids?: number[];
}

export interface UpdateTaskRequest {
    id: number;
    title?: string;
    description?: string;
    due_date?: string;
    priority?: 'low' | 'medium' | 'high';
    status?: 'to-do' | 'in-progress' | 'review' | 'done';
    is_completed?: boolean;
    dependency_ids?: number[];
    dependent_ids?: number[];
}
