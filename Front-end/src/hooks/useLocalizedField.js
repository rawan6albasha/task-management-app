// src/hooks/useLocalizedField.js
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Hook ذكي لجلب الحقل المناسب حسب اللغة الحالية
 * يعيد إعادة الرندر تلقائياً عند تغير اللغة
 * 
 * @param {Object} data - الكائن الذي يحتوي على الحقول الثنائية (name_ar, name_en...)
 * @param {string} field - اسم الحقل الأساسي (مثلاً: 'name', 'description')
 * @returns {string} - القيمة المناسبة للغة الحالية
 */
const useLocalizedField = (data, field) => {
  const { i18n } = useTranslation();
  
  return useMemo(() => {
    if (!data) return '';
    const lang = i18n.language || 'ar';
    // جرب: field_lang > field_ar > field_en > field
    return data[`${field}_${lang}`] || data[`${field}_ar`] || data[`${field}_en`] || data[field] || '';
  }, [data, field, i18n.language]); // ✅ يعتمد على i18n.language لإعادة الرندر
}
export default useLocalizedField;