// src/components/shared/SearchFilter.jsx
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  X,
  Calendar,
  User,
  Building2,
  FolderKanban,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { useTranslation } from "react-i18next";


function SearchFilter({
  filters,
  onFilterChange,
  onClear,
  statusOptions = [],
  priorityOptions = [],
  projectOptions = [],
  assignedOptions = [],
  branchOptions = [],
  sectionOptions = [],
  approvalOptions = [],
  myTasksOptions = [],
  showProjectFilter = false,
  showAssignedFilter = false,
  showBranchFilter = false,
  showSectionFilter = false,
  showDueDateFilter = false,
  showApprovalFilter = false,
  showMyTasksFilter = false,
}) {

  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // ✅ منطق إغلاق النافذة عند النقر خارجها (مُحسّن)
  const handleClickOutside = useCallback((event) => {
    if (dropdownRef.current && dropdownRef.current.contains(event.target))
      return;
    if (buttonRef.current && buttonRef.current.contains(event.target)) return;
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(
        () => document.addEventListener("mousedown", handleClickOutside),
        0,
      );
      return () => {
        clearTimeout(timer);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen, handleClickOutside]);

  // حساب الفلاتر النشطة
  const activeFilters = Object.entries(filters).filter(
    ([key, val]) =>
      key !== "search" && key !== "page" && val && val !== "" && val !== "all",
  );

  const handleToggleFilter = (key, value) => {
    onFilterChange({ [key]: value === "all" || value === "" ? null : value });
  };

  const getFilterLabel = (key, value) => {
    if (key === "task_status") return t(`status.${value}`) || value;
    if (key === "priority") return t(`priority.${value}`) || value;
    if (key === "status_approval")
      return t(`task.approvalStatus.${value}`) || value;
    if (key === "my_tasks")
      return myTasksOptions.find((opt) => opt.value === value)?.label
        ? t(myTasksOptions.find((opt) => opt.value === value).label)
        : t("task.myTasks");
    if (key === "project_id") {
      const project = projectOptions.find((p) => p.id === Number(value));
      if (project) {
        // ✅ اختيار الاسم حسب اللغة مع fallback
        return i18n.language === 'ar'
          ? project.name_ar || project.name_en || t("task.project")
          : project.name_en || project.name_ar || t("task.project");
      }
      return t("task.project");
    }
    console.log('i18n.language === ar', i18n.language === 'ar')
    if (key === "assigned_id")
      return (
        assignedOptions.find((u) => u.value === Number(value))?.label ||
        t("task.assignedTo")
      );
    if (key === "branch_id")
      return (
        branchOptions.find((b) => b.value === Number(value))?.label ||
        t("task.branch")
      );
    if (key === "section_id")
      return (
        sectionOptions.find((s) => s.value === Number(value))?.label ||
        t("task.section")
      );
    if (key === "due_date") return `${t("task.dueDate")}: ${value}`;
    return value;
  };

  // ✅ مكون فلتر موحد (Label + Input)
  const FilterField = ({ icon, label, children }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-text-muted flex items-center gap-1.5">
        {icon}
        {label}
      </label>
      {children}
    </div>
  );

  // ✅ تنسيقات موحدة للحقول
  const fieldClass =
    "w-full h-11 px-4 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer hover:border-primary/50";

  // ✅ محتوى الفلاتر المشترك (يُستخدم في الشاشات الكبيرة والمنسدلة)
  const FiltersContent = () => (
    <>
      <FilterField
        icon={<CheckCircle2 size={14} className="text-blue-500" />}
        label={t("task.status")}
      >
        <select
          value={filters.task_status || ""}
          onChange={(e) => handleToggleFilter("task_status", e.target.value)}
          className={fieldClass}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <option value="">{t("common.all")}</option>
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {t(opt.label)}
            </option>
          ))}
        </select>
      </FilterField>

      <FilterField
        icon={<AlertCircle size={14} className="text-orange-500" />}
        label={t("task.priority")}
      >
        <select
          value={filters.priority || ""}
          onChange={(e) => handleToggleFilter("priority", e.target.value)}
          className={fieldClass}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <option value="">{t("common.all")}</option>
          {priorityOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {t(opt.label)}
            </option>
          ))}
        </select>
      </FilterField>

      {showMyTasksFilter && myTasksOptions?.length > 0 && (
        <FilterField
          icon={<User size={14} className="text-purple-500" />}
          label={t("task.myTasks")}
        >
          <select
            value={filters.my_tasks || ""}
            onChange={(e) => handleToggleFilter("my_tasks", e.target.value)}
            className={fieldClass}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <option value="">{t("common.all")}</option>
            {myTasksOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t(opt.label)}
              </option>
            ))}
          </select>
        </FilterField>
      )}

{showProjectFilter && projectOptions?.length > 0 && (
  <FilterField
    icon={<FolderKanban size={14} className="text-green-500" />}
    label={t("task.project")}
  >
    <select
      value={filters.project_id || ""}
      onChange={(e) =>
        onFilterChange({
          project_id: e.target.value ? Number(e.target.value) : null,
        })
      }
      className={fieldClass}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <option value="">{t("task.allProjects")}</option>
      {projectOptions.map((opt) => {
        // ✅ اختيار اسم المشروع حسب اللغة مع fallback
        const projectName = i18n.language === 'ar'
          ? (opt.name_ar || opt.name_en || opt.name)
          : (opt.name_en || opt.name_ar || opt.name);
        
        return (
          <option key={opt.id} value={opt.id}>
            {projectName}
          </option>
        );
      })}
    </select>
  </FilterField>
)}

      {showAssignedFilter && assignedOptions?.length > 0 && (
        <FilterField
          icon={<User size={14} className="text-indigo-500" />}
          label={t("task.assignedTo")}
        >
          <select
            value={filters.assigned_id || ""}
            onChange={(e) =>
              onFilterChange({
                assigned_id: e.target.value ? Number(e.target.value) : null,
              })
            }
            className={fieldClass}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <option value="">{t("task.allUsers")}</option>
            {assignedOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FilterField>
      )}

      {showBranchFilter && branchOptions?.length > 0 && (
        <FilterField
          icon={<Building2 size={14} className="text-teal-500" />}
          label={t("task.branch")}
        >
          <select
            value={filters.branch_id || ""}
            onChange={(e) =>
              onFilterChange({
                branch_id: e.target.value ? Number(e.target.value) : null,
              })
            }
            className={fieldClass}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <option value="">{t("task.allBranches")}</option>
            {branchOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FilterField>
      )}

      {showSectionFilter && sectionOptions?.length > 0 && (
        <FilterField
          icon={<FolderKanban size={14} className="text-pink-500" />}
          label={t("task.section")}
        >
          <select
            value={filters.section_id || ""}
            onChange={(e) =>
              onFilterChange({
                section_id: e.target.value ? Number(e.target.value) : null,
              })
            }
            className={fieldClass}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <option value="">{t("task.allSections")}</option>
            {sectionOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FilterField>
      )}

      {showApprovalFilter && approvalOptions?.length > 0 && (
        <FilterField
          icon={<CheckCircle2 size={14} className="text-emerald-500" />}
          label={t("task.approval")}
        >
          <select
            value={filters.status_approval || ""}
            onChange={(e) =>
              handleToggleFilter("status_approval", e.target.value)
            }
            className={fieldClass}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <option value="">{t("task.allApprovalStatus")}</option>
            {approvalOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t(opt.label)}
              </option>
            ))}
          </select>
        </FilterField>
      )}

{showDueDateFilter && (
  <FilterField
    icon={<Calendar size={14} className="text-red-500" />}
    label={t("task.dueDate")}
  >
    <input
      type="date"
      value={filters.due_date || ""}
      onChange={(e) =>
        onFilterChange({ due_date: e.target.value || null })
      }
      // ✅ إزالة cursor-pointer لأنها تتعارض مع الـ date picker الأصلي
      // ✅ إضافة onMouseDown لمنع إغلاق الـ Dropdown عند النقر على الحقل (للموبايل)
      className={`w-full h-11 px-3 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all hover:border-primary/50 ${
        filters.due_date ? 'text-text' : 'text-text-muted'
      }`}
      dir="ltr"
      onMouseDown={(e) => e.stopPropagation()} // ✅ منع إغلاق الـ Dropdown عند فتح الـ date picker
    />
  </FilterField>
)}
    </>
  );

  return (
    <div className="w-full space-y-4 relative z-10">
      {/* 🔍 الصف الأول: البحث + زر الفلاتر (للموبايل) */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search
            className="absolute start-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            size={18}
          />
          <input
            type="text"
            placeholder={t("task.search") + "..."}
            value={filters.search || ""}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="w-full ps-10 pe-4 h-11 bg-surface border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-text"
          />
        </div>

        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className={`lg:hidden flex items-center gap-2 px-4 h-11 border rounded-xl transition-all text-sm font-medium cursor-pointer select-none ${
            isOpen || activeFilters.length > 0
              ? "bg-primary/10 border-primary text-primary"
              : "bg-surface border-border text-text-muted hover:border-primary/50 hover:text-primary"
          }`}
        >
          <Filter size={18} />
          <span className="hidden sm:inline">{t("task.filters")}</span>
          <ChevronDown
            size={16}
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
          {activeFilters.length > 0 && (
            <span className="w-5 h-5 flex items-center justify-center bg-primary text-white text-[10px] font-bold rounded-full">
              {activeFilters.length}
            </span>
          )}
        </button>
      </div>

      {/* 🏷️ الفلاتر النشطة كـ Tags */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-surface/50 border border-border/50 rounded-xl">
          {activeFilters.map(([key, val]) => (
            <span
              key={key}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs rounded-lg border border-primary/20"
            >
              {getFilterLabel(key, val)}
              <button
                onClick={() => handleToggleFilter(key, null)}
                className="hover:text-danger transition-colors cursor-pointer p-0.5"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <button
            onClick={onClear}
            className="text-xs text-text-muted hover:text-danger underline transition-colors ms-auto cursor-pointer"
          >
            {t("common.clearAll")}
          </button>
        </div>
      )}

      {/* 📐 حاوية الفلاتر الرئيسية */}
      <div className="relative">
        {/* 🖥️ الشاشات الكبيرة: عرض مباشر في شبكة أنيقة */}
        <div className="hidden  lg:grid grid-cols-7 xl:grid-cols-7 2xl:grid-cols-7 gap-4 p-5 bg-surface border border-border rounded-2xl">
          <FiltersContent />
        </div>

        {/* 📱 الشاشات الصغيرة: عرض داخل نافذة منسدلة */}
        {isOpen && (
          <div
            ref={dropdownRef}
            className="lg:hidden absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-2xl shadow-xl z-50 overflow-hidden animate-fadeIn"
          >
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
              <FiltersContent />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchFilter;
