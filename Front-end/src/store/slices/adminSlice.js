// src/store/slices/adminSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../lib/axios";
import { APP_CONFIG } from "../../config/appConfig";

// ✅ دالة مساعدة لمعالجة مسار الصورة
export const getUserImageUrl = (photo) => {
  if (!photo) return '/assets/default-avatar.png';
  return photo.startsWith('http') 
    ? photo 
    : `${APP_CONFIG.api.baseUrl}/storage/${photo}`;
};

// ✅ التعديل 1: تحديث fetchAllAdminUsers لفلترة القيم النصية
export const fetchAllAdminUsers = createAsyncThunk(
  "admin/fetchAllUsers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/admin/get-all-users");
      
      const usersArray = Array.isArray(response.data?.data) 
        ? response.data.data 
        : [];
      
      // ✅ فصل المستخدمين حسب الحالة النصية الجديدة
      const activeUsers = usersArray.filter(u => u?.account_status === 'active');
      const inactiveUsers = usersArray.filter(u => u?.account_status === 'inactive');
      const bannedUsers = usersArray.filter(u => u?.account_status === 'banned');
      
      return {
        'active users': activeUsers,
        'deactive users': [...inactiveUsers, ...bannedUsers] // نجمعهم للعرض كـ "غير نشط"
      };
    } catch (error) {
      console.error('❌ Fetch Error:', error);
      return rejectWithValue(error.response?.data?.message || "فشل جلب المستخدمين");
    }
  }
);

// ✅ التعديل 2: تحديث toggleUserStatus لإرسال الحقول الصحيحة
export const toggleUserStatus = createAsyncThunk(
  "admin/toggleUserStatus",
  async ({ userId, accountStatus }, { rejectWithValue }) => {
    try {
      // ✅ PUT مع الـ ID في الـ URL، وبقية البيانات في الـ body
      const response = await api.put(`/api/admin/active-and-deactive/${userId}`, {
        account_status: String(accountStatus) // ✅ الحقل الصحيح
      });
      return response.data?.data || response.data;
    }catch (error) {
      console.error('❌ Toggle Status Error:', error);
      
      let errorMessage = "فشل تحديث حالة المستخدم";
      
      if (error.response?.data) {
        const data = error.response.data;
        if (data.errors && typeof data.errors === 'object') {
          errorMessage = Object.values(data.errors)[0]?.[0] || errorMessage;
        } else if (typeof data.message === 'string') {
          errorMessage = data.message;
        } else if (typeof data.message === 'object' && data.message !== null) {
          errorMessage = data.message?.message || Object.values(data.message)[0]?.[0] || 'بيانات غير صالحة';
        }
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);
// -------------------- الحالة الأولية --------------------
const initialState = {
  users: {
    'active users': [],
    'deactive users': [],
    'banned users': [],
  },
  loading: false,
  error: null,
  success: null
};

// ✅ التعديل 3: تحديث reducer لمعالجة القيم النصية
const adminSlice = createSlice({
  name: "admin",
  initialState: {
    users: { 'active users': [], 'deactive users': [] },
    loading: false,
    error: null,
    success: null
  },
  reducers: {
    clearMessages: (state) => { state.error = null; state.success = null; },
    updateUserLocally: (state, action) => {
      const updatedUser = action.payload;
      ['active users', 'deactive users'].forEach(key => {
        const idx = state.users[key].findIndex(u => u.id === updatedUser.id);
        if (idx !== -1) state.users[key].splice(idx, 1);
      });
      // ✅ مقارنة نصية بدلاً من رقمية
      const target = updatedUser.account_status === 'active' ? 'active users' : 'deactive users';
      state.users[target].push(updatedUser);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllAdminUsers.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAllAdminUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = {
          'active users': action.payload['active users'] || [],
          'deactive users': action.payload['deactive users'] || []
        };
      })
      .addCase(fetchAllAdminUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(toggleUserStatus.pending, (state) => { state.loading = true; })
      .addCase(toggleUserStatus.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload;
        ['active users', 'deactive users'].forEach(key => {
          const idx = state.users[key].findIndex(u => u.id === updated.id);
          if (idx !== -1) state.users[key].splice(idx, 1);
        });
        // ✅ مقارنة نصية
        const target = updated.account_status === 'active' ? 'active users' : 'deactive users';
        state.users[target].push(updated);
        
        // ✅ رسائل ديناميكية حسب الحالة
        const statusMessages = {
          'active': "✅ تم التفعيل",
          'inactive': "⏸️ تم التعطيل", 
          'banned': "🚫 تم الحظر"
        };
        state.success = statusMessages[updated.account_status] || "تم التحديث";
      })
      .addCase(toggleUserStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});
export const { clearMessages, updateUserLocally } = adminSlice.actions;
export default adminSlice.reducer;