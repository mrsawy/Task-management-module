export interface Task {
    id: number;
    creator_id: number;
    assignee_id: number;
    title: string;
    description?: string;
    due_date: string;
    priority: 'low' | 'medium' | 'high';
    is_completed: boolean;
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
}

export interface CreateTaskRequest {
    title: string;
    description?: string;
    due_date: string;
    priority: 'low' | 'medium' | 'high';
    assignee_email: string;
}

export interface UpdateTaskRequest {
    id: number;
    title?: string;
    description?: string;
    due_date?: string;
    priority?: 'low' | 'medium' | 'high';
    is_completed: boolean
}
