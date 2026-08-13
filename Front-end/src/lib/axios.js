// src/lib/axios.js
import axios from 'axios';
import { APP_CONFIG } from '../config/appConfig';
import i18n from '../i18n';

const api = axios.create({
  baseURL: APP_CONFIG.api.baseUrl,
  headers: { 
    'Content-Type': 'application/json', 
    'Accept': 'application/json' 
  },
  withCredentials: false,
});

// Request Interceptor
api.interceptors.request.use((config) => {
  // ✅ 1. إضافة /api تلقائياً إذا لم تكن موجودة (مرة واحدة فقط)
  if (config.url && !config.url.startsWith(APP_CONFIG.api.prefix)) {
    config.url = `${APP_CONFIG.api.prefix}${config.url}`;
  }
  
  // ✅ 2. إضافة التوكن للـ Authorization Header
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    // console.log('🔑 Token being sent:', '✅ Exists');
  } else {
    // console.log('🔑 Token being sent:', '❌ Missing');
  }
  
  // console.log('🌐 Request URL:', config.url);
  // console.log('📦 Request Headers:', config.headers);
      // ✅ إضافة اللغة ديناميكياً بناءً على لغة الواجهة الحالية
    const currentLang = i18n.language || localStorage.getItem("i18nextLng") || "ar";
    config.headers["Accept-Language"] = currentLang;
  
  return config;
}, (error) => {
  console.error('❌ Request Interceptor Error:', error);
  return Promise.reject(error);
});

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    // ✅ طباعة الاستجابة للتشخيص (يمكن إزالتها في الإنتاج)
    console.log('📡 Axios Response Status:', response.status);
    console.log('📦 Response Data:', response.data);
    
    // ✅ إرجاع البيانات مباشرة لتسهيل التعامل في المكونات
    return response.data;
  },
  (error) => {
    // ✅ تشخيص مفصل للأخطاء
    console.error('🔥 Axios Response Error:', {
      status: error.response?.status,
      message: error.response?.data?.message,
      url: error.config?.url,
      method: error.config?.method
    });
    
    
    // ✅ التعامل مع أخطاء الصلاحيات
    // if (error.response?.status === 401 || error.response?.status === 403) {
    //   console.warn('🔐 Authentication failed - Redirecting to login');
    //   localStorage.removeItem('token');
    //   localStorage.removeItem('user');
    //   window.location.href = '/login';
    // }
    
    // ✅ ضروري لإعادة تمرير الخطأ لـ catch
    return Promise.reject(error);
  }
);

export default api;