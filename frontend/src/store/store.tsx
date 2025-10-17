import { configureStore } from '@reduxjs/toolkit';

import authReducer from './authSlice';
import generalSlice from './generalSlice';
import { authApi } from '@/services/authApi';
import { taskApi } from '@/services/taskApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    general:generalSlice,
    [authApi.reducerPath]: authApi.reducer,
    [taskApi.reducerPath]: taskApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      taskApi.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;