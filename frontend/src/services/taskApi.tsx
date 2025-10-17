import { VITE_API_URL } from '@/lib/constants';
import type { CreateTaskRequest, Task, UpdateTaskRequest } from '@/lib/types/task.interface';
import type { RootState } from '@/store/store';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';




export const taskApi = createApi({
    reducerPath: 'taskApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${import.meta.env.VITE_API_URL || VITE_API_URL}/tasks`,
        prepareHeaders: (headers, { getState }) => {
            const token = (getState() as RootState).auth.token;
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ['Task','User'],
    endpoints: (builder) => ({
        getTasks: builder.query<{ data: Task[], success: boolean }, void>({
            query: () => '/',
            providesTags: ['Task'],
        }),
        getCreatedTasks: builder.query<{ data: Task[], success: boolean }, void>({
            query: () => '/created',
            providesTags: ['Task'],
        }),
        createTask: builder.mutation<Task, CreateTaskRequest>({
            query: (task) => ({
                url: '/',
                method: 'POST',
                body: task,
            }),
            invalidatesTags: ['Task','User'],
        }),
        updateTask: builder.mutation<Task, UpdateTaskRequest>({
            query: ({ id, ...patch }) => ({
                url: `/${id}`,
                method: 'PUT',
                body: patch,
            }),
            invalidatesTags: ['Task','User'],
        }),
        deleteTask: builder.mutation<void, number>({
            query: (id) => ({
                url: `/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Task','User'],
        }),
        toggleComplete: builder.mutation<Task, number>({
            query: (id) => ({
                url: `/${id}/complete`,
                method: 'PUT',
            }),
            invalidatesTags: ['Task','User'],
        }),
        reassignTask: builder.mutation<Task, { id: number; assignee_email: string  }>({
            query: ({ id, assignee_email }) => ({
                url: `/${id}/assign`,
                method: 'PUT',
                body: { assignee_email },
            }),
            invalidatesTags: ['Task','User'],
        }),
    }),
});

export const {
    useGetTasksQuery,
    useGetCreatedTasksQuery,
    useCreateTaskMutation,
    useUpdateTaskMutation,
    useDeleteTaskMutation,
    useToggleCompleteMutation,
    useReassignTaskMutation,
} = taskApi;