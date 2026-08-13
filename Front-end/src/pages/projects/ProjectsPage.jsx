// src/pages/ProjectsPage.jsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { 
  fetchProjects, 
  setFilters, 
  selectFilteredProjects,
  cancelProject,
  clearError,
  updateProjectStatus
} from "../../store/slices/projectSlice";
import usePermission from "../../hooks/usePermissions";
import ProjectCard from "../../components/projects/ProjectCard";
import ProjectForm from "../../components/projects/ProjectForm";
import { Search, Plus, Filter } from "lucide-react";
import Button from "../../components/shared/Button";
import { useNavigate } from "react-router-dom";
import ProjectStatusSelector from "../../components/projects/ProjectStatusSelector";



export default function ProjectsPage() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { can } = usePermission();
  const navigate = useNavigate(); 
  const projects = useSelector((state) => state.project.projects);
  // const projects = useSelector(selectFilteredProjects);
  const { loading, error, filters } = useSelector((state) => state.project);
  
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  

  // جلب المشاريع عند تحميل الصفحة
  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  
  // دالة الإلغاء (Soft Delete)
  const handleCancel = async (id) => {
    if (window.confirm(t("confirm.cancelProject"))) {
      await dispatch(cancelProject(id));
    }
  };

  // حالة التحميل الأولي
  if (loading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slideIn">
      {/* Header - Enhanced */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-bold text-text mb-2">{t("nav.projects")}</h1>
          <p className="text-text-muted text-sm">
            {projects.length === 0 
              ? t("project.noProjects") 
              : t("project.count", { count: projects.length })}
          </p>
        </div>
        
{can('project:create', { requiresPosition: 10 }) && (
  <Button 
    onClick={() => { setEditingProject(null); setFormOpen(true); }} 
    className="whitespace-nowrap"
  >
    <Plus size={18} className="me-2" /> {t("common.add")}
  </Button>
)}
      </div>

      {/* Error Message - Enhanced */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-r-lg text-sm shadow-sm animate-slideIn">
          <p className="font-semibold mb-1">⚠️ خطأ</p>
          <p>{error}</p>
          <button onClick={() => dispatch(clearError())} className="mt-3 px-3 py-1 bg-red-100 hover:bg-red-200 rounded transition-colors text-sm font-medium">
            {t("common.dismiss")}
          </button>
        </div>
      )}

      {/* Filters & Search - Enhanced */}
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute start-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              placeholder={t("common.search") + "..."}
              value={filters.search}
              onChange={(e) => dispatch(setFilters({ search: e.target.value }))}
              className="w-full ps-12 pe-4 py-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            />
          </div>
          

          {/* Status Filter */}
          <div className="flex items-center gap-3 flex-1 sm:flex-none">
            <Filter size={18} className="text-text-muted flex-shrink-0" />
            <select
              value={filters.status}
              onChange={(e) => dispatch(setFilters({ status: e.target.value }))}
              className="flex-1 sm:flex-none border border-border rounded-xl px-4 py-3 bg-background text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            >
              <option value="all">{t("common.all")}</option>
              <option value="starting_soon">{t("status.starting_soon")}</option>
              <option value="in_progress">{t("status.in_progress")}</option>
              <option value="completed">{t("status.completed")}</option>
              <option value="canceled">{t("status.canceled")}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Grid - Enhanced */}
      {projects.length === 0 ? (
        <div className="text-center py-20 bg-gradient-to-br from-surface via-background to-surface rounded-2xl border-2 border-dashed border-border">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-text-muted text-lg font-medium mb-2">{t("project.noProjects")}</p>
            {/* <p className="text-text-muted text-sm">ابدأ بإنشاء مشروع جديد لبدء العمل</p> */}
          </div>
         {can('project:create', { requiresPosition: 'general_manager' }) && (
            <Button onClick={() => setFormOpen(true)} className="mt-6">
              <Plus size={18} className="me-2" /> {t("project.createFirst")}
            </Button>
         )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
{projects.map((project, index) => (
  <div key={project.id} style={{ animationDelay: `${index * 50}ms` }} className="animate-slideIn">
    <ProjectCard
      project={project}
      onView={() => navigate(`/projects/${project.id}`)}    
      onEdit={() => { setEditingProject(project); setFormOpen(true); }}
      onCancel={() => handleCancel(project.id)}
      // ✅ تمرير مكون تغيير الحالة لـ ProjectCard
      statusSelector={
<ProjectStatusSelector 
  project={project}
  projectId={project.id}
  onStatusChange={(id, action) => {  // ✅ action هو 0 أو 1 مباشرة
    dispatch(updateProjectStatus({ 
      projectId: id, 
      action: action  // ✅ إرسال 0 أو 1 كما هو
    }));
  }}
  size="normal"
/>
      }
    />
  </div>
))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <ProjectForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        project={editingProject}
      />
    </div>
  );
}