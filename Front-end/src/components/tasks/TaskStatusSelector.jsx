// src/components/tasks/TaskStatusSelector.jsx
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import Badge from "../shared/Badge";

export default function TaskStatusSelector({
  task,
  taskId,
  onStatusChange,
  size = "normal",
}) {
  const { t } = useTranslation();
  const currentUser = useSelector((state) => state.auth.user);

  // ✅ تحديد نوع العلاقة بالمهمة
  const isAssignedToMe = task?.assigned_id === currentUser?.id;
  const isCreatedByMe = task?.created_by_id === currentUser?.id;
  const isTaskCanceled = task?.task_status === "cancelled";

  // ✅ تكوينات الحالات مع ألوان مريحة للعين
  const statusConfig = {
    pending: {
      label: t("status.pending"),
      icon: "⏳",
      variant: "status_pending",
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      hover: "hover:bg-amber-100",
    },
    in_progress: {
      label: t("status.in_progress"),
      icon: "🔄",
      variant: "status_in_progress",
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
      hover: "hover:bg-blue-100",
    },
    completed: {
      label: t("status.completed"),
      icon: "✅",
      variant: "status_completed",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      hover: "hover:bg-emerald-100",
    },
    cancelled: {
      // ✅ غيّر من 'canceled' إلى 'cancelled' (2 L)
      label: t("status.cancelled"), // ✅ تأكد أن مفتاح الترجمة متوافق
      icon: "❌",
      variant: "status_cancelled",
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-200",
      hover: "hover:bg-rose-100",
    },
  };

  const currentStatus = statusConfig[task?.task_status] || statusConfig.pending;
  const sizeClasses = {
    small: "text-xs px-6 py-1",
    normal: "text-sm px-6 py-1.5",
    large: "text-base px-6 py-2",
  };

  // ✅ دالة التحقق مما إذا كان مسموحاً باختيار حالة معينة
  const canSelectStatus = (statusKey) => {
    if (isTaskCanceled) {
      // ✅ تأكد أن هذا المتغير يستخدم 'cancelled'
      if (isCreatedByMe) {
        return statusKey !== "cancelled"; // ✅ غيّر هنا أيضاً
      }
      return false;
    }

    if (isAssignedToMe) {
      return statusKey !== "cancelled"; // ✅ وهنا أيضاً
    }
    if (isCreatedByMe) {
      return statusKey === "cancelled"; // ✅ وهنا أيضاً
    }
    return false;
  };

  // ✅ هل المستخدم يملك أي صلاحية للتغيير؟
  const hasAnyPermission = isAssignedToMe || isCreatedByMe;

  // 🚫 لا توجد صلاحية → Badge للقراءة فقط
  if (!hasAnyPermission) {
    return (
      <Badge
        variant={currentStatus.variant}
        className={`${sizeClasses[size]} ${currentStatus.bg} ${currentStatus.text} ${currentStatus.border} border font-medium flex items-center gap-1.5 cursor-default`}
      >
        <span>{currentStatus.icon}</span>
        <span>{currentStatus.label}</span>
      </Badge>
    );
  }

  // ✅ توجد صلاحية → Dropdown مع فلترة الخيارات حسب الصلاحية
  return (
    <select
      value={task?.task_status || "pending"}
      onChange={(e) => {
        e.stopPropagation(); // ✅ منع انتشار الحدث للأب

        const newStatus = e.target.value;
        // تحقق إضافي للأمان قبل التنفيذ
        if (canSelectStatus(newStatus)) {
          onStatusChange?.(taskId || task?.id, newStatus);
        }
      }}
      className={`${sizeClasses[size]} ${currentStatus.bg} ${currentStatus.text} ${currentStatus.border} border-2 font-medium rounded-lg outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer  transition-all ${currentStatus.hover}`}
      title={t("task.changeStatus")}
      // ✅ تعطيل الـ select إذا كانت المهمة ملغاة والمستخدم مسند إليه فقط
      disabled={isTaskCanceled && isAssignedToMe && !isCreatedByMe}
    >
      {/* ✅ الخيار الحالي دائماً متاح */}
      <option value={task?.task_status || "pending"} className="text-gray-900 p-2">
        {currentStatus.icon} {currentStatus.label}
      </option>

      {/* ✅ الخيارات الأخرى المسموح بها فقط */}
      {Object.entries(statusConfig).map(([key, config]) => {
        // لا نعرض الخيار الحالي مرتين، ولا نعرض الخيارات غير المسموحة
        if (key === task?.task_status || !canSelectStatus(key)) {
          return null;
        }
        return (
          <option key={key} value={key} className="text-gray-900">
            {config.icon} {config.label}
          </option>
        );
      })}
    </select>
  );
}
