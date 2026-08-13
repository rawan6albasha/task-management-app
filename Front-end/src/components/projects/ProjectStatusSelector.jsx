// src/components/projects/ProjectStatusSelector.jsx
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import Badge from "../shared/Badge";

export default function ProjectStatusSelector({ 
  project,
  projectId,
  onStatusChange,
  size = "normal"
}) {
  const { t } = useTranslation();
  const currentUser = useSelector((state) => state.auth.user);

  // ✅ الصلاحية: المدير ومساعد المدير ومدير الفرع ومدير القسم فقط
  const canEditStatus = project && currentUser && 
    (currentUser.position?.value === 'admin' || 
     currentUser.position?.value === 'general_manager' ||
     currentUser.position?.value === 'general_manager_assistant' ||
     currentUser.position?.value === 'branch_manager' ||
     currentUser.position?.value === 'section_manager');

  // ✅ تكوينات الحالة النشطة/غير النشطة فقط
  const statusConfig = {
    active: { 
      label: t('common.active'), 
      icon: "🟢", 
      variant: "status_completed",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      hover: "hover:bg-emerald-100",
      value: 1  // ✅ القيمة المرسلة للباك إند
    },
    inactive: { 
      label: t('common.inactive'), 
      icon: "🔴", 
      variant: "status_canceled",
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-200",
      hover: "hover:bg-rose-100",
      value: 0  // ✅ القيمة المرسلة للباك إند
    }
  };

  // ✅ تحويل is_active (0/1) إلى مفتاح النص
  const currentKey = project?.is_active == 1 ? "active" : "inactive";
  const currentStatus = statusConfig[currentKey];

  const sizeClasses = {
    small: "text-xs px-2 py-1",
    normal: "text-sm px-3 py-1.5",
    large: "text-base px-4 py-2"
  };

  // 🚫 لا توجد صلاحية → Badge للقراءة فقط
  if (!canEditStatus) {
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

  // ✅ توجد صلاحية → Dropdown مع خيارين فقط (نشط / غير نشط)
  return (
    <select
      value={currentKey}
      onChange={(e) => {
        const newAction = statusConfig[e.target.value]?.value;
        onStatusChange?.(projectId || project?.id, newAction); // ✅ إرسال 0 أو 1 فقط
      }}
      className={`${sizeClasses[size]} ${currentStatus.bg} ${currentStatus.text} ${currentStatus.border} border-2 font-medium rounded-lg outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all ${currentStatus.hover}`}
      title={t('project.changeStatus')}
    >
      <option value="active" className="text-gray-900">
        {statusConfig.active.icon} {statusConfig.active.label}
      </option>
      <option value="inactive" className="text-gray-900">
        {statusConfig.inactive.icon} {statusConfig.inactive.label}
      </option>
    </select>
  );
}