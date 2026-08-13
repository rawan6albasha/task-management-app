// src/config/appConfig.js

export const APP_CONFIG = {
  app: { 
    name: "نظام إدارة المهام", 
    version: "1.0.0", 
  },
  
  // 🔧 مكان واحد للتحكم بالـ API
  api: {
    useMock: false,
   localUrl: "http://127.0.0.1:8000",
    mockUrl: "https://4d07dd84-9fb8-4157-b0de-8bb44963f216.mock.pstmn.io",
    get baseUrl() {
      return this.useMock ? this.mockUrl : this.localUrl;
    },
    prefix: "/api"
  },
  
  theme: {
    colors: {
      background: "210 40% 98%",
      surface: "0 0% 100%",
      border: "214 32% 91%",
      text: "222 47% 11%",
      "text-muted": "215 16% 47%",
      primary: "221 83% 53%",
      "primary-hover": "221 83% 48%",
      "status-pending": "38 92% 50%",
      "status-in-progress": "217 91% 60%",
      "status-completed": "142 76% 36%",
      "status-canceled": "0 84% 60%",
      "priority-high": "16 93% 48%",
      "priority-medium": "198 93% 60%",
      "priority-low": "215 16% 47%",
    },
    fonts: {
      family: "'Tajawal', 'Inter', system-ui, sans-serif",
      sizes: { display: "2.5rem", h1: "2rem", h2: "1.5rem", body: "1rem", small: "0.875rem" }
    },
    borderRadius: "0.5rem",
    images: {
      defaultAvatar: '/assets/default-avatar.png',
      apiBaseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    },
  },
  
  i18n: { default: "ar", supported: ["ar", "en"] },

  // ✅ النظام الهرمي للصلاحيات (من الأعلى للأدنى)
hierarchy: {
  // ⚠️ الترتيب من الأعلى (0) للأدنى (5)
  levels: [
    11, // System Administrator (أعلى سلطة)
    10, // General Manager
    9,  // General Manager Assistant
    8,  // Branch Manager
    7,  // Section Manager
    6   // Employee (أدنى سلطة)
  ],
  
  // ✅ الصلاحيات المباشرة لكل منصب (اختياري)
  permissions: {
    6: ['task:view', 'task:create:own'],      // Employee
    7: ['task:view', 'task:approve:section'], // Section Manager
    8: ['task:view', 'task:approve:branch'],  // Branch Manager
    9: ['task:view', 'task:approve:all'],     // GM Assistant
    10: ['user:manage:all', 'settings:view'], // General Manager
    11: ['*'],                                // System Administrator
  }
},
  
  // ⚠️ الحفاظ على الصلاحيات القديمة للتوافق (اختياري)
  permissions: {
    employee: ["task:view", "task:create"],
    section_mgr: ["task:view", "task:edit", "user:view_dept"],
    branch_mgr: ["task:view", "task:approve", "user:manage_branch"],
    admin: ["*"]
  }
};

// ✅ دالة مساعدة للتحقق من المستوى الهرمي
export const hasHierarchicalAccess = (userPosition, requiredPosition) => {
  const { levels } = APP_CONFIG.hierarchy;
  const userIndex = levels.indexOf(userPosition);
  const requiredIndex = levels.indexOf(requiredPosition);
  
  // إذا كان المستخدم في مستوى أعلى أو يساوي المستوى المطلوب
  return userIndex !== -1 && requiredIndex !== -1 && userIndex <= requiredIndex;
};

export const isRTL = (lang) => APP_CONFIG.i18n.supported.includes(lang) && lang === 'ar';