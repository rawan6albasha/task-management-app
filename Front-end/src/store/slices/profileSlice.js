// src/store/slices/profileSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../lib/axios";

// ✅ جلب بروفايلي (لا يحتاج ID)
export const fetchMyProfile = createAsyncThunk(
  "profile/fetchMyProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/user"); // ✅ لا يوجد body، التوكن يكفي
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "فشل جلب البروفايل");
    }
  }
);

// ✅ جلب بروفايل موظف آخر (يحتاج ID + صلاحيات)
export const fetchOtherProfile = createAsyncThunk(
  "profile/fetchOtherProfile",
  async (userId, { rejectWithValue }) => {
    try {
      // ✅ endpoint جديد حسب الحل اللي اقترحناه
      const response = await api.get(`/api/users/${userId}`);
      return response.data?.data || response.data;
    } catch (error) {
      if (error.response?.status === 403) {
        return rejectWithValue("ليس لديك صلاحية لعرض هذا البروفايل");
      }
      return rejectWithValue(error.response?.data?.message || "فشل جلب بيانات الموظف");
    }
  }
);

// ✅ تغيير حالة الموظف (للدمن)
export const updateProfileStatus = createAsyncThunk(
  "profile/updateStatus",
  async ({ userId, accountStatus }, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/admin/active-and-deactive", {
        user_id: userId,
        account_status: Number(accountStatus)
      });
      return response.data?.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "فشل تحديث الحالة");
    }
  }
);

const initialState = {
  profile: null,
  loading: false,
  error: null,
  success: null,
  isOwnProfile: false, // ✅ نحددها بناءً على وجود profileId
};

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    clearProfileMessages: (state) => {
      state.error = null;
      state.success = null;
    },
    setOwnProfileFlag: (state, action) => {
      state.isOwnProfile = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // ✅ Fetch My Profile
      .addCase(fetchMyProfile.pending, (state) => {
        state.loading = true;
        state.isOwnProfile = true;
      })
      .addCase(fetchMyProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchMyProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ✅ Fetch Other Profile
      .addCase(fetchOtherProfile.pending, (state) => {
        state.loading = true;
        state.isOwnProfile = false;
      })
      .addCase(fetchOtherProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchOtherProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ✅ Update Status
      .addCase(updateProfileStatus.fulfilled, (state, action) => {
        state.profile = action.payload;
        state.success = action.payload.account_status == 1 
          ? "تم تفعيل المستخدم" 
          : "تم تعطيل المستخدم";
      });
  },
});

export const { clearProfileMessages, setOwnProfileFlag } = profileSlice.actions;
export default profileSlice.reducer;