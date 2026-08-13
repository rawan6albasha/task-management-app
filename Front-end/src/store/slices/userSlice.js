// src/store/slices/userSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../lib/axios";

// جلب جميع المستخدمين (للقائمة في النموذج)
export const fetchAllUsers = createAsyncThunk(
  "users/fetchAll",
  async (filters = {}, { rejectWithValue }) => {
    try {
      // ✅ بناء الرابط مع البارامترات
      const params = new URLSearchParams();
      if (filters.branch_id) params.append("branch_id", filters.branch_id);
      if (filters.section_id) params.append("section_id", filters.section_id);
      if (filters.position_id)
        params.append("position_id", filters.position_id);
      if (filters.search) params.append("search", filters.search);

      const url = params.toString()
        ? `/api/admin/get-all-users?${params.toString()}`
        : "/api/admin/get-all-users";

      console.log("🌐 Fetching users from URL:", url);

      // ✅ إرسال الطلب
      const response = await api.get(url);

      // ✅ التشخيص
      console.log("📦 Full API Response:", response);
      console.log("📄 response.data:", response.data);

      // ✅ الـ interceptor يرجع response.data مباشرة
      // لذا نرجعها كما هي (بدون .data.data)
      return response.data;
    } catch (error) {
      console.error("❌ Fetch Users Error:", error);

      if (error.response?.status === 401 || error.response?.status === 403) {
        return rejectWithValue(null);
      }

      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch users",
      );
    }
  },
);

// ✅ جلب ملف تعريف المستخدم الحالي
export const fetchUserProfile = createAsyncThunk(
  "users/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/user"); // ✅ المسار الصحيح من الـ screenshot
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch profile",
      );
    }
  },
);

// ✅ جلب ملف تعريف مستخدم آخر (للمديرين)
export const fetchUserById = createAsyncThunk(
  "users/fetchById",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/get-user-profile", {
        user_id: userId,
      });
            // ✅ أضف هذا للـ debug
      console.log('📡 Raw API Response:', response);
      console.log('📦 Response Data:', response.data);
      console.log('📄 Response Data Data:', response.data.data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.message || "Failed to fetch user",
      );
    }
  },
);
// تحديث ملف تعريف المستخدم
// export const updateUserProfile = createAsyncThunk(
//   "users/updateProfile",
//   async (updates, { rejectWithValue, getState }) => {
//     try {
//       const formData = new FormData();

//       if (updates.name !== undefined) formData.append("name", updates.name);
//       if (updates.email !== undefined) formData.append("email", updates.email);
//       if (updates.photo instanceof File) {
//         formData.append("photo", updates.photo);
//       }

//       // ✅ تغيير من POST إلى PUT
//       const response = await api.put("/api/update-profile", formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       return response.data;
//     } catch (error) {
//       return rejectWithValue(
//         error.response?.data?.message || "Failed to update profile",
//       );
//     }
//   },
// );
export const updateUserProfile = createAsyncThunk(
  "users/updateProfile",
  async (updates, { rejectWithValue, getState, dispatch }) => { // ✅ إضافة dispatch هنا
    try {
      const formData = new FormData();
      formData.append('_method', 'PUT'); // ✅ حيلة Laravel لـ FormData مع PUT
      
      if (updates.name !== undefined) formData.append("name", updates.name);
      if (updates.email !== undefined) formData.append("email", updates.email);
      if (updates.photo instanceof File) {
        formData.append("photo", updates.photo);
      }

      const response = await api.post("/api/update-profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const profileData = response.data?.data || response.data;
      
      console.log('✅ Updated Profile Response:', profileData);
      
      // ✅ تحديث auth.user مباشرة إذا كان الـ ID مطابقاً
      const authState = getState().auth;
      if (authState?.user?.id === profileData?.id) {
        // ✅ استخدام action login لتحديث الـ auth state بشكل صحيح
        dispatch({
          type: 'auth/login', // ✅ تأكد أن هذا الـ action موجود في authSlice.js
          payload: {
            user: { ...authState.user, ...profileData },
            token: authState.token,
            isAuthenticated: true,
            permissions: authState.permissions || []
          }
        });
        console.log('✅ auth.user updated from thunk');
      }
      
      return profileData;
    } catch (error) {
      console.error('❌ Update Profile Error:', error);
      
      if (error.response?.status === 422) {
        const errors = error.response.data?.errors || error.response.data?.message;
        if (errors && typeof errors === 'object') {
          const messages = Object.values(errors).flat().join('\n');
          return rejectWithValue(`❌ خطأ في البيانات:\n${messages}`);
        }
      }
      
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to update profile",
      );
    }
  },
);

// في changePassword thunk
export const changePassword = createAsyncThunk(
  "users/changePassword",
  async (passwordData, { rejectWithValue }) => {
    try {
      // ✅ استخدم نفس الأسماء اللي في Postman
      const response = await api.post("/api/change-password", {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
        new_password_confirmation: passwordData.confirm_password  // ✅ نفس الاسم بالضبط
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Change Password Error:', error.response?.data);
      
      const errorMsg = error.response?.data?.message;
      
      if (typeof errorMsg === 'object' && errorMsg !== null) {
        const firstKey = Object.keys(errorMsg)[0];
        const firstMsg = Array.isArray(errorMsg[firstKey]) 
          ? errorMsg[firstKey][0] 
          : errorMsg[firstKey];
        return rejectWithValue(firstMsg || "Validation failed");
      }
      
      return rejectWithValue(errorMsg || "Failed to change password");
    }
  }
);

const initialState = {
  allUsers: { "active users": [], "deactive users": [] },
  profile: null,
  viewingProfile: null, // لبروفايل مستخدم آخر
  loading: false,
  error: null,
  success: null,
};

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearUsersError: (state) => {
      state.error = null;
      state.success = null;
    },
    clearViewingProfile: (state) => {
      state.viewingProfile = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Users
      .addCase(fetchAllUsers.pending, (state) => {
        state.loading = true;
      })
.addCase(fetchAllUsers.fulfilled, (state, action) => {
  state.loading = false;
  
  const payload = action.payload;
  console.log('📦 Raw API Payload:', payload);
  
  // ✅ الحالة 1: استجابة مرقمة (Paginated) - الأكثر شيوعاً
  if (payload?.data && Array.isArray(payload.data)) {
    // فلترة المستخدمين حسب حالة الحساب
    const active = payload.data.filter(u => u?.account_status == 1);
    const deactive = payload.data.filter(u => u?.account_status == 0 || u?.account_status == 2);
    
    state.allUsers = {
      'active users': active,
      'deactive users': deactive
    };
    
    console.log('✅ Saved Users (Paginated):', {
      active: active.length,
      deactive: deactive.length
    });
  } 
  // ✅ الحالة 2: الهيكلية القديمة (fallback)
  else if (payload?.['active users'] || payload?.['deactive users']) {
    state.allUsers = {
      'active users': Array.isArray(payload?.['active users']) ? payload['active users'] : [],
      'deactive users': Array.isArray(payload?.['deactive users']) ? payload['deactive users'] : []
    };
  }
  // ✅ الحالة 3: fallback نهائي
  else {
    state.allUsers = { 'active users': [], 'deactive users': [] };
    console.warn('⚠️ Unknown API response structure:', payload);
  }
})
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch User Profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        // ✅ تأكد من استخراج البيانات بشكل صحيح
        const payload = action.payload;
        state.profile = payload?.data || payload; // جرب الاتنين
        console.log("✅ Profile loaded:", state.profile);
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch User By ID
      .addCase(fetchUserById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        state.viewingProfile = payload?.data || payload;
        console.log("✅ User loaded:", state.viewingProfile);
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update User Profile
      // Update Profile
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
.addCase(updateUserProfile.fulfilled, (state, action) => {
  state.loading = false;
  
  // ✅ استخراج البيانات المحدثة
  const updatedProfile = action.payload?.data || action.payload;
  
  // ✅ تحديث ملف التعريف الحالي بدمج آمن
  if (state.profile) {
    state.profile = { ...state.profile, ...updatedProfile };
  } else {
    state.profile = updatedProfile;
  }
  
  state.success = "profile.updatedSuccessfully";
  state.error = null;
  
  console.log('✅ Profile merged in Redux:', state.profile);
})
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Change Password
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
        state.success = "profile.passwordChanged";
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearUsersError, clearViewingProfile } = userSlice.actions;
export default userSlice.reducer;
