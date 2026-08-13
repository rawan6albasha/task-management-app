// src/components/projects/ProjectActiveToggle.jsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function ProjectActiveToggle({ project, onToggle, disabled = false }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  
  const isActive = project.is_active === 1 || project.is_active === true;
  
  const handleClick = async () => {
    if (disabled || loading) return;
    
    setLoading(true);
    try {
      await onToggle(project.id, !isActive);
      toast.success(isActive ? t("project.deactivated") : t("project.activated"));
    } catch (err) {
      console.error('❌ Toggle failed:', err);
      toast.error(t("project.toggleFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium 
        transition-all border hover:shadow-sm
        ${isActive 
          ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      title={isActive ? t("project.deactivateHint") : t("project.activateHint")}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : isActive ? (
        <ToggleRight size={18} className="text-green-600" />
      ) : (
        <ToggleLeft size={18} className="text-gray-400" />
      )}
      <span className="hidden sm:inline">
        {isActive ? t("project.active") : t("project.inactive")}
      </span>
    </button>
  );
}