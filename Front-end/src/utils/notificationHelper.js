/**
 * تحويل نص الإشعار القادم من الباك إند إلى نص مترجم
 * @param {Object} notification - كائن الإشعار من الـ API
 * @param {Function} t - دالة الترجمة من useTranslation
 * @param {String} lang - اللغة الحالية ('ar' أو 'en')
 * @returns {Object} - { title: string, content: string }
 */
export const getTranslatedNotification = (notification, t, lang = 'ar') => {
  if (!notification) return { title: '', content: '' };

  const { related_type, title: backendTitle, content: backendContent } = notification;

  // ✅ دالة مساعدة لاستخراج المتغيرات من النص باستخدام regex
  const extractVar = (text, pattern) => {
    if (!text) return '';
    const match = text.match(pattern);
    return match ? match[1] : '';
  };

  // ✅ خريطة لأنواع الإشعارات مع منطق الاستخراج
  const typeMap = {
    // نوع: إنشاء مهمة جديدة
    'create task': {
      key: 'create_task',
      extract: (content) => {
        // مثال عربي: "قام angel* بإسناد مهمة جديدة لك بعنوان (تجريب اضافة تاسك صفحة التاسكات)"
        // مثال إنجليزي: "Creator has assigned you a new task titled (جرب)"
        const creatorPattern = lang === 'ar' ? /قام (.+?) بإسناد/ : /(.+?) (?:has assigned|assigned)/;
        const titlePattern = /(?:بعنوان|\btitled\b)\s*\((.+?)\)/;
        
        return {
          creator: extractVar(backendContent, creatorPattern) || t('common.creator'),
          taskTitle: extractVar(backendContent, titlePattern) || backendTitle,
        };
      },
    },
    
    // نوع: تذكير بموعد التسليم
    'due_date_reminder': {
      key: 'due_date_reminder',
      extract: (content) => {
        // استخراج اسم المهمة وعدد الأيام
        const titlePattern = /(?:المهمة|"|')(.+?)(?:"|'|\s*مستحقة)/;
        const daysPattern = /(?:خلال|in)\s*(\d+)\s*(?:يوم|يومًا|day|days)/;
        
        return {
          taskTitle: extractVar(content, titlePattern) || backendTitle,
          days: extractVar(content, daysPattern) || '1',
        };
      },
    },
    
    // نوع: إكمال المهمة
    'task_completed': {
      key: 'task_completed',
      extract: (content) => ({
        taskTitle: backendTitle || extractVar(content, /"(.+?)"/) || '',
      }),
    },
    
    // نوع: رفض المهمة
    'task_rejected': {
      key: 'task_rejected',
      extract: (content) => {
        const reasonPattern = /(?:السبب|سبب|:)\s*(.+)$/;
        return {
          taskTitle: backendTitle || extractVar(content, /"(.+?)"/) || '',
          reason: extractVar(content, reasonPattern) || t('notifications.types.task_rejected.noReason'),
        };
      },
    },
    
    // نوع: تحديث المهمة
    'task_updated': {
      key: 'task_updated',
      extract: () => ({
        taskTitle: backendTitle || '',
      }),
    },
  };

  // ✅ البحث عن النوع في الخريطة (مع دعم الاختلافات البسيطة في الكتابة)
  const normalizedType = related_type?.toLowerCase().trim();
  const typeConfig = Object.entries(typeMap).find(([key]) => 
    normalizedType?.includes(key.toLowerCase())
  )?.[1];

  // ✅ إذا لم نجد نوعاً معروفاً، نرجع النص الأصلي
  if (!typeConfig) {
    return {
      title: backendTitle || t('notifications.defaultTitle'),
      content: backendContent || t('notifications.defaultContent'),
    };
  }

  // ✅ استخراج المتغيرات وترجمة النص
  const variables = typeConfig.extract(backendContent);
  
  return {
    title: t(`notifications.types.${typeConfig.key}.title`, variables),
    content: t(`notifications.types.${typeConfig.key}.content`, variables),
  };
};