// src/utils/helpers.js
export const calculateProgress = (completed, total) => {
  if (!total || total === 0) return 0;
  return Math.min(100, Math.round((completed / total) * 100));
};

export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('ar-EG');
};

// src/utils/localizedField.js
/**
 * دالة عادية (ليست Hook) لجلب الحقل المناسب حسب اللغة
 * يمكن استدعاؤها في أي مكان بدون قيود الـ Hooks
 * 
 * @param {Object} data - الكائن الذي يحتوي على الحقول الثنائية
 * @param {string} field - اسم الحقل الأساسي
 * @param {string} currentLang - اللغة الحالية (من i18n)
 * @returns {string} - القيمة المناسبة
 */
export const getLocalizedField = (data, field, currentLang = 'ar') => {
  if (!data) return '';
  return data[`${field}_${currentLang}`] || 
         data[`${field}_ar`] || 
         data[`${field}_en`] || 
         data[field] || 
         '';
};