// src/lib/publicApi.js
import axios from "axios";
import { APP_CONFIG } from "../config/appConfig";
import i18n from "../i18n";

// ✅ إنشاء instance جديد بدون interceptor للتوكن
const publicApi = axios.create({
  baseURL: APP_CONFIG.api.baseUrl,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

// ✅ interceptor بسيط للـ logging فقط (بدون توكن)
publicApi.interceptors.request.use(
  (config) => {
    console.log(`🌐 [Public] Request URL: ${config.url}`);
        const currentLang = i18n.language || localStorage.getItem("i18nextLng") || "ar";
    config.headers["Accept-Language"] = currentLang;
    return config;
  },
  (error) => Promise.reject(error)
);

publicApi.interceptors.response.use(
  (response) => {
    console.log(`📡 [Public] Response Status: ${response.status}`);
    return response;
  },
  (error) => {
    console.error("🔥 [Public] Axios Response Error:", {
      status: error.response?.status,
      message: error.response?.data?.message,
      url: error.config?.url,
      method: error.config?.method,
    });
    return Promise.reject(error);
  }
);

export default publicApi;