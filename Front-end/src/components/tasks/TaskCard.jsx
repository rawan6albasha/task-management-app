// src/components/tasks/TaskCard.jsx
import { useTranslation } from "react-i18next";
import { 
  CheckCircle, Clock, AlertCircle, XCircle,
  Calendar, User, Edit, Trash2, Eye, Lock, GripVertical, UserCheck
} from "lucide-react";
import Badge from "../shared/Badge";
import { getLocalizedField } from "../../utils/helpers";
import { useSelector } from "react-redux";

export default function TaskCard({ 
  task, onView, onEdit, onDelete, onStatusChange,
  canEdit = true, canDelete = false,
  isDraggable = false, isLocked = false, 
}) {
  const { t, i18n } = useTranslation();
  const currentUser = useSelector((state) => state.auth.user);
  
  const title = getLocalizedField(task, 'title', i18n.language);
  const description = getLocalizedField(task, 'description', i18n.language);
  
  // تكوين الحالات
  const statusConfig = {
    pending: { 
      variant: "status_pending", 
      color: "status-pending", 
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      textColor: "text-amber-800",
      icon: Clock,
      label: t("status.pending")
    },
    in_progress: { 
      variant: "status_in_progress", 
      color: "status-in-progress",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-800",
      icon: AlertCircle,
      label: t("status.in_progress")
    },
    completed: { 
      variant: "status_completed", 
      color: "status-completed",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      textColor: "text-emerald-800",
      icon: CheckCircle,
      label: t("status.completed")
    },
    cancelled: { 
      variant: "status_canceled", 
      color: "status-canceled",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      textColor: "text-red-800",
      icon: XCircle,
      label: t("status.cancelled")
    }
  };
  
  // تكوين الأولويات
  const priorityConfig = {
    high: { 
      variant: "priority_high", 
      color: "priority-high",
      bgColor: "bg-red-50",
      textColor: "text-red-700",
      borderColor: "border-red-200",
      label: t("priority.high"),
      badge: "🔴"
    },
    medium: { 
      variant: "priority_medium", 
      color: "priority-medium",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-700",
      borderColor: "border-yellow-200",
      label: t("priority.medium"),
      badge: "🟡"
    },
    low: { 
      variant: "priority_low", 
      color: "priority-low",
      bgColor: "bg-green-50",
      textColor: "text-green-700",
      borderColor: "border-green-200",
      label: t("priority.low"),
      badge: "🟢"
    }
  };

  const currentStatus = statusConfig[task.task_status] || statusConfig.pending;
  const currentPriority = priorityConfig[task.priority] || priorityConfig.medium;
  const StatusIcon = currentStatus.icon;
  
  // ✅ تحديد ملكية المهمة
  const isCreatedByMe = String(task?.created_by_id) === String(currentUser?.id);
  const isAssignedToMe = String(task?.assigned_id) === String(currentUser?.id);
  
  // حساب هل المهمة متأخرة
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.task_status !== 'completed';

  return (
    <div 
      className={`
        group relative bg-surface border-2 rounded-xl transition-all duration-300 overflow-hidden
        ${isLocked 
          ? "select-none border-amber-200/50 bg-amber-50/30 opacity-80" 
          : `border-border hover:border-primary/50 hover:shadow-lg cursor-grab active:cursor-grabbing`
        }
      `}
    >
      {/* شريط الحالة العلوي */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${
        currentStatus.color === 'status-completed' ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
        currentStatus.color === 'status-in-progress' ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
        currentStatus.color === 'status-canceled' ? 'bg-gradient-to-r from-red-400 to-red-500' :
        'bg-gradient-to-r from-amber-400 to-amber-500'
      }`} />

      {/* مقبض السحب */}
      {isDraggable && !isLocked && (
        <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <GripVertical size={18} className="text-gray-400" />
        </div>
      )}
      
      {/* المحتوى الرئيسي */}
      <div className="p-4 sm:p-5 pt-6">
        {/* Header مع الأولوية والملكية */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {/* مؤشر الأولوية */}
            <div className={`flex-shrink-0 w-5 h-5 rounded-full shadow-lg ${
              currentPriority.color === 'priority-high' ? 'bg-gradient-to-b from-red-500 to-red-600' :
              currentPriority.color === 'priority-medium' ? 'bg-gradient-to-b from-yellow-500 to-yellow-600' :
              'bg-gradient-to-b from-green-500 to-green-600'
            }`} title={currentPriority.label} />
            
            {/* العنوان والمشروع */}
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-text text-sm sm:text-base leading-snug line-clamp-2">
                {title}
              </h3>
              {task.project && (
                <p className="text-xs sm:text-sm text-text-muted truncate mt-0.5 font-medium">
                  {getLocalizedField(task.project, 'name', i18n.language)}
                </p>
              )}
            </div>
          </div>
          
          {/* ✅ شارات الملكية */}
          <div className="flex flex-col gap-1 items-end">
            {isCreatedByMe && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-semibold border border-blue-200">
                <User size={10} />
                {t("task.createdByMe")}
              </span>
            )}
            {isAssignedToMe && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                <UserCheck size={10} />
                {t("task.assignedToMe")}
              </span>
            )}
            {/* شارة القفل */}
            {isLocked && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 rounded border border-amber-300" title={t("task.readOnlyHint")}>
                <Lock size={12} className="text-amber-600" />
                <span className="text-[10px] font-semibold text-amber-700">{t('task.readOnly')}</span>
              </div>
            )}
          </div>
        </div>

        {/* شارات الحالة والأولوية */}
        <div className="flex flex-wrap gap-2 mb-4">
          {/* شارة الحالة */}
          <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 font-semibold text-xs sm:text-sm ${currentStatus.bgColor} ${currentStatus.borderColor} ${currentStatus.textColor}`}>
            <StatusIcon size={16} className="flex-shrink-0" />
            <span>{currentStatus.label}</span>
          </div>
          
          {/* شارة الأولوية */}
          <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 font-semibold text-xs sm:text-sm ${currentPriority.bgColor} ${currentPriority.borderColor} ${currentPriority.textColor}`}>
            <span>{currentPriority.badge}</span>
            <span>{currentPriority.label}</span>
          </div>

          {/* تنبيه التأخر */}
          {isOverdue && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 border-red-300 bg-red-50 font-semibold text-xs sm:text-sm text-red-700 animate-pulse">
              <AlertCircle size={16} />
              <span>{t('task.overdue')}</span>
            </div>
          )}
        </div>

        {/* معلومات المهمة */}
        <div className="space-y-2.5 mb-4 pb-4 border-b border-border">
          {task.assigned_user && (
            <div className="flex items-center gap-2.5 text-text-muted text-xs sm:text-sm">
              <User size={16} className="text-primary flex-shrink-0" />
              <span className="truncate font-medium">{task.assigned_user.name}</span>
            </div>
          )}
          {task.due_date && (
            <div className={`flex items-center gap-2.5 text-xs sm:text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-text-muted'}`}>
              <Calendar size={16} className="flex-shrink-0" />
              <span>{new Date(task.due_date).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}</span>
            </div>
          )}
          {task.amount > 0 && (
            <div className="flex items-center gap-2.5 text-text text-xs sm:text-sm font-bold">
              <span className="text-lg">💰</span>
              <span>${parseFloat(task.amount).toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* أزرار الإجراءات */}
        <div className="flex items-center justify-end gap-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (task?.id) onView?.(task.id);
            }} 
            className="p-2 sm:p-2.5 rounded-lg hover:bg-primary/10 text-text-muted hover:text-primary transition-all active:scale-95" 
            title={t("common.view")}
            disabled={!task?.id}
          >
            <Eye size={18} />
          </button>
          
          {canEdit && !isLocked && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (task?.id) onEdit?.(task.id);
              }} 
              className="p-2 sm:p-2.5 rounded-lg hover:bg-primary/10 text-primary hover:text-primary-hover transition-all active:scale-95" 
              title={t("common.edit")}
              disabled={!task?.id}
            >
              <Edit size={18} />
            </button>
          )}
          
          {canDelete && !isLocked && onDelete && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (task?.id) onDelete(task.id);
              }} 
              className="p-2 sm:p-2.5 rounded-lg hover:bg-red-100 text-red-500 hover:text-red-600 transition-all active:scale-95" 
              title={t("common.delete")}
              disabled={!task?.id}
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}