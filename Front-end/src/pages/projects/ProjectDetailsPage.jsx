// src/pages/ProjectDetailsPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  fetchProjectById,
  clearCurrentProject,
  updateProject,
    setCurrentProject,
} from "../../store/slices/projectSlice";
import {
  fetchTasks,
  createTask as createTaskAction,
} from "../../store/slices/taskSlice";
import usePermission from "../../hooks/usePermissions";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Folder,
  Paperclip,
  StickyNote,
  Upload,
  Trash2,
  Edit,
  X,
  Download,
  Eye,
  Plus,
  FileText,
  Clock,
  User,
  Copy,
} from "lucide-react";
import Button from "../../components/shared/Button";
import Badge from "../../components/shared/Badge";
import ProgressBar from "../../components/shared/ProgressBar";
import Modal from "../../components/shared/Modal";
import FileUploader from "../../components/shared/FileUploader";
import TaskForm from "../../components/tasks/TaskForm";
import ImportTasksModal from "../../components/projects/ImportTasksModal";
import TaskCardUnified from "../../components/tasks/TaskCardUnified";
import toast from "react-hot-toast";
import { getLocalizedField } from "../../utils/helpers";
import ReactQuill from "react-quill-new";
import ProjectActiveToggle from "../../components/projects/ProjectActiveToggle";

// ✅ إعدادات المحرر
const editorModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    ["link"],
    ["clean"],
  ],
};

const editorFormats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "align",
  "link",
  "blockquote",
  "code-block",
];
export default function ProjectDetailsPage() {
  // ✅ 1. استخراج الـ ID من الـ URL
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const { can } = usePermission();

  const { currentProject, loading, error, success } = useSelector(
    (state) => state.project,
  );
  const { tasks } = useSelector((state) => state.tasks);
  const currentUser = useSelector((state) => state.auth.user);

  // ✅ 2. فلترة المهام باستخدام useMemo لمنع التكرار
// ✅ 2. فلترة المهام باستخدام useMemo + تطبيق صلاحيات العرض الهرمية
const filteredProjectTasks = useMemo(() => {
  // الخطوة 1: جلب مهام المشروع الأساسية
  let projectTasks = [];
  if (currentProject?.tasks && Array.isArray(currentProject.tasks)) {
    projectTasks = currentProject.tasks.filter(
      (task) => Number(task.project_id) === Number(id),
    );
  } else {
    projectTasks = tasks.filter((task) => Number(task.project_id) === Number(id));
  }
  
  // الخطوة 2: ✅ تطبيق فلترة الصلاحيات الهرمية حسب المنصب
  if (currentUser) {
    const userPosition = currentUser.position_id;
    const userId = currentUser.id;
    const userBranchId = currentUser.branch_id;
    const userSectionId = currentUser.section_id;
    
    // ✅ تعريف مستويات المناصب (الأعلى = رقم أكبر)
    const positionLevels = {
      6: 1,   // Employee
      7: 2,   // Section Manager
      8: 3,   // Branch Manager
      9: 4,   // GM Assistant
      10: 5,  // General Manager
      11: 6,  // System Administrator
    };
    
    const userLevel = positionLevels[userPosition] || 0;
    
    // ✅ الموظف (Position 6): يرى فقط مهامه
    if (userPosition === 6) {
      projectTasks = projectTasks.filter(task => 
        Number(task.created_by_id) === Number(userId) || 
        Number(task.assigned_id) === Number(userId)
      );
    }
    // ✅ مدير القسم (Position 7): يرى مهام قسمه + مهامه الشخصية
    else if (userPosition === 7) {
      projectTasks = projectTasks.filter(task => {
        const taskCreatedByMe = Number(task.created_by_id) === Number(userId);
        const taskAssignedToMe = Number(task.assigned_id) === Number(userId);
        const taskInSection = Number(task.section_id) === Number(userSectionId);
        
        return taskCreatedByMe || taskAssignedToMe || taskInSection;
      });
    }
    // ✅ مدير الفرع (Position 8): يرى مهام فرعه + مهامه الشخصية
    else if (userPosition === 8) {
      projectTasks = projectTasks.filter(task => {
        const taskCreatedByMe = Number(task.created_by_id) === Number(userId);
        const taskAssignedToMe = Number(task.assigned_id) === Number(userId);
        const taskInBranch = Number(task.branch_id) === Number(userBranchId);
        
        return taskCreatedByMe || taskAssignedToMe || taskInBranch;
      });
    }
    // ✅ المساعد العام (Position 9): يرى كل المهام في الشركة
    else if (userPosition === 9) {
      // لا حاجة للفلترة - يرى كل المهام
    }
    // ✅ المدير العام (Position 10): يرى كل المهام في الشركة
    else if (userPosition === 10) {
      // لا حاجة للفلترة - يرى كل المهام
    }
    // ✅ مدير النظام (Position 11): يرى كل المهام
    else if (userPosition === 11) {
      // لا حاجة للفلترة - يرى كل المهام
    }
  }
  
  return projectTasks;
}, [currentProject, tasks, id, currentUser]); // ✅ إضافة currentUser كـ dependency
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [newTaskModalOpen, setNewTaskModalOpen] = useState(false);
  const [importTasksModalOpen, setImportTasksModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [uploadFiles, setUploadFiles] = useState([]);
  // ✅ نظام الأخطاء لمودال التعديل
  const [editError, setEditError] = useState("");
  const [editFieldErrors, setEditFieldErrors] = useState({});

  // ✅ 3. جلب البيانات مرة واحدة فقط عند تغيير الـ ID
  useEffect(() => {
    dispatch(fetchProjectById(id));
    dispatch(fetchTasks());
    return () => {
      dispatch(clearCurrentProject());
    };
  }, [id, dispatch]);

  useEffect(() => {
    if (success) {
      toast.success(success);
      dispatch(fetchProjectById(id));
    }
    if (error) {
      toast.error(error);
    }
  }, [success, error, dispatch, id]);

  useEffect(() => {
    if (currentProject) {
      setEditForm({
        name_ar: currentProject.name_ar || "",
        name_en: currentProject.name_en || "",
        start_date: currentProject.start_date || "",
        expected_expired_date: currentProject.expected_expired_date || "",
        // ✅ تحويل السعر لرقم مع تنسيق عشري
        project_amount: currentProject.project_amount
          ? parseFloat(currentProject.project_amount).toFixed(2)
          : "0.00",
        description_ar: currentProject.description_ar || "",
        description_en: currentProject.description_en || "",
        status: currentProject.status || "starting_soon",
            project_color: currentProject.project_color || "#3b82f6",
 });
      // ✅ مسح الأخطاء القديمة عند فتح المودال
      setEditError("");
      setEditFieldErrors({});
    }
  }, [currentProject]);
  if (loading && !currentProject) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-text mb-4">
          {t("project.notFound")}
        </h2>
        <Button onClick={() => navigate("/projects")}>
          {t("common.back")}
        </Button>
      </div>
    );
  }

  const calculateProjectProgress = () => {
    if (filteredProjectTasks.length === 0) return 0;
    let totalProgress = 0;
    filteredProjectTasks.forEach((task) => {
      const taskStatus = task.task_status || task.status;
      if (task.subtasks && task.subtasks.length > 0) {
        const completedSubtasks = task.subtasks.filter(
          (st) => st.task_status === "completed" || st.status === "completed",
        ).length;
        totalProgress += Math.round(
          (completedSubtasks / task.subtasks.length) * 100,
        );
      } else {
        switch (taskStatus) {
          case "completed":
            totalProgress += 100;
            break;
          case "in_progress":
            totalProgress += 60;
            break;
          case "pending":
            totalProgress += 20;
            break;
          case "canceled":
            totalProgress += 0;
            break;
          default:
            totalProgress += 0;
        }
      }
    });
    return Math.round(totalProgress / filteredProjectTasks.length);
  };

  const name = getLocalizedField(currentProject, "name", i18n.language);
  const description = getLocalizedField(
    currentProject,
    "description",
    i18n.language,
  );
  const progress = calculateProjectProgress();

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError("");
    setEditFieldErrors({});

    // ✅ تحقق بسيط محلي
    if (!editForm.name_ar?.trim()) {
      setEditFieldErrors({
        name_ar:
          t("project.nameAr") +
          " " +
          (i18n.language === "ar" ? "مطلوب" : "is required"),
      });
      return;
    }
    if (!editForm.name_en?.trim()) {
      setEditFieldErrors({
        name_en:
          t("project.nameEn") +
          " " +
          (i18n.language === "ar" ? "مطلوب" : "is required"),
      });
      return;
    }

   try {
  // ✅ تحضير البيانات للإرسال - فقط الحقول المدعومة
  const payload = {
    id: currentProject.id,
    name_ar: editForm.name_ar,
    name_en: editForm.name_en,
    start_date: editForm.start_date,
    expected_expired_date: editForm.expected_expired_date,
    project_amount: editForm.project_amount ? parseFloat(editForm.project_amount) : 0,
    description_ar: editForm.description_ar,
    description_en: editForm.description_en,
    status: editForm.status,
  project_color: editForm.project_color || "#3b82f6", };

  // ✅ الحصول على البيانات المحدثة من الـ response
  const updatedProject = await dispatch(updateProject(payload)).unwrap();
  
  // ✅ تحديث الواجهة فوراً بدون انتظار إعادة الجلب
  dispatch(setCurrentProject(updatedProject));
  


  // await dispatch(updateProject(payload)).unwrap();

  toast.success(t("project.updatedSuccessfully"));
  setEditModalOpen(false);
  // await dispatch(fetchProjectById(id));
  
} catch (err) {
      console.error("❌ Edit error:", err);

      // ✅ معالجة أخطاء التحقق من الـ Backend (422)
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const backendErrors = err.response.data.errors;
        const newErrors = {};

        const keyMap = {
          name_ar: "name_ar",
          name_en: "name_en",
          expected_expired_date: "expected_expired_date",
          project_amount: "project_amount",
        };

        Object.keys(backendErrors).forEach((backendKey) => {
          const formKey = keyMap[backendKey] || backendKey;
          const message = Array.isArray(backendErrors[backendKey])
            ? backendErrors[backendKey][0]
            : String(backendErrors[backendKey]);
          newErrors[formKey] = message;
        });

        setEditFieldErrors(newErrors);

        // تمرير لأول حقل به خطأ
        const firstField = Object.keys(newErrors)[0];
        if (firstField) {
          const element = document.querySelector(`[name="${firstField}"]`);
          element?.scrollIntoView({ behavior: "smooth", block: "center" });
          element?.focus();
        }
      } else {
        // خطأ عام
        const errorMsg = err.response?.data?.message;
        if (typeof errorMsg === "object" && errorMsg !== null) {
          const firstKey = Object.keys(errorMsg)[0];
          setEditError(
            Array.isArray(errorMsg[firstKey])
              ? errorMsg[firstKey][0]
              : String(errorMsg[firstKey]),
          );
        } else {
          setEditError(
            typeof errorMsg === "string" ? errorMsg : t("project.saveError"),
          );
        }
      }
    }
  };
  // ✅ دالة تبديل حالة النشاط (Active/Inactive)
 /*  const handleToggleActive = async (projectId, newActiveState) => {
    try {
      await dispatch(
        updateProject({
          id: projectId,
          is_active: newActiveState ? 1 : 0,
        }),
      );
      // ✅ إعادة جلب البيانات المحدثة
      await dispatch(fetchProjectById(id));
    } catch (err) {
      console.error("❌ Toggle active failed:", err);
      throw err; // ليعالجها المكون
    }
  };
 */
  
  const handleToggleActive = async (projectId, newActiveState) => {
  try {
    const payload = {
      id: projectId,
      is_active: newActiveState ? 1 : 0,
    };
    
    const updatedProject = await dispatch(updateProject(payload)).unwrap();
    
    // ✅ تحديث فوري للواجهة
    dispatch(setCurrentProject(updatedProject));
    
    toast.success(newActiveState ? t("project.activated") : t("project.deactivated"));
    
  } catch (err) {
    console.error("❌ Toggle active failed:", err);
    toast.error(t("project.toggleFailed"));
    throw err;
  }
};
  const handleUploadFiles = async () => {
    if (uploadFiles.length === 0) {
      toast.error(t("project.selectFiles"));
      return;
    }
    await dispatch(
      uploadProjectFiles({ projectId: currentProject.id, files: uploadFiles }),
    );
    setUploadModalOpen(false);
    setUploadFiles([]);
  };

  const handleDeleteFile = async (fileId) => {
    if (window.confirm(t("confirm.deleteFile"))) {
      await dispatch(
        deleteProjectFile({ projectId: currentProject.id, fileId }),
      );
    }
  };

  const handleCancelProject = async () => {
    if (window.confirm(t("confirm.cancelProject"))) {
      await dispatch(cancelProject(currentProject.id));
      navigate("/projects");
    }
  };

  // ✅ 4. دالة استيراد المهام المصححة
  const handleImportTasks = async (tasksToImport) => {
    try {
      console.log("📥 Importing tasks:", tasksToImport);

      for (const task of tasksToImport) {
        const taskData = {
          ...task,
          project_id: parseInt(id),
          task_status: "pending", // إعادة تعيين الحالة
          status: "pending",
          id: undefined,
          created_at: undefined,
          updated_at: undefined,
          project: undefined,
          assigned_user: task.assigned_id ? undefined : task.assigned_user,
        };
        await dispatch(createTaskAction(taskData));
      }
      toast.success(t("task.tasksImportedSuccessfully"));
      setImportTasksModalOpen(false);
      await dispatch(fetchTasks());
      await dispatch(fetchProjectById(id));
    } catch (err) {
      console.error("❌ Import error:", err);
      toast.error(t("task.failedToImportTasks"));
    }
  };

  const statusVariant =
    {
      starting_soon: "status-pending",
      in_progress: "status-in-progress",
      completed: "status-completed",
      canceled: "status-canceled",
    }[currentProject.status] || "status-pending";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/projects")}>
          <ArrowLeft size={18} className="ms-2" />
          {t("common.back")}
        </Button>

        <div className="flex items-center gap-2">
          {/* ✅ زر تبديل النشاط - بسيط وسهل */}
          <ProjectActiveToggle
            project={currentProject}
            onToggle={handleToggleActive}
            disabled={loading}
          />

          {/* زر التعديل */}
          <Button variant="secondary" onClick={() => setEditModalOpen(true)}>
            <Edit size={16} className="ms-2" />
            {t("common.edit")}
          </Button>
        </div>
      </div>

      {/* Project Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Folder className="text-primary" size={20} />
            </div>
            <h1 className="text-xl font-bold text-text">{name}</h1>
          </div>
          <Badge variant={statusVariant} className="mt-2">
            {t(`status.${currentProject.status}`) || currentProject.status}
          </Badge>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-text-muted mb-2">
            <Calendar size={18} />
            <span className="text-sm">{t("project.duration")}</span>
          </div>
          <p className="text-sm font-medium">{currentProject.start_date}</p>
          <p className="text-sm text-text-muted">
            {t("common.to")} {currentProject.expected_expired_date}
          </p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-text-muted mb-2">
            <DollarSign size={18} />
            <span className="text-sm">{t("project.budget")}</span>
          </div>
          <p className="text-2xl font-bold text-primary">
            {currentProject.project_amount?.toLocaleString()} $
          </p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 text-text-muted mb-2">
            <ProgressBar value={0} className="h-1" />
            <span className="text-sm">{t("project.progress")}</span>
          </div>
          <p className="text-2xl font-bold text-primary">{progress}%</p>
          <ProgressBar value={progress} className="mt-2" />
        </div>
      </div>

      {/* Description */}
      {description && (
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-bold text-text mb-3 flex items-center gap-2">
            <StickyNote size={18} className="text-primary" />
            {t("project.description")}
          </h2>

          <div
            className="text-text leading-relaxed"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </div>
      )}

      {/* Tasks Section - ✅ تم إصلاح الهيكلية هنا */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
                <FileText size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {t("task.projectTasks")}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {filteredProjectTasks.length} {t("task.tasks")}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {/* {can("task:create") && ( */}
              <Button
                onClick={() => setNewTaskModalOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/30"
              >
                <Plus size={18} className="ms-2" />
                {t("common.add")}
              </Button>
              {/* )} */}
              {/* {filteredProjectTasks.length > 0 && ( */}
              <Button
                variant="outline"
                onClick={() => setImportTasksModalOpen(true)}
                className="border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
              >
                <Copy size={16} className="ms-2" />
                {t("task.importFromProject")}
              </Button>
              {/* )} */}
            </div>
          </div>
        </div>

        <div className="p-6">
          {filteredProjectTasks.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-b from-gray-50 to-white rounded-2xl border-2 border-dashed border-gray-200">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText size={40} className="text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg mb-2">{t("task.noTasks")}</p>
              {can("task:create") && (
                <Button
                  onClick={() => setNewTaskModalOpen(true)}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                >
                  <Plus size={16} className="ms-2" />
                  {t("task.createFirst")}
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredProjectTasks.map((task, index) => (
                <TaskCardUnified
                  key={task.id}
                  task={task}
                  index={index}
                  onView={() => navigate(`/tasks/${task.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      {/* ✅ نهاية قسم المهام بشكل صحيح */}

      {/* Files Section */}
      {/* <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text flex items-center gap-2">
            <Paperclip size={18} className="text-primary" />
            {t("project.attachments")}
          </h2>
          {can("project:upload_files") && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setUploadModalOpen(true)}
            >
              <Upload size={16} className="ms-2" />
              {t("common.upload")}
            </Button>
          )}
        </div>
        {currentProject.files && currentProject.files.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentProject.files.map((file) => (
              <div
                key={file.id}
                className="border border-border rounded-lg p-4 hover:shadow-md transition bg-background"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Paperclip className="text-primary" size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-text-muted">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => window.open(file.url, "_blank")}
                      className="p-1.5 rounded hover:bg-surface text-text-muted transition"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => window.open(file.url, "_blank")}
                      className="p-1.5 rounded hover:bg-surface text-primary transition"
                    >
                      <Download size={14} />
                    </button>
                    {can("project:delete_files") && (
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="p-1.5 rounded hover:bg-surface text-danger transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-text-muted">
            <Paperclip size={48} className="mx-auto mb-3 opacity-50" />
            <p>{t("project.noFiles")}</p>
          </div>
        )}
      </div> */}

      {/* Modals */}
      {/* ✅ Edit Modal - مُصحح مع دعم الأخطاء وتحسين التصميم */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={t("project.edit")}
        size="xl" // Use extra large size
        className="max-w-4xl"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setEditModalOpen(false)}
              disabled={loading}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={handleEditSubmit} loading={loading}>
              {t("common.save")}
            </Button>
          </>
        }
      >
        {/* ✅ رسالة خطأ عامة */}
        {editError && (
          <div className="bg-danger/10 border border-danger text-danger px-4 py-3 rounded-lg mb-4 text-sm flex items-start gap-2">
            <span>⚠️</span>
            <span>{editError}</span>
          </div>
        )}

        <form
          onSubmit={handleEditSubmit}
          className="space-y-5 max-h-[70vh] overflow-y-auto pr-2"
        >
          {/* الأسماء */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("project.nameAr")} *
              </label>
              <input
                type="text"
                name="name_ar"
                value={editForm.name_ar || ""}
                onChange={(e) => {
                  setEditForm({ ...editForm, name_ar: e.target.value });
                  if (editFieldErrors.name_ar)
                    setEditFieldErrors({ ...editFieldErrors, name_ar: null });
                }}
                className={`w-full border rounded-lg px-3 py-2 bg-background focus:ring-2 outline-none ${
                  editFieldErrors.name_ar
                    ? "border-danger focus:ring-danger/20"
                    : "border-border focus:ring-primary/20"
                }`}
                required
              />
              {editFieldErrors.name_ar && (
                <p className="text-xs text-danger mt-1">
                  ⚠️ {editFieldErrors.name_ar}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("project.nameEn")} *
              </label>
              <input
                type="text"
                name="name_en"
                value={editForm.name_en || ""}
                onChange={(e) => {
                  setEditForm({ ...editForm, name_en: e.target.value });
                  if (editFieldErrors.name_en)
                    setEditFieldErrors({ ...editFieldErrors, name_en: null });
                }}
                className={`w-full border rounded-lg px-3 py-2 bg-background focus:ring-2 outline-none ${
                  editFieldErrors.name_en
                    ? "border-danger focus:ring-danger/20"
                    : "border-border focus:ring-primary/20"
                }`}
                required
              />
              {editFieldErrors.name_en && (
                <p className="text-xs text-danger mt-1">
                  ⚠️ {editFieldErrors.name_en}
                </p>
              )}
            </div>
          </div>

          {/* التواريخ والمبلغ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("project.startDate")}
              </label>
              <input
                type="date"
                name="start_date"
                value={editForm.start_date || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, start_date: e.target.value })
                }
                className="w-full border border-border rounded-lg px-3 py-2 bg-background focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("project.expectedEndDate")}
              </label>
              <input
                type="date"
                name="expected_expired_date"
                value={editForm.expected_expired_date || ""}
                onChange={(e) => {
                  setEditForm({
                    ...editForm,
                    expected_expired_date: e.target.value,
                  });
                  if (editFieldErrors.expected_expired_date)
                    setEditFieldErrors({
                      ...editFieldErrors,
                      expected_expired_date: null,
                    });
                }}
                className={`w-full border rounded-lg px-3 py-2 bg-background focus:ring-2 outline-none ${
                  editFieldErrors.expected_expired_date
                    ? "border-danger focus:ring-danger/20"
                    : "border-border focus:ring-primary/20"
                }`}
              />
              {editFieldErrors.expected_expired_date && (
                <p className="text-xs text-danger mt-1">
                  ⚠️ {editFieldErrors.expected_expired_date}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("project.amount")}
              </label>
              <input
                type="number"
                name="project_amount"
                step="0.01"
                min="0"
                value={
                  editForm.project_amount !== undefined &&
                  editForm.project_amount !== null
                    ? parseFloat(editForm.project_amount).toFixed(2)
                    : "0.00"
                }
                onChange={(e) => {
                  setEditForm({ ...editForm, project_amount: e.target.value });
                  if (editFieldErrors.project_amount)
                    setEditFieldErrors({
                      ...editFieldErrors,
                      project_amount: null,
                    });
                }}
                className={`w-full border rounded-lg px-3 py-2 bg-background focus:ring-2 outline-none ${
                  editFieldErrors.project_amount
                    ? "border-danger focus:ring-danger/20"
                    : "border-border focus:ring-primary/20"
                }`}
                placeholder="0.00"
              />
              {editFieldErrors.project_amount && (
                <p className="text-xs text-danger mt-1">
                  ⚠️ {editFieldErrors.project_amount}
                </p>
              )}
            </div>
          </div>

          {/* الحالة */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("project.status")}
            </label>
            <select
              name="status"
              value={editForm.status || "starting_soon"}
              onChange={(e) =>
                setEditForm({ ...editForm, status: e.target.value })
              }
              className="w-full border border-border rounded-lg px-3 py-2 bg-background focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="starting_soon">{t("status.starting_soon")}</option>
              <option value="in_progress">{t("status.in_progress")}</option>
              <option value="completed">{t("status.completed")}</option>
              <option value="canceled">{t("status.canceled")}</option>
            </select>
          </div>
<div>
  <label className="block text-sm font-medium mb-1">
    {t("project.color")}
  </label>
  <div className="flex items-center gap-3">
    <input
      type="color"
      name="project_color"
      value={editForm.project_color || "#3b82f6"}
      onChange={(e) => {
        setEditForm({ ...editForm, project_color: e.target.value });
        if (editFieldErrors.project_color) {
          setEditFieldErrors({ ...editFieldErrors, project_color: null });
        }
      }}
      className="w-12 h-10 border border-border rounded-lg cursor-pointer bg-background"
      title={t("project.selectColor")}
    />
    <span className="text-sm text-text-muted font-mono">
      {editForm.project_color || "#3b82f6"}
    </span>
  </div>
  {editFieldErrors.project_color && (
    <p className="text-xs text-danger mt-1 flex items-center gap-1">
      <span>⚠️</span>
      {editFieldErrors.project_color}
    </p>
  )}
</div>
          {/* الوصف - تصميم محسّن */}
          <div className="space-y-4">
            {/* Arabic Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                {t("project.descriptionAr")}
              </label>
              <div className="react-quill-wrapper">
                <ReactQuill
                  theme="snow"
                  value={editForm.description_ar || ""}
                  onChange={(content) =>
                    setEditForm({ ...editForm, description_ar: content })
                  }
                  modules={editorModules}
                  formats={editorFormats}
                  placeholder={t("project.descriptionArPlaceholder")}
                  className="bg-white"
                  style={{ height: "250px" }}
                />
              </div>
            </div>

            {/* English Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                {t("project.descriptionEn")}
              </label>
              <div className="react-quill-wrapper">
                <ReactQuill
                  theme="snow"
                  value={editForm.description_en || ""}
                  onChange={(content) =>
                    setEditForm({ ...editForm, description_en: content })
                  }
                  modules={editorModules}
                  formats={editorFormats}
                  placeholder={t("project.descriptionEnPlaceholder")}
                  className="bg-white"
                  style={{ height: "250px" }}
                />
              </div>
            </div>
          </div>

          {/* ✅ تم إزالة حقل is_active - أصبح يُدار عبر زر منفصل */}
        </form>
      </Modal>

      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title={t("project.uploadFiles")}
        footer={
          <>
            <Button variant="ghost" onClick={() => setUploadModalOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleUploadFiles} loading={loading}>
              {t("common.upload")}
            </Button>
          </>
        }
      >
        <FileUploader onChange={setUploadFiles} maxFiles={5} maxSizeMB={5} />
      </Modal>

<TaskForm
  isOpen={newTaskModalOpen}
  onClose={() => setNewTaskModalOpen(false)}
  
  // ✅ الدالة الصحيحة التي تستلم الـ formData وتنشئ المهمة
  onSubmit={async (formData) => {
    try {
      // ✅ تحضير بيانات المهمة الجديدة
      const taskData = {
        ...formData,
        project_id: parseInt(id),
        task_status: "pending",  // ✅ الحالة الافتراضية
        status: "pending",
        status_approval: "pending",
        // ✅ حذف الحقول التي لا تُرسل عند الإنشاء
        id: undefined,
        created_at: undefined,
        updated_at: undefined,
        project: undefined,
        assigned_user: formData.assigned_id ? undefined : formData.assigned_user,
        subtasks: undefined,
        sub_task: undefined,
      };

      // ✅ إنشاء المهمة عبر Redux
      await dispatch(createTaskAction(taskData)).unwrap();
      
      // ✅ عرض رسالة نجاح
      toast.success(t("task.createdSuccessfully"));
      
      // ✅ إغلاق المودال
      setNewTaskModalOpen(false);
      
      // ✅ إعادة جلب البيانات المحدثة
      await dispatch(fetchTasks());
      await dispatch(fetchProjectById(id));
      
    } catch (error) {
      console.error("❌ Create task error:", error);
      
      // ✅ معالجة الأخطاء وعرضها للمستخدم
      const errorMsg = error.response?.data?.message || error.message || t("task.createFailed");
      toast.error(errorMsg);
   }
  }}
  
  task={null}
  defaultProjectId={id}
/>

      <ImportTasksModal
        isOpen={importTasksModalOpen}
        onClose={() => setImportTasksModalOpen(false)}
        currentProjectId={id}
        mode="from-project"
        onImport={handleImportTasks}
      />
    </div>
  );
}
