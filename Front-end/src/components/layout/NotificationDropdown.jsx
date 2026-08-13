import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Bell, CheckCircle2, XCircle, Clock, Eye, Trash2 } from "lucide-react";
import {
  fetchUnreadNotifications,
  markNotificationAsRead,
  markAllAsRead,
  clearNotifications,
} from "../../store/slices/notificationSlice";
import { useNavigate } from "react-router-dom";

// ✅ دالة مساعدة لترجمة نصوص الإشعارات (فرونت إند فقط)
const getTranslatedNotification = (notification, t, lang = 'ar') => {
  if (!notification) return { title: '', content: '' };

  const { related_type, title: backendTitle, content: backendContent } = notification;

  // ✅ دالة مساعدة لاستخراج المتغيرات من النص باستخدام regex
  const extractVar = (text, pattern) => {
    if (!text) return '';
    const match = typeof text === 'string' ? text.match(pattern) : null;
    return match ? match[1] : '';
  };

  // ✅ خريطة لأنواع الإشعارات مع منطق الاستخراج
  const typeMap = {
    // نوع: إنشاء مهمة جديدة
    'create task': {
      key: 'create_task',
      extract: (content) => {
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
          reason: extractVar(content, reasonPattern) || t('notifications.types.task_rejected.noReason', { defaultValue: 'غير محدد' }),
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
      title: backendTitle || t('notifications.defaultTitle', { defaultValue: 'إشعار جديد' }),
      content: backendContent || t('notifications.defaultContent', { defaultValue: 'لديك إشعار جديد' }),
    };
  }

  // ✅ استخراج المتغيرات وترجمة النص
  const variables = typeConfig.extract(backendContent);
  
  return {
    title: t(`notifications.types.${typeConfig.key}.title`, variables),
    content: t(`notifications.types.${typeConfig.key}.content`, variables),
  };
};

export default function NotificationDropdown() {
  const { t, i18n } = useTranslation(); // ✅ إضافة i18n
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const { notifications, unreadCount, loading } = useSelector((state) => state.notifications);

  // ✅ جلب الإشعارات عند فتح الـ Dropdown
  useEffect(() => {
    if (isOpen && !notifications.length) {
      dispatch(fetchUnreadNotifications());
    }
  }, [isOpen, dispatch, notifications.length]);

  // ✅ إغلاق الـ Dropdown عند النقر خارجه
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ التعامل مع النقر على إشعار
  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await dispatch(markNotificationAsRead(notification.id));
    }
    if (notification.related_id) {
      navigate(`/tasks/${notification.related_id}`);
    }
    setIsOpen(false);
  };

  // ✅ تحديد الكل كمقروء
  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
  };

  // ✅ تنسيق الوقت
  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t("notifications.justNow");
    if (minutes < 60) return t("notifications.minutesAgo", { count: minutes });
    if (hours < 24) return t("notifications.hoursAgo", { count: hours });
    return t("notifications.daysAgo", { count: days });
  };

  // ✅ أيقونة حسب نوع الإشعار
  const getNotificationIcon = (type) => {
    switch (type) {
      case "due_date_reminder":
        return <Clock size={18} className="text-warning" />;
      case "new_task":
      case "create task":
        return <Bell size={18} className="text-primary" />;
      case "task_completed":
        return <CheckCircle2 size={18} className="text-success" />;
      case "task_rejected":
        return <XCircle size={18} className="text-danger" />;
      default:
        return <Bell size={18} className="text-text-muted" />;
    }
  };

  // ✅ دالة لعرض الإشعار مترجماً
  const getDisplayNotification = (notification) => {
    return getTranslatedNotification(notification, t, i18n.language);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ✅ زر الإشعارات */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && !notifications.length) {
            dispatch(fetchUnreadNotifications());
          }
        }}
        className="relative p-2 rounded-xl hover:bg-background transition-colors"
        aria-label={t("notifications.title")}
      >
        <Bell size={20} className="text-text-muted" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -end-1 w-5 h-5 flex items-center justify-center bg-danger text-white text-[10px] font-bold rounded-full animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* ✅ قائمة الإشعارات المنسدلة */}
      {isOpen && (
        <div className="absolute top-full end-0 mt-2 w-80 sm:w-96 bg-surface border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-bold text-text flex items-center gap-2">
              <Bell size={18} className="text-primary" />
              {t("notifications.title")}
              {unreadCount > 0 && (
                <span className="text-xs font-normal text-text-muted">
                  ({unreadCount})
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-primary hover:text-primary/80 font-medium"
              >
                {t("notifications.markAllRead")}
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-text-muted">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-sm">{t("common.loading")}</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-text-muted">
                <Bell size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">{t("notifications.noNotifications")}</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => {
                  // ✅ الحصول على النص المترجم
                  const { title: displayTitle, content: displayContent } = getDisplayNotification(notification);
                  
                  return (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full text-start p-4 hover:bg-background/50 transition-colors ${
                        !notification.is_read ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.related_type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-medium ${!notification.is_read ? "text-text" : "text-text-muted"}`}>
                              {displayTitle} {/* ✅ النص المترجم */}
                            </p>
                            {!notification.is_read && (
                              <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-xs text-text-muted mt-1 line-clamp-2">
                            {displayContent} {/* ✅ النص المترجم */}
                          </p>
                          <p className="text-[10px] text-text-muted/70 mt-2">
                            {formatTime(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-border bg-background/30 text-center">
              <button
                onClick={() => {
                  dispatch(clearNotifications());
                  setIsOpen(false);
                }}
                className="text-xs text-text-muted hover:text-danger transition-colors"
              >
                {t("notifications.clearAll")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}