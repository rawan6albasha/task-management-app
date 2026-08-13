// src/pages/TasksPage.jsx
import { useEffect, useState, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import api from "../../lib/axios";
import {
  fetchTasks,
  setFilters,
  selectFilteredTasks,
  createTask,
  updateTask,
  clearError,
  updateTaskStatus,
  deleteTask,
} from "../../store/slices/taskSlice";
import {
  fetchProjectById,
  fetchProjects,
} from "../../store/slices/projectSlice";
import usePermission from "../../hooks/usePermissions";
import TaskCard from "../../components/tasks/TaskCard";
import TaskCardUnified from "../../components/tasks/TaskCardUnified";
import TaskForm from "../../components/tasks/TaskForm";
import SearchFilter from "../../components/shared/SearchFilter";
import {
  Search,
  Plus,
  Filter,
  LayoutGrid,
  List,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Copy,
  Download,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  Loader2,
} from "lucide-react";
import Button from "../../components/shared/Button";
import Badge from "../../components/shared/Badge";
import toast from "react-hot-toast";
import TaskStatusSelector from "../../components/tasks/TaskStatusSelector";
import ImportTasksModal from "../../components/projects/ImportTasksModal";
import { useParams, useNavigate } from "react-router-dom";
import { getLocalizedField } from "../../utils/helpers";

// ✅ دالة التحقق من صلاحية تغيير الحالة (حسب الـ SRS)
const canChangeTaskStatus = (task, currentUser, newStatus, can) => {
  if (!task || !currentUser) return false;
  if (can("task:edit_all") || currentUser.role === "admin") return true;
  if (task.created_by_id === currentUser.id) return true;
  if (task.assigned_id === currentUser.id) return newStatus !== "cancelled";
  if (currentUser.role === "section_manager" && currentUser.section_id === task.section_id) return true;
  if (currentUser.role === "branch_manager" && currentUser.branch_id === task.branch_id) return true;
  return false;
};

// ✅ دالة آمنة لاستخراج رسالة الخطأ من استجابة Laravel
const extractErrorMessage = (error) => {
  try {
    if (!error?.response?.data) return "حدث خطأ غير متوقع";
    const data = error.response.data;
    if (data.errors && typeof data.errors === "object") {
      const firstField = Object.keys(data.errors)[0];
      return data.errors[firstField]?.[0] || "خطأ في التحقق من البيانات";
    }
    if (data.message) {
      if (typeof data.message === "string") return data.message;
      if (typeof data.message === "object" && data.message !== null) {
        const firstKey = Object.keys(data.message)[0];
        const firstMsg = data.message[firstKey];
        if (Array.isArray(firstMsg)) return firstMsg[0];
        return typeof firstMsg === "string" ? firstMsg : "خطأ في الخادم";
      }
    }
    return typeof data === "string" ? data : "حدث خطأ غير متوقع";
  } catch (e) {
    console.error("Error extraction failed:", e);
    return "حدث خطأ غير متوقع";
  }
};

// ✅ دالة تحديد إذا كان الكرت للقراءة فقط
const isTaskReadOnly = (task, currentUser, can) => {
  if (!task || !currentUser) return true;
  if (task.created_by_id === currentUser.id) return false;
  if (task.assigned_id === currentUser.id) return false;
  return true;
};

export default function TasksPage() {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const { can } = usePermission();
  const navigate = useNavigate();
  const { id: projectId } = useParams();

  // ✅ استخدام الـ selector للفلترة المحلية
  const allTasks = useSelector((state) => state.tasks.tasks);
  const filters = useSelector((state) => state.tasks.filters);
  const currentUser = useSelector((state) => state.auth.user);
  const { loading, error, success, pagination } = useSelector((state) => state.tasks);
  const { projects: projectsList } = useSelector((state) => state.project);

  // ✅ الفلترة المحلية باستخدام الـ selector
  const filteredTasks = useMemo(() => {
    return selectFilteredTasks({ 
      tasks: { tasks: allTasks, filters }, 
      auth: { user: currentUser } 
    });
  }, [allTasks, filters, currentUser]);

  // ✅ بايجينشن محلي
  const ITEMS_PER_PAGE = 10;
  const currentPage = filters.page || 1;
  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / ITEMS_PER_PAGE));
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const { projectsLoading } = useSelector((state) => state.project);
  const allUsers = useSelector((state) => state.auth.users || []);
  const allBranches = useSelector((state) => state.project.branches || []);
  const allSections = useSelector((state) => state.project.sections || []);

  // ✅ Memoize الخيارات للفلاتر
  const assignedOptions = useMemo(() => {
    return Array.from(
      new Map(
        allTasks
          .filter((t) => t.assigned_user?.id)
          .map((t) => [
            t.assigned_user.id,
            { value: t.assigned_user.id, label: t.assigned_user.name },
          ]),
      ).values(),
    );
  }, [allTasks]);

// ✅ branchOptions
const branchOptions = useMemo(() => {
  return Array.from(
    new Map(
      allBranches
        .filter((b) => b.id)
        .map((b) => [
          b.id,
          {
            value: b.id,
            // ✅ اختيار الاسم حسب اللغة مع fallback
            label: i18n.language === 'ar'
              ? (b.ar_name || b.en_name || b.name)
              : (b.en_name || b.ar_name || b.name),
          },
        ]),
    ).values(),
  );
}, [allBranches, i18n.language]); // ✅ إضافة i18n.language كـ dependency

// ✅ sectionOptions
const sectionOptions = useMemo(() => {
  return Array.from(
    new Map(
      allSections
        .filter((s) => s.id)
        .map((s) => [
          s.id,
          {
            value: s.id,
            label: i18n.language === 'ar'
              ? (s.ar_name || s.en_name || s.name)
              : (s.en_name || s.ar_name || s.name),
          },
        ]),
    ).values(),
  );
}, [allSections, i18n.language]); // ✅ إضافة i18n.language كـ dependency

  const getTaskOwnershipLabel = (task) => {
    if (!currentUser) return "-";
    const isCreatedByMe = String(task.created_by_id) === String(currentUser.id);
    const isAssignedToMe = String(task.assigned_id) === String(currentUser.id);
    if (isCreatedByMe && isAssignedToMe) return `${t("task.createdByMe")} / ${t("task.assignedToMe")}`;
    if (isCreatedByMe) return t("task.createdByMe");
    if (isAssignedToMe) return t("task.assignedToMe");
    return "-";
  };

  const [targetProjectId, setTargetProjectId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [importTasksModalOpen, setImportTasksModalOpen] = useState(false);
  const [multipleTasksMode, setMultipleTasksMode] = useState(false);
  const [taskQueue, setTaskQueue] = useState([]);

  const exportDropdownRef = useRef(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // ✅ إغلاق قائمة التصدير عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
        setIsExportOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ دالة التصدير (Excel / PDF)
  const handleExport = async (type) => {
    setIsExporting(true);
    try {
      const endpoint = type === "excel" ? "/api/tasks/export-task" : "/api/tasks/export-pdf";
      const response = await api.get(endpoint, { responseType: "blob" });
      const blob = response instanceof Blob ? response : response.data;
      if (!blob || blob.size === 0) throw new Error("لم يتم استلام الملف");
      if (blob.type?.includes("application/json")) {
        const text = await blob.text();
        const error = JSON.parse(text);
        throw new Error(error.message || "فشل في التصدير");
      }
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
      const fileName = type === "excel" ? `tasks_export_${timestamp}.xlsx` : `tasks_report_${timestamp}.pdf`;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(t("task.exportSuccess"));
    } catch (error) {
      console.error("Export error:", error);
      toast.error(error.message || t("task.exportFailed"));
    } finally {
      setIsExporting(false);
      setIsExportOpen(false);
    }
  };

  // ✅ دالة استيراد المهام
  const handleImportTasks = async (tasksToImport, importedTargetProjectId) => {
    try {
      const finalTargetId = importedTargetProjectId || targetProjectId;
      if (!finalTargetId) {
        toast.error(t("task.selectTargetProjectFirst"));
        return;
      }
      for (const task of tasksToImport) {
        const taskData = {
          ...task,
          project_id: parseInt(finalTargetId),
          task_status: "pending",
          status: "pending",
          status_approval: "pending",
          branch_id: task.branch_id || currentUser?.branch_id || null,
          section_id: task.section_id || currentUser?.section_id || null,
          position_id: task.position_id || currentUser?.position_id || null,
          id: undefined,
          created_at: undefined,
          updated_at: undefined,
          completed_date: undefined,
          project: undefined,
          assigned_user: undefined,
          subtasks: undefined,
          sub_task: undefined,
          amount: task.amount ? parseFloat(parseFloat(task.amount).toFixed(2)) : null,
        };
        await dispatch(createTask(taskData));
      }
      const targetProject = projectsList?.find((p) => p?.id === parseInt(finalTargetId));
      const projectName = targetProject ? getLocalizedField(targetProject, "name", i18n.language) : `#${finalTargetId}`;
      const message = tasksToImport.length === 1 && tasksToImport[0]?.title_ar
        ? `✅ "${getLocalizedField(tasksToImport[0], "title", i18n.language)}" → "${projectName}"`
        : `✅ ${tasksToImport.length} مهام → "${projectName}"`;
      toast.success(message, { duration: 3000, position: "top-center" });
      setImportTasksModalOpen(false);
      // ✅ إعادة جلب كل المهام لتحديث الـ frontend filtering
      await dispatch(fetchTasks({ project_id: finalTargetId, per_page: 1000 }));
      await dispatch(fetchProjectById(finalTargetId));
    } catch (err) {
      console.error("❌ Import error:", err);
      toast.error(err.response?.data?.message || t("task.failedToImportTasks"));
    }
  };

  const handleAddToQueue = (taskData) => {
    setTaskQueue([...taskQueue, { ...taskData, tempId: Date.now() }]);
    setFormOpen(false);
    toast.success(t("task.addedToQueue"));
  };

  const handleSaveMultipleTasks = async () => {
    try {
      for (const task of taskQueue) {
        await dispatch(createTask(task));
      }
      setTaskQueue([]);
      setMultipleTasksMode(false);
      toast.success(t("task.savedSuccessfully"));
    } catch (error) {
      toast.error(t("task.saveFailed"));
    }
  };

  // ✅ دالة السحب والإفلات
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;
    const newStatus = destination.droppableId;
    const taskId = parseInt(draggableId);
    const task = allTasks.find((t) => t.id === taskId);
    if (!task) return;
    if (!canChangeTaskStatus(task, currentUser, newStatus, can)) {
      toast.error(newStatus === "cancelled" ? t("task.onlyCreatorCanCancel") : t("task.noPermissionToChangeStatus"));
      return;
    }
    try {
      await dispatch(updateTaskStatus({ taskId, status: newStatus }));
      // ✅ إعادة جلب المهام لتحديث الفلترة المحلية
      await dispatch(fetchTasks({ project_id: filters.project_id, per_page: 1000 }));
      toast.success(t("task.statusUpdated"));
    } catch (error) {
      console.error("❌ Drag error:", error);
      toast.error(extractErrorMessage(error));
    }
  };

  // ✅ جلب البيانات عند التحميل
  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchTasks({ project_id: projectId || null, per_page: 1000 }));
  }, [dispatch, projectId]);

  // ✅ إعادة جلب المهام فقط عند تغيير المشروع (ليس عند تغيير الفلاتر الأخرى)
  useEffect(() => {
    if (filters.project_id) {
      dispatch(fetchTasks({ project_id: filters.project_id, per_page: 1000 }));
    }
  }, [dispatch, filters.project_id]);

  // ✅ عرض رسائل النجاح/الخطأ
  useEffect(() => {
    if (success) {
      toast.success(success);
      dispatch(clearError());
    }
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [success, error, dispatch]);

  // ✅ دالة تغيير الفلاتر - مع إعادة الصفحة للأولى (بدون إعادة جلب من الباك)
 const handleFilterChange = (newFilters) => {
    dispatch(setFilters({ 
      ...filters, 
      ...newFilters, 
      page: newFilters.page !== undefined ? newFilters.page : 1 
    }));
  };

  const handleClearFilters = () => {
    dispatch(setFilters({
      task_status: "", priority: "", search: "", project_id: null, assigned_id: null,
      branch_id: null, section_id: null, due_date: null, status_approval: null,
      my_tasks: "all", page: 1
    }));
  };

  // ✅ دالة تغيير الحالة
  const handleStatusChange = async (taskId, newStatus) => {
    const task = allTasks.find((t) => t.id === taskId);
    if (task && !canChangeTaskStatus(task, currentUser, newStatus, can)) {
      toast.error(newStatus === "cancelled" ? t("task.onlyCreatorCanCancel") : t("task.noPermissionToChangeStatus"));
      return;
    }
    try {
      await dispatch(updateTaskStatus({ taskId, status: newStatus }));
      await dispatch(fetchTasks({ project_id: filters.project_id, per_page: 1000 }));
      toast.success(t("task.statusUpdated"));
    } catch (error) {
      console.error("❌ Status change error:", error);
      toast.error(extractErrorMessage(error));
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      await dispatch(createTask(taskData)).unwrap();
      setFormOpen(false);
      toast.success(t("task.createdSuccessfully"));
      // ✅ إعادة جلب كل المهام لتحديث الفلترة المحلية
      await dispatch(fetchTasks({ project_id: filters.project_id, per_page: 1000 }));
    } catch (error) {
      console.error("❌ Create Error:", error);
      toast.error(error.message || t("task.createFailed"));
    }
  };

  const handleUpdateTask = async (formData) => {
    const taskId = editingTask?.id;
    if (!taskId) {
      toast.error("❌ خطأ: لم يتم تحديد المهمة");
      return;
    }
    await dispatch(updateTask({ taskId, ...formData }));
    setFormOpen(false);
    // ✅ إعادة جلب كل المهام لتحديث الفلترة المحلية
    await dispatch(fetchTasks({ project_id: filters.project_id, per_page: 1000 }));
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm(t("confirm.deleteTask"))) {
      await dispatch(deleteTask(taskId));
      // ✅ إعادة جلب كل المهام لتحديث الفلترة المحلية
      await dispatch(fetchTasks({ project_id: filters.project_id, per_page: 1000 }));
    }
  };
  const isAnyFilterActive = useMemo(() => {
  return Object.entries(filters).some(([key, value]) => {
    // تجاهل مفاتيح الترتيب والصفحة
    if (['page', 'sort_by', 'order'].includes(key)) return false;
    // إرجاع true إذا كانت القيمة غير فارغة وغير "الكل"
    return value !== null && value !== '' && value !== 'all';
  });
}, [filters]);

  if (loading && allTasks.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-slideIn pb-8">
      {/* Header */}
      <div className="space-y-4 md:space-y-0">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 pb-4 md:pb-6 border-b-2 border-border">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text mb-2 tracking-tight">
              {t("nav.tasks")}
            </h1>
            <p className="text-text-muted text-sm md:text-base font-medium">
              {filteredTasks.length === 0 ? t("task.noTasks") : `${t("task.count", { count: filteredTasks.length })} ${t("common.task")}`}
            </p>
          </div>

          {/* أزرار التحكم */}
          <div className="flex flex-wrap gap-2 md:gap-3 items-center justify-start md:justify-end">
            {can("task:export", { requiresPosition: 7 }) && (
              <div className="relative" ref={exportDropdownRef}>
                <button onClick={() => setIsExportOpen(!isExportOpen)} disabled={isExporting}
                  className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-xl text-sm font-medium text-text hover:border-primary/50 hover:text-primary transition-all disabled:opacity-60 h-[38px]">
                  {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  <span className="hidden sm:inline">{t("task.export")}</span>
                  <ChevronDown size={14} className={`transition-transform ${isExportOpen ? "rotate-180" : ""}`} />
                </button>
                {isExportOpen && (
                  <div className="absolute top-full end-0 mt-2 w-48 bg-surface border border-border rounded-xl shadow-xl z-[60] overflow-hidden animate-fadeIn">
                    <button onClick={() => handleExport("excel")} disabled={isExporting}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-text hover:bg-background transition-colors disabled:opacity-50 text-start">
                      <FileSpreadsheet size={16} className="text-green-600 flex-shrink-0" /><span>Excel (.xlsx)</span>
                    </button>
                    <button onClick={() => handleExport("pdf")} disabled={isExporting}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-text hover:bg-background transition-colors border-t border-border disabled:opacity-50 text-start">
                      <FileText size={16} className="text-red-600 flex-shrink-0" /><span>PDF (.pdf)</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <Button variant={viewMode === "list" ? "primary" : "secondary"} size="sm" onClick={() => setViewMode("list")} className="flex-shrink-0 h-[38px]">
              <List size={16} className="me-1" /><span className="hidden sm:inline">{t("task.listView")}</span>
            </Button>
            <Button variant={viewMode === "board" ? "primary" : "secondary"} size="sm" onClick={() => setViewMode("board")} className="flex-shrink-0 h-[38px]">
              <LayoutGrid size={16} className="me-1" /><span className="hidden sm:inline">{t("task.boardView")}</span>
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setImportTasksModalOpen(true)} className="flex-shrink-0 h-[38px]">
              <Copy size={16} className="ms-2" /><span className="hidden sm:inline">{t("task.importFromProject")}</span>
            </Button>
            <Button type="button" onClick={() => { setEditingTask(null); setFormOpen(true); }} size="sm" className="flex-shrink-0 h-[38px]">
              <Plus size={16} className="me-1" /><span className="hidden sm:inline">{t("common.add")}</span>
            </Button>
          </div>
        </div>

        {/* Task Queue */}
        {taskQueue.length > 0 && (
          <div className="bg-surface border-2 border-primary/30 rounded-xl p-4 md:p-6 mb-6 shadow-sm animate-fadeIn">
            <div className="flex items-center justify-between mb-4 flex-col sm:flex-row gap-3 sm:gap-0">
              <h3 className="text-lg md:text-xl font-bold text-text flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg text-primary font-bold">{taskQueue.length}</span>
                {t("task.taskQueue")}
              </h3>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="ghost" size="sm" onClick={() => setTaskQueue([])} className="flex-1 sm:flex-none">{t("common.clear")}</Button>
                <Button onClick={handleSaveMultipleTasks} size="sm" className="flex-1 sm:flex-none">{t("common.saveAll")}</Button>
              </div>
            </div>
            <div className="space-y-2">
              {taskQueue.map((task, index) => (
                <div key={task.tempId} className="flex items-center justify-between p-3 bg-background rounded-lg hover:bg-background/70 transition-colors border border-border">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-sm font-bold text-primary bg-primary/10 w-6 h-6 flex items-center justify-center rounded">{index + 1}</span>
                    <span className="font-medium text-text truncate text-sm">{getLocalizedField(task, 'title', i18n.language)}</span>
                    <Badge variant={`priority_${task.priority}`} className="text-xs">{t(`priority.${task.priority}`)}</Badge>
                  </div>
                  <button onClick={() => setTaskQueue(taskQueue.filter((t) => t.tempId !== task.tempId))} className="p-2 rounded-lg hover:bg-red-100 text-red-500 transition-all flex-shrink-0">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <SearchFilter
        filters={filters}
        onFilterChange={handleFilterChange}
        onClear={handleClearFilters}
        statusOptions={[{ value: "pending", label: "status.pending" }, { value: "in_progress", label: "status.in_progress" }, { value: "completed", label: "status.completed" }, { value: "cancelled", label: "status.cancelled" }]}
        priorityOptions={[{ value: "high", label: "priority.high" }, { value: "medium", label: "priority.medium" }, { value: "low", label: "priority.low" }]}
        projectOptions={projectsList || []}
        assignedOptions={assignedOptions}
        branchOptions={branchOptions}
        sectionOptions={sectionOptions}
        approvalOptions={[{ value: "pending", label: "task.approvalStatus.pending" }, { value: "confirmed", label: "task.approvalStatus.confirmed" }, { value: "rejected", label: "task.approvalStatus.rejected" }]}
        myTasksOptions={[{ value: "all", label: "task.allTasks" }, { value: "created", label: "task.createdByMe" }, { value: "assigned", label: "task.assignedToMe" }, { value: "both", label: "task.myTasks" }]}
        showProjectFilter={true}
        showAssignedFilter={true}
        showBranchFilter={true}
        showSectionFilter={true}
        showDueDateFilter={true}
        showApprovalFilter={true}
        showMyTasksFilter={true}
      />

      {/* Tasks Display */}
      {paginatedTasks.length === 0 ? (
        isAnyFilterActive ? (
          // 🟡 حالة: الفلاتر نشطة ولكن لا توجد نتائج مطابقة
          <div className="text-center py-16 bg-surface rounded-2xl border border-border/50 px-6 animate-fadeIn">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-background rounded-full mb-4">
              <Search className="w-6 h-6 text-text-muted/60" />
            </div>
            <p className="text-text-muted font-medium text-lg">
              {t("task.noResults") || "لا توجد نتائج مطابقة للفلاتر المحددة"}
            </p>
            <p className="text-text-muted/70 text-sm mt-1 mb-5">
              {t("task.tryChangingFilters") || "جرّب تعديل معايير البحث أو مسح الفلاتر"}
            </p>
            <Button variant="outline" onClick={handleClearFilters} size="sm">
              {t("common.clearAll")}
            </Button>
          </div>
        ) : (
          // 🟢 حالة: لا توجد مهام نهائياً (يعرض زر الإضافة كما كان)
          <div className="text-center py-16 md:py-24 bg-gradient-to-br from-surface via-background to-surface rounded-2xl border-2 border-dashed border-border/50 px-4 md:px-8">
            <div className="max-w-md mx-auto space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-3xl">
                <svg className="w-8 h-8 md:w-10 md:h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="space-y-2">
                <p className="text-text-muted text-base md:text-lg font-bold">{t("task.noTasks")}</p>
                <p className="text-text-muted text-sm md:text-base leading-relaxed">{t("task.createFirstTask")}</p>
              </div>
              <Button onClick={() => setFormOpen(true)} size="md" className="w-full">
                <Plus size={20} className="me-2" /><span>{t("task.createFirst")}</span>
              </Button>
            </div>
          </div>
        )
      ) : viewMode === "board" ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5 auto-rows-min pb-2 overflow-x-auto">
            {["pending", "in_progress", "completed", "cancelled"].map((status) => (
              <Droppable key={status} droppableId={status}>
                {(provided, snapshot) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className={`min-w-full md:min-w-0 rounded-xl p-3 md:p-4 transition-all duration-200 ${snapshot.isDraggingOver ? "bg-primary/10 ring-2 ring-primary/30 shadow-lg" : "bg-background/50 border border-border/50"}`}>
                    <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-border/70">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={`w-3.5 h-3.5 rounded-full flex-shrink-0 ${status === "pending" ? "bg-amber-500" : status === "in_progress" ? "bg-blue-500" : status === "completed" ? "bg-emerald-500" : "bg-red-500"}`}></div>
                        <h3 className="font-bold text-sm md:text-base lg:text-lg text-text truncate">{t(`status.${status}`)}</h3>
                        <Badge variant="default" className="text-xs px-2 py-0.5 ms-auto">{paginatedTasks.filter((task) => task.task_status === status).length}</Badge>
                      </div>
                    </div>
                    <div className="space-y-3 min-h-[200px] md:min-h-[300px]">
                      {paginatedTasks.filter((task) => task.task_status === status).map((task, index) => {
                        const isLocked = isTaskReadOnly(task, currentUser, can);
                        return (
                          <Draggable key={task.id} draggableId={String(task.id)} index={index} isDragDisabled={isLocked}>
                            {(provided, snapshot) => (
                              <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className={`${snapshot.isDragging ? "opacity-80" : ""}`}>
                                <TaskCard task={task} onView={(taskId) => { if (taskId) navigate(`/tasks/${taskId}`); }} onEdit={(taskId) => { if (taskId) { const taskToEdit = allTasks.find((t) => t.id === taskId); if (taskToEdit) { setEditingTask(taskToEdit); setFormOpen(true); } }}} onDelete={(taskId) => { if (taskId && window.confirm(t("confirm.deleteTask"))) handleDeleteTask(taskId); }} onStatusChange={(newStatus) => handleStatusChange(task.id, newStatus)} canEdit={can("task:edit")} canDelete={can("task:delete")} isDraggable={!isLocked} isLocked={isLocked} />
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      ) : (
        /* List View */
        <div className="space-y-3 md:space-y-0">
          {/* Desktop Table */}
          <div className="hidden md:block bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="text-start px-4 lg:px-6 py-4 text-sm font-bold text-text">{t("task.title")}</th>
                    <th className="text-start px-4 lg:px-6 py-4 text-sm font-bold text-text-muted">{t("task.project")}</th>
                    <th className="text-start px-4 lg:px-6 py-4 text-sm font-bold text-text-muted">{t("task.priority")}</th>
                    <th className="text-start px-4 lg:px-6 py-4 text-sm font-bold text-text-muted">{t("task.role")}</th>
                    <th className="text-start px-4 lg:px-6 py-4 text-sm font-bold text-text-muted">{t("task.dueDate")}</th>
                    <th className="text-start px-4 lg:px-6 py-4 text-sm font-bold text-text-muted">{t("task.status")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-background/50 transition-all duration-200 group cursor-pointer" onClick={() => navigate(`/tasks/${task.id}`)}>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-1.5 h-8 rounded-full bg-priority-${task.priority} flex-shrink-0`}></div>
                          <div className="min-w-0">
                            <p className="font-semibold text-primary hover:text-primary/80 transition-colors truncate text-sm lg:text-base" onClick={(e) => { e.stopPropagation(); navigate(`/tasks/${task.id}`); }}>{getLocalizedField(task, 'title', i18n.language)}</p>
                            <p className="text-xs text-text-muted truncate">{task.assigned_user?.name || t("task.unassigned")}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-sm text-text-muted"><span className="truncate block">{getLocalizedField(task.project, 'name', i18n.language) || "-"}</span></td>
                      <td className="px-4 lg:px-6 py-4"><Badge variant={`priority_${task.priority}`} className="text-xs lg:text-sm">{task.priority === "high" && "🔴"}{task.priority === "medium" && "🟡"}{task.priority === "low" && "🟢"}<span className="ms-1">{t(`priority.${task.priority}`)}</span></Badge></td>
                      <td className="px-4 lg:px-6 py-4 text-sm text-text-muted font-medium">{getTaskOwnershipLabel(task)}</td>
                      <td className="px-4 lg:px-6 py-4 text-sm text-text-muted font-medium">{task.due_date ? new Date(task.due_date).toLocaleDateString() : "-"}</td>
                      <td className="px-4 lg:px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <TaskStatusSelector task={task} taskId={task.id} onStatusChange={handleStatusChange} size="small" className="cursor-pointer hover:scale-[1.02] transition-transform" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {paginatedTasks.map((task, index) => (
              <TaskCardUnified key={task.id} task={task} index={index} to={`/tasks/${task.id}`} isClickable={true} />
            ))}
          </div>
        </div>
      )}

      {/* ✅ Pagination محلي (فرونت إند فقط) */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-4 border-t border-border mt-6">
          {/* زر السابق */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleFilterChange({ page: Math.max(1, currentPage - 1) })}
            disabled={currentPage === 1}
            className="w-full sm:w-auto"
          >
            {t("common.previous")}
          </Button>
          
          {/* أرقام الصفحات */}
          <div className="flex items-center gap-1 sm:gap-2 justify-center flex-wrap">
            {/* الصفحة الأولى */}
            <Button
              variant={currentPage === 1 ? "primary" : "secondary"}
              size="sm"
              onClick={() => handleFilterChange({ page: 1 })}
              className="min-w-10 h-10"
            >
              1
            </Button>
            
            {/* نقاط (...) */}
            {currentPage > 3 && <span className="px-1 text-text-muted">...</span>}
            
            {/* الصفحات الوسطى */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => page > 1 && page < totalPages) // استبعاد الأولى والأخيرة
              .filter(page => Math.abs(page - currentPage) <= 1) // عرض الصفحة الحالية والسابقة والتالية فقط
              .map(page => (
                <Button
                  key={page}
                  variant={currentPage === page ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => handleFilterChange({ page })}
                  className="min-w-10 h-10"
                >
                  {page}
                </Button>
              ))}
            
            {/* نقاط (...) */}
            {currentPage < totalPages - 2 && <span className="px-1 text-text-muted">...</span>}
            
            {/* الصفحة الأخيرة */}
            {totalPages > 1 && (
              <Button
                variant={currentPage === totalPages ? "primary" : "secondary"}
                size="sm"
                onClick={() => handleFilterChange({ page: totalPages })}
                className="min-w-10 h-10"
              >
                {totalPages}
              </Button>
            )}
          </div>
          
          {/* زر التالي */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleFilterChange({ page: Math.min(totalPages, currentPage + 1) })}
            disabled={currentPage === totalPages}
            className="w-full sm:w-auto"
          >
            {t("common.next")}
          </Button>
        </div>
      )}

      {/* Modals */}
      <TaskForm isOpen={formOpen} onClose={() => { setFormOpen(false); setEditingTask(null); }} task={editingTask} onSubmit={editingTask ? handleUpdateTask : handleCreateTask} />
      <ImportTasksModal isOpen={importTasksModalOpen} onClose={() => setImportTasksModalOpen(false)} currentProjectId={null} mode="from-project" onImport={handleImportTasks} projects={projectsList} />
    </div>
  );
}