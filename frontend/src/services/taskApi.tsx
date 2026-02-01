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
        getTask: builder.query<{ data: Task, success: boolean }, number>({
            query: (id) => `/${id}`,
            providesTags: (result, error, id) => [{ type: 'Task', id }],
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
        updateTask: builder.mutation<{ data: Task, success: boolean }, UpdateTaskRequest>({
            query: ({ id, ...patch }) => ({
                url: `/${id}`,
                method: 'PUT',
                body: patch,
            }),
            async onQueryStarted({ id, ...patch }, { dispatch, queryFulfilled }) {
                // Store previous state for rollback
                let previousTask: Task | null = null;
                let previousTaskIndex = -1;

                // Optimistic update: update the cache immediately
                const patchResult = dispatch(
                    taskApi.util.updateQueryData('getTasks', undefined, (draft) => {
                        if (draft?.data) {
                            const taskIndex = draft.data.findIndex((task) => task.id === id);
                            if (taskIndex !== -1) {
                                // Store previous state for rollback
                                previousTask = { ...draft.data[taskIndex] };
                                previousTaskIndex = taskIndex;
                                
                                // Optimistically update the task
                                draft.data[taskIndex] = {
                                    ...draft.data[taskIndex],
                                    ...patch,
                                };
                            }
                        }
                    })
                );

                // Also optimistically update getTask query if it exists
                const patchResultSingle = dispatch(
                    taskApi.util.updateQueryData('getTask', id, (draft) => {
                        if (draft?.data) {
                            previousTask = previousTask || { ...draft.data };
                            draft.data = {
                                ...draft.data,
                                ...patch,
                            };
                        }
                    })
                );

                try {
                    // Wait for the query to fulfill
                    const { data } = await queryFulfilled;
                    
                    // Update with server response (in case server returns different data)
                    dispatch(
                        taskApi.util.updateQueryData('getTasks', undefined, (draft) => {
                            if (draft?.data) {
                                const taskIndex = draft.data.findIndex((task) => task.id === id);
                                if (taskIndex !== -1) {
                                    draft.data[taskIndex] = data.data;
                                }
                            }
                        })
                    );
                    
                    // Also update getTask query with server response
                    dispatch(
                        taskApi.util.updateQueryData('getTask', id, (draft) => {
                            if (draft?.data) {
                                draft.data = data.data;
                            }
                        })
                    );
                } catch (error) {
                    // Rollback on error
                    if (previousTask && previousTaskIndex !== -1) {
                        dispatch(
                            taskApi.util.updateQueryData('getTasks', undefined, (draft) => {
                                if (draft?.data && previousTaskIndex !== -1) {
                                    draft.data[previousTaskIndex] = previousTask!;
                                }
                            })
                        );
                    }
                    
                    // Rollback single task query
                    if (previousTask) {
                        dispatch(
                            taskApi.util.updateQueryData('getTask', id, (draft) => {
                                if (draft?.data) {
                                    draft.data = previousTask!;
                                }
                            })
                        );
                    }
                }
            },
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
    useGetTaskQuery,
    useGetCreatedTasksQuery,
    useCreateTaskMutation,
    useUpdateTaskMutation,
    useDeleteTaskMutation,
    useToggleCompleteMutation,
    useReassignTaskMutation,
} = taskApi;