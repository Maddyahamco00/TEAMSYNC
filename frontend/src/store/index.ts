import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import userReducer from './userSlice';
import workspaceReducer from './workspaceSlice';
import messageReducer from './messageSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    workspace: workspaceReducer,
    message: messageReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;