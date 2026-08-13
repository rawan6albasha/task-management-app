// src/store/slices/notificationSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../lib/axios";

// -------------------- جلب الإشعارات غير المقروءة --------------------
export const fetchUnreadNotifications = createAsyncThunk(
  "notifications/fetchUnread",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/admin/get-unread-notifications");
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch notifications");
    }
  }
);

// -------------------- تحديد إشعار كمقروء --------------------
export const markNotificationAsRead = createAsyncThunk(
  "notifications/markAsRead",
  async (notificationId, { rejectWithValue, dispatch }) => {
    try {
      // ✅ PUT مع الـ ID في الـ URL (لا يحتاج body)
      await api.put(`/api/notifications/mark-as-read/${notificationId}`);
      dispatch(notificationSlice.actions.markReadLocally(notificationId));
      return notificationId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to mark as read");
    }
  }
);

// -------------------- تحديد الكل كمقروء --------------------
export const markAllAsRead = createAsyncThunk(
  "notifications/markAllAsRead",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      // ✅ جلب آخر قائمة لتحديث العداد
      const response = await api.get("/api/admin/get-unread-notifications");
      const data = response.data?.data || response.data;
      dispatch(notificationSlice.actions.setNotifications(data.notifications || []));
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to mark all as read");
    }
  }
);

// -------------------- الحالة الأولية --------------------
const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  lastFetched: null
};

// -------------------- الـ Slice --------------------
const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    markReadLocally: (state, action) => {
      const index = state.notifications.findIndex(n => n.id === action.payload);
      if (index !== -1) {
        state.notifications[index].is_read = 1;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    setNotifications: (state, action) => {
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter(n => !n.is_read).length;
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Unread
      .addCase(fetchUnreadNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUnreadNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.notifications || [];
        state.unreadCount = action.payload.unread_count || 0;
        state.lastFetched = new Date().toISOString();
      })
      .addCase(fetchUnreadNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Mark as Read
      .addCase(markNotificationAsRead.pending, (state) => {
        state.loading = true;
      })
      .addCase(markNotificationAsRead.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Mark All as Read
      .addCase(markAllAsRead.pending, (state) => {
        state.loading = true;
      })
      .addCase(markAllAsRead.fulfilled, (state, action) => {
        state.loading = false;
        state.unreadCount = 0;
      })
      .addCase(markAllAsRead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// -------------------- Export Actions & Reducer --------------------
export const { markReadLocally, setNotifications, clearNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;