// src/components/tasks/TaskCardUnified.jsx
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  StickyNote,
  X,
  AlertCircle,
  User,
  UserCheck,
} from "lucide-react";
import { getLocalizedField } from "../../utils/helpers";
import Badge from "../shared/Badge";

// دالة لحساب البروغرس
export const calculateTaskProgress = (task) => {
  if (!task.subtasks || task.subtasks.length === 0) {
    const taskStatus = task.task_status || task.status;
    switch (taskStatus) {
      case "completed":
        return 100;
      case "in_progress":
        return 60;
      case "pending":
        return 20;
      case "cancelled":
        return 0;
      default:
        return 0;
    }
  }
  const completedSubtasks = task.subtasks.filter(
    (st) => st.task_status === "completed" || st.status === "completed",
  ).length;
  return Math.round((completedSubtasks / task.subtasks.length) * 100);
};

export default function TaskCardUnified({
  to = null,
  task,
  index = 0,
  onClick,
  isClickable = true,
  disableInternalNav = false,
}) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth.user);

  const taskName =
    getLocalizedField(task, "title", i18n.language) ||
    getLocalizedField(task, "name", i18n.language) ||
    "";
  const taskStatus = task.task_status || task.status || "pending";
  const taskPriority = task.priority || "medium";
  const description =
    getLocalizedField(task, "description", i18n.language) || "";

  const progress = calculateTaskProgress(task);
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const completedSubtasks = hasSubtasks
    ? task.subtasks.filter(
        (st) => st.task_status === "completed" || st.status === "completed",
      ).length
    : 0;

  // تحديد نوع المهمة بالنسبة للمستخدم الحالي
  const isCreatedByMe = String(task?.created_by_id) === String(currentUser?.id);
  const isAssignedToMe = String(task?.assigned_id) === String(currentUser?.id);

  const ownershipBadges = [];
  if (isCreatedByMe) {
    ownershipBadges.push(
      <span
        key="created"
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200"
      >
        <User size={14} />
        {t("task.createdByMe")}
      </span>,
    );
  }
  if (isAssignedToMe) {
    ownershipBadges.push(
      <span
        key="assigned"
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200"
      >
        <UserCheck size={14} />
        {t("task.assignedToMe")}
      </span>,
    );
  }

  // ✅ دالة النقر المُحسّنة - مع تحقق من task.id
const handleClick = (e) => {
  // ✅ إذا كان التنقل الداخلي معطلاً، توقف فوراً
  if (disableInternalNav || !task?.id) {
    e?.stopPropagation?.();
    return;
  }
  
  if (!isClickable) return;
  
  // ✅ إذا كان هناك onClick مخصص، نفّذه
  if (onClick) {
    e?.stopPropagation?.();
    return onClick(e, task.id);
  }
  
  // ✅ التنقل الافتراضي
  e?.stopPropagation?.();
  navigate(`/tasks/${task.id}`);
};

  // ✅ دوال المساعدة
  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
    }
  };
  
  const getStatusIndicator = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-600";
      case "in_progress":
        return "bg-blue-600 animate-pulse";
      case "cancelled":
        return "bg-red-600";
      default:
        return "bg-yellow-600";
    }
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 size={24} />;
      case "in_progress":
        return <Clock size={24} />;
      case "cancelled":
        return <X size={24} />;
      default:
        return <AlertCircle size={24} />;
    }
  };
  
  const getProgressBarColor = (status) => {
    switch (status) {
      case "completed":
        return "from-green-400 to-green-500";
      case "in_progress":
        return "from-blue-400 to-blue-500";
      case "cancelled":
        return "from-red-400 to-red-500";
      default:
        return "from-yellow-400 to-yellow-500";
    }
  };
  
  const getStatusBgColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-600";
      case "in_progress":
        return "bg-blue-100 text-blue-600";
      case "cancelled":
        return "bg-red-100 text-red-600";
      default:
        return "bg-yellow-100 text-yellow-600";
    }
  };
  
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-50 text-red-700 border-red-200";
      case "medium":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  // ✅ محتوى الكرت
  const CardContent = (
    <div
      className={`group relative bg-white rounded-xl border-2 transition-all duration-300 overflow-hidden hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 ${
        isClickable && !disableInternalNav && task?.id ? "cursor-pointer" : ""
      } ${
        taskStatus === "completed"
          ? "border-green-200"
          : taskStatus === "in_progress"
            ? "border-blue-200"
            : taskStatus === "cancelled"
              ? "border-red-200 border-dashed"
              : "border-gray-200"
      }`}
      style={{ animationDelay: `${index * 50}ms` }}
      // ✅ منع النقر إذا لم يكن هناك ID
      onClick={(e) => {
        if (isClickable && !disableInternalNav && task?.id) {
          handleClick(e);
        }
      }}
      role={isClickable && !disableInternalNav && task?.id ? "button" : undefined}
      tabIndex={isClickable && !disableInternalNav && task?.id ? 0 : undefined}
    >
      {/* Progress Bar Top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100">
        <div
          className={`h-full transition-all duration-500 bg-gradient-to-r ${getProgressBarColor(taskStatus)}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Task Icon */}
          <div
            className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${getStatusBgColor(taskStatus)}`}
          >
            {getStatusIcon(taskStatus)}
          </div>

          {/* Task Info */}
          <div className="flex-1 min-w-0">
            {/* Title & Badges */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                {taskName}
              </h3>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${getStatusColor(taskStatus)}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${getStatusIndicator(taskStatus)}`}
                  />
                  {t(`status.${taskStatus}`) || taskStatus}
                </span>
                {taskPriority && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${getPriorityColor(taskPriority)}`}
                  >
                    {t(`priority.${taskPriority}`) || taskPriority}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            {description && (
              <div
                className="text-gray-500 text-sm mb-3 line-clamp-2"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            )}

            {/* Ownership Badges */}
            {ownershipBadges.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {ownershipBadges}
              </div>
            )}

            {/* Meta Info */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 items-start">
              {task.assigned_user && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                    {task.assigned_user.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">{t("task.assignedTo")}</div>
                    <div className="font-medium text-gray-800">{task.assigned_user.name}</div>
                  </div>
                </div>
              )}

              {task.due_date && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar size={18} className="text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">{t("task.dueDate")}</div>
                    <div className={`${new Date(task.due_date) < new Date() && taskStatus !== "completed" ? "text-red-600 font-semibold" : "text-gray-800"}`}>
                      {task.due_date}
                    </div>
                  </div>
                </div>
              )}

              {task.type && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <StickyNote size={18} className="text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">{t("task.type")}</div>
                    <div className="text-gray-800">{t(`task.types.${task.type}`) || task.type}</div>
                  </div>
                </div>
              )}

              {task.amount && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <DollarSign size={18} className="text-green-500" />
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">{t("task.amount")}</div>
                    <div className="text-gray-800 font-semibold">{task.amount}</div>
                  </div>
                </div>
              )}

              {hasSubtasks && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 size={18} className="text-purple-600" />
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">{t("task.subtasks")}</div>
                    <div className="text-gray-800">{completedSubtasks}/{task.subtasks.length}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Arrow Icon - يظهر فقط إذا كان الكرت قابل للنقر */}
          {isClickable && !disableInternalNav && task?.id && (
            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <ArrowLeft size={20} className="text-blue-600" />
              </div>
            </div>
          )}
        </div>

        {/* Progress Section */}
        {taskStatus !== "canceled" && taskStatus !== "cancelled" && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600 font-medium">
                {hasSubtasks
                  ? `${t("task.subtasks")}: ${completedSubtasks}/${task.subtasks.length}`
                  : t("task.progress")}
              </span>
              <span className="text-gray-800 font-bold">{progress}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${getProgressBarColor(taskStatus)}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ✅✅✅ التغليف الشرطي المُصحح ✅✅✅
  
  // الحالة 1: استخدام <Link> إذا كان to موجود و task.id صالح
  if (to && isClickable && !disableInternalNav && task?.id) {
    return (
      <Link 
        to={to} 
        className="block"
        onClick={(e) => {
          // ✅ السماح لـ React Router مع تنفيذ onClick المخصص
          if (onClick) onClick(e, task.id);
        }}
      >
        {CardContent}
      </Link>
    );
  }

  // الحالة 2: استخدام div مع onClick إذا لم يكن هناك to
  if (isClickable && !disableInternalNav && task?.id) {
    return (
      <div 
        onClick={handleClick}
        className="cursor-pointer block"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick(e);
          }
        }}
      >
        {CardContent}
      </div>
    );
  }

  // الحالة 3: عرض الكرت بدون تفاعل (للقراءة فقط)
  return (
    <div className="cursor-default block">
      {CardContent}
    </div>
  );
}