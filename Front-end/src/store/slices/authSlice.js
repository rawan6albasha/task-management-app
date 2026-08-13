import { createSlice } from "@reduxjs/toolkit";

// تحميل الـ auth state من localStorage عند بدء التطبيق
const getInitialState = () => {
  const savedAuth = localStorage.getItem("auth");
  if (savedAuth) {
    try {
      return JSON.parse(savedAuth);
    } catch (error) {
      console.error("Failed to parse auth from localStorage:", error);
      return {
        user: null,
        isAuthenticated: false,
        token: null,
        permissions: [],
      };
    }
  }
  return {
    user: null,
    isAuthenticated: false,
    token: null,
    permissions: [],
  };
};

const authSlice = createSlice({
  name: "auth",
  initialState: getInitialState(),
  reducers: {
    login: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.permissions = action.payload.permissions || ["task:view", "task:create"];
      
      // حفظ في localStorage
      localStorage.setItem("auth", JSON.stringify({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        permissions: state.permissions,
      }));
      localStorage.setItem("token", action.payload.token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.permissions = [];
      
      // حذف من localStorage
      localStorage.removeItem("auth");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
    updateUserProfile: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      
      // تحديث في localStorage
      const auth = JSON.parse(localStorage.getItem("auth") || "{}");
      auth.user = state.user;
      localStorage.setItem("auth", JSON.stringify(auth));
    },
    // للتحقق من التوكن عند بدء التطبيق
    restoreAuth: (state, action) => {
      const auth = action.payload;
      if (auth && auth.token) {
        state.user = auth.user;
        state.token = auth.token;
        state.isAuthenticated = true;
        state.permissions = auth.permissions || [];
      }
    }
  },
});

export const { login, logout, updateUserProfile, restoreAuth } = authSlice.actions;
export default authSlice.reducer;