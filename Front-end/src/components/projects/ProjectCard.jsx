import { useTranslation } from "react-i18next";
import { Folder, Calendar, DollarSign, MoreVertical, Edit, Trash2, Eye } from "lucide-react";
import ProgressBar from "../shared/ProgressBar";
import Badge from "../shared/Badge";
import { getLocalizedField } from "../../utils/helpers";

const calculateProgress = (start, end) => {
  if (!start || !end) return 0;
  const total = new Date(end) - new Date(start);
  const elapsed = new Date() - new Date(start);
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
};

export default function ProjectCard({ 
  project, 
  onView, 
  onEdit, 
  onCancel,
  statusSelector = null
}) {
  const { t, i18n } = useTranslation();
  
  const name = getLocalizedField(project, 'name', i18n.language);
  const description = getLocalizedField(project, 'description', i18n.language);
  const progress = calculateProgress(project.start_date, project.expected_expired_date);
  
  // ✅ التحقق من وجود لون مخصص
  const hasCustomColor = project.project_color && project.project_color !== "#3b82f6";
  
  // الخريطة المحسّنة للحالات مع الألوان
  const statusConfig = {
    starting_soon: { 
      variant: "status_pending", 
      color: "status-pending",
      borderColor: "border-status-pending",
      bgColor: "bg-status-pending/5"
    },
    in_progress: { 
      variant: "status_in_progress",
      color: "status-in-progress", 
      borderColor: "border-status-in-progress",
      bgColor: "bg-status-in-progress/5"
    },
    completed: { 
      variant: "status_completed",
      color: "status-completed",
      borderColor: "border-status-completed",
      bgColor: "bg-status-completed/5"
    },
    canceled: { 
      variant: "status_canceled",
      color: "status-canceled",
      borderColor: "border-status-canceled",
      bgColor: "bg-status-canceled/5"
    }
  };
  
  // ✅ اختيار الإعدادات: إما اللون المخصص أو الحالة الافتراضية
  const currentStatus = hasCustomColor 
    ? { 
        variant: "status_custom", 
        color: "custom",
        borderColor: "border-border",
        bgColor: "bg-transparent",
        customColor: project.project_color
      }
    : (statusConfig[project.status] || statusConfig.starting_soon);

  // ✅ دوال مساعدة للألوان الديناميكية
  const getBorderColor = () => hasCustomColor ? { borderColor: currentStatus.customColor } : { className: currentStatus.borderColor };
  const getAccentBg = () => hasCustomColor ? { backgroundColor: `${currentStatus.customColor}15` } : { className: currentStatus.bgColor };
  const getIconColor = () => hasCustomColor ? { color: currentStatus.customColor } : { className: `text-${currentStatus.color}` };
  const getDotBg = () => hasCustomColor ? { backgroundColor: currentStatus.customColor } : { className: `bg-${currentStatus.color}` };
  const getTextAccent = () => hasCustomColor ? { color: currentStatus.customColor } : { className: `text-${currentStatus.color}` };

  return (
    <div 
      className={`relative bg-surface border-2 rounded-2xl p-6 hover:shadow-2xl transition-all duration-300 group overflow-hidden ${!hasCustomColor ? currentStatus.borderColor : ''}`}
      style={hasCustomColor ? { borderColor: currentStatus.customColor } : {}}
    >
      {/* ✅ Background accent based on status or custom color */}
      <div 
        className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 -z-10 ${!hasCustomColor ? currentStatus.bgColor : ''}`}
        style={hasCustomColor ? { backgroundColor: `${currentStatus.customColor}20` } : {}}
      ></div>
      
      {/* ✅ Status indicator dot */}
      <div className="absolute top-4 end-4 flex items-center gap-2">
        <div 
          className="w-3 h-3 rounded-full animate-pulse"
          style={hasCustomColor ? { backgroundColor: currentStatus.customColor } : {}}
          className={!hasCustomColor ? `bg-${currentStatus.color}` : ''}
        ></div>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div 
            className={`p-3 rounded-xl flex-shrink-0 ${!hasCustomColor ? currentStatus.bgColor : ''}`}
            style={hasCustomColor ? { backgroundColor: `${currentStatus.customColor}15` } : {}}
          >
            <Folder 
              size={24}
              {...getIconColor()}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-text text-lg leading-tight truncate">{name}</h3>
            {description && (
              <div 
                className="text-text-muted text-sm mt-1.5 line-clamp-2"
                dangerouslySetInnerHTML={{ __html: description }} 
              />
            )}
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-4">
        <Badge variant={currentStatus.variant}>
          {t(`status.${project.status}`) || project.status}
        </Badge>
      </div>

      {/* Info Grid - Enhanced */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 my-5 text-sm">
        <div className="flex flex-col gap-1">
          <span className="text-text-muted text-xs font-medium">{t("project.startDate")}</span>
          <div className="flex items-center gap-2 text-text">
            <Calendar size={16} {...getIconColor()} />
            <span className="font-medium truncate">{project.start_date}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-text-muted text-xs font-medium">{t("project.amount")}</span>
          <div className="flex items-center gap-2 text-text">
            <DollarSign size={16} {...getIconColor()} />
            <span className="font-medium">{project.project_amount?.toLocaleString() || "0"}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-text-muted text-xs font-medium">{t("project.progress")}</span>
          <span className="font-bold" {...getTextAccent()}>{progress}%</span>
        </div>
      </div>

      {/* Progress Bar - Enhanced */}
      <div className="mb-5">
        <ProgressBar 
          value={progress} 
          className="h-2.5 rounded-full bg-border"
          barClassName={hasCustomColor ? '' : `bg-${currentStatus.color}`}
          barStyle={hasCustomColor ? { backgroundColor: currentStatus.customColor } : {}}
        />
      </div>

      {/* Footer: Status + Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-border flex-wrap">
        <div className="flex-1" />
        {statusSelector ? (
          statusSelector
        ) : (
          <Badge variant={currentStatus.variant}>
            {t(`status.${project.status}`) || project.status}
          </Badge>
        )}
        <button 
          onClick={onView} 
          className="p-2 rounded-lg hover:bg-background text-text-muted hover:text-primary transition-all"
          title={t("common.view")}
        >
          <Eye size={18} />
        </button>
      </div>
    </div>
  );
}