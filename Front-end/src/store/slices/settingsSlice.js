// src/store/slices/settingsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../lib/axios";
import publicApi from "../../lib/publicApi";

// ✅ جلب الإعدادات حسب الكود
// export const fetchSettingsByCode = createAsyncThunk(
//   "settings/fetchByCode",
//   async (code, { rejectWithValue }) => {
//     try {
//       // const response = await api.post("/api/settings/get", { code });
//         const response = await publicApi.post("/api/settings/get", { code });
//       const rawData = response.data;
//       const items = Array.isArray(rawData?.data)
//         ? rawData.data
//         : Array.isArray(rawData)
//           ? rawData
//           : [];

//       return { code, items };
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || `Failed to fetch ${code}`);
//     }
//   }
// );

// ✅ في ملف taskSlice.js أو settingsSlice.js
export const fetchSettingsByCode = createAsyncThunk(
  "settings/fetchByCode",
  async (code, { rejectWithValue }) => {
    try {
      // ✅ تغيير من POST إلى GET مع إرسال الباراميتر كـ query parameter
      const response = await publicApi.get("/api/settings/get", {
        params: { code }, // ✅ سيتم إرساله كـ ?code=branch
      });

      const rawData = response.data;
      const isPaginated = rawData?.current_page !== undefined;

      const items = isPaginated
        ? rawData.data || [] // حالة التصفيه
        : Array.isArray(rawData?.data)
          ? rawData.data // حالة المصفوفة العادية
          : Array.isArray(rawData)
            ? rawData
            : [];
      return { code, items };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || `Failed to fetch ${code}`,
      );
    }
  },
);

// ✅ إضافة إعداد جديد
export const addSetting = createAsyncThunk(
  "settings/add",
  async ({ code, ar_name, en_name, value }, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/settings/add", {
        code,
        ar_name,
        en_name,
        value,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "فشل في إضافة الإعداد",
      );
    }
  },
);

// ✅ تحديث إعداد موجود
export const updateSetting = createAsyncThunk(
  "settings/update",
  async (
    { setting_id, code, ar_name, en_name, value },
    { rejectWithValue },
  ) => {
    try {
      // ✅ PUT مع الـ ID في الـ URL
      const response = await api.put(`/api/settings/update/${setting_id}`, {
        code,
        ar_name,
        en_name,
        value,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "فشل في تحديث الإعداد",
      );
    }
  },
);
export const deleteSetting = createAsyncThunk(
  "settings/delete",
  async (settingId, { rejectWithValue }) => {
    try {
      await api.delete(`/api/settings/delete/${settingId}`);
      return settingId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "فشل في حذف الإعداد",
      );
    }
  },
);

const initialState = {
  branches: [],
  sections: [],
  positions: [],
  loading: false,
  error: null,
  success: null,
  loadedCodes: [],
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    clearSettingsError: (state) => {
      state.error = null;
    },
    clearSettingsSuccess: (state) => {
      state.success = null;
    },
    clearSettings: (state) => {
      state.branches = [];
      state.sections = [];
      state.positions = [];
      state.loadedCodes = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchSettingsByCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettingsByCode.fulfilled, (state, action) => {
        state.loading = false;
        const { code, items } = action.payload;

        if (code === "branch") {
          state.branches = items;
          if (!state.loadedCodes.includes("branch"))
            state.loadedCodes.push("branch");
        } else if (code === "section") {
          state.sections = items;
          if (!state.loadedCodes.includes("section"))
            state.loadedCodes.push("section");
        } else if (code === "position") {
          state.positions = items;
          if (!state.loadedCodes.includes("position"))
            state.loadedCodes.push("position");
        }
      })
      .addCase(fetchSettingsByCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add
      .addCase(addSetting.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addSetting.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.data?.message || "تمت الإضافة بنجاح";
        // إعادة جلب البيانات لتحديث القائمة
        if (action.meta.arg.code === "position") {
          state.positions.push(action.data?.data || action.payload);
        }
      })
      .addCase(addSetting.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
//delete
      .addCase(deleteSetting.fulfilled, (state, action) => {
        const id = action.payload;
        ["branches", "sections", "positions"].forEach((key) => {
          state[key] = state[key].filter((item) => item.id !== id);
        });
      })
      // Update
      .addCase(updateSetting.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSetting.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.data?.message || "تم التحديث بنجاح";
        // تحديث العنصر في القائمة
        const index = state.positions.findIndex(
          (p) => p.id === action.meta.arg.setting_id,
        );
        if (index !== -1) {
          state.positions[index] = {
            ...state.positions[index],
            ...action.data?.data,
          };
        }
      })
      .addCase(updateSetting.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSettingsError, clearSettingsSuccess, clearSettings } =
  settingsSlice.actions;
export default settingsSlice.reducer;
