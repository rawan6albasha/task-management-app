import { configureStore } from "@reduxjs/toolkit";
import uiReducer from "./slices/uiSlice";
import authReducer from "./slices/authSlice";
import taskReducer from "./slices/taskSlice";
import projectReducer from "./slices/projectSlice";
import userReducer from "./slices/userSlice";
import adminReducer from "./slices/adminSlice";
import settingsReducer from "./slices/settingsSlice";
import notificationReducer from "./slices/notificationSlice";

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    auth: authReducer,
    tasks: taskReducer,
    project: projectReducer,
    users: userReducer,
    admin: adminReducer,
    settings: settingsReducer,
    notifications: notificationReducer,

  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["tasks/addToBatchDraft", "tasks/setTasks"],
        ignoredPaths: ["task.batchDraft.tasks", "task.tasks"],
      },
    }),
  devTools: process.env.NODE_ENV !== "production",
});