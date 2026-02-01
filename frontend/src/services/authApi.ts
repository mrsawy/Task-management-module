import { VITE_API_URL } from '@/lib/constants';
import type { AuthResponse, LoginRequest, SignupRequest, User } from '@/lib/types/auth.interface';
import type { RootState } from '@/store/store';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';



export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL || VITE_API_URL}/auth`,
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
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User']
    }),
    signup: builder.mutation<AuthResponse, SignupRequest>({
      query: (userData) => ({
        url: '/signup',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['User']
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/logout',
        method: 'POST',
      }),
      invalidatesTags: ['User']
    }),
    me: builder.query<User, void>({
      queryFn: async (_, _queryApi) => {
        const baseUrl = `${import.meta.env.VITE_API_URL || VITE_API_URL}`;
        const token = (_queryApi.getState() as RootState).auth.token;

        const result = await fetch(`${baseUrl}/users/me`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
        });

        if (!result.ok) {
          return { error: { status: result.status, data: await result.json() } };
        }

        const data = await result.json();
        return { data };
      },
      providesTags: ['User'],
    }),
    refresh: builder.mutation<AuthResponse, void>({
      query: () => ({
        url: '/refresh',
        method: 'POST',
      }),
      invalidatesTags: ['User']
    }),
  }),
});

export const {
  useLoginMutation,
  useSignupMutation,
  useLogoutMutation,
  useMeQuery,
  useRefreshMutation,
} = authApi;