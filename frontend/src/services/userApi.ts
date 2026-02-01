import { VITE_API_URL } from '@/lib/constants';
import type { User } from '@/lib/types/auth.interface';
import type { RootState } from '@/store/store';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role_id: number;
}

export interface UpdateUserRequest {
  id: number;
  name?: string;
  email?: string;
  password?: string;
  role_id?: number;
}

export interface UsersResponse {
  success: boolean;
  data: User[];
}

export interface UserResponse {
  success: boolean;
  data: User;
}

export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL || VITE_API_URL}/users`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['User'],
  endpoints: (builder) => ({
    getUsers: builder.query<UsersResponse, void>({
      query: () => '/',
      providesTags: ['User'],
    }),
    getUser: builder.query<UserResponse, number>({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),
    createUser: builder.mutation<UserResponse, CreateUserRequest>({
      query: (user) => ({
        url: '/',
        method: 'POST',
        body: user,
      }),
      invalidatesTags: ['User'],
    }),
    updateUser: builder.mutation<UserResponse, UpdateUserRequest>({
      query: ({ id, ...patch }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'User', id }, 'User'],
    }),
    deleteUser: builder.mutation<{ success: boolean; message: string }, number>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
    getRoles: builder.query<{ success: boolean; data: Array<{ id: number; name: string }> }, void>({
      query: () => '/roles',
      providesTags: ['User'],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetRolesQuery,
} = userApi;
