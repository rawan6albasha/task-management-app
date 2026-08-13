import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  language: localStorage.getItem("lang") || "ar",
  theme: "light",
  sidebarOpen: true,
  loading: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleLanguage: (state) => {
      state.language = state.language === "ar" ? "en" : "ar";
      localStorage.setItem("lang", state.language);
      document.documentElement.dir = state.language === "ar" ? "rtl" : "ltr";
    },
    toggleTheme: (state) => {
      state.theme = state.theme === "light" ? "dark" : "light";
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const { toggleLanguage, toggleTheme, toggleSidebar, setLoading } = uiSlice.actions;
export default uiSlice.reducer;