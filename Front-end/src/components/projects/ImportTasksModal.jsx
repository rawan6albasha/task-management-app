// src/components/projects/ImportTasksModal.jsx
import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { fetchAllUsers } from "../../store/slices/userSlice";
import Modal from "../shared/Modal";
import Button from "../shared/Button";
import Badge from "../shared/Badge";
import { getLocalizedField } from "../../utils/helpers";
import {
  Search,
  Edit2,
  ChevronDown,
  ChevronRight,
  FolderTree,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAdmin } from "../../hooks/useAdmin";
import ReactQuill from "react-quill-new";

export default function ImportTasksModal({
  isOpen,
  onClose,
  currentProjectId,
  currentParentTaskId,
  mode = "from-project",
  onImport,
  projects: parentProjects,
}) {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();

  const projectState = useSelector((state) => state.project);
  const reduxProjects = projectState?.projects || [];
  const { projects: projectsList, loading: projectsLoading } = useSelector(
    (state) => state.project,
  );

  const { tasks } = useSelector((state) => state.tasks);
  const { allUsers: usersData } = useAdmin();
  const currentUser = useSelector((state) => state.auth?.user);

  const allUsers = useMemo(() => usersData || [], [usersData]);

  // ✅ نظام الأخطاء: كائن يحتوي على رسالة خطأ لكل حقل لكل مهمة
  const [fieldErrors, setFieldErrors] = useState({});

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

  const availableProjects = useMemo(() => {
    if (
      parentProjects &&
      Array.isArray(parentProjects) &&
      parentProjects.length > 0
    )
      return parentProjects;
    if (Array.isArray(reduxProjects) && reduxProjects.length > 0)
      return reduxProjects;
    return [];
  }, [parentProjects, reduxProjects]);

  const [targetProjectId, setTargetProjectId] = useState(
    currentProjectId || "",
  );
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [selectedSubtasks, setSelectedSubtasks] = useState({});
  const [expandedTasks, setExpandedTasks] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [importMode, setImportMode] = useState("manual");
  const [editableFields, setEditableFields] = useState({});
  const [editedValues, setEditedValues] = useState({});
  const [userFilters, setUserFilters] = useState({
    branch_id: "",
    section_id: "",
    position_id: "",
  });

  const organizeTasksByParent = (tasks) => {
    if (!Array.isArray(tasks) || tasks.length === 0) return {};
    const organized = {};
    tasks.forEach((task) => {
      if (task?.id) {
        organized[task.id] = { ...task, _subtasks: [] };
      }
    });
    tasks.forEach((task) => {
      if (task?.parent_id && organized[task.parent_id]) {
        organized[task.parent_id]._subtasks.push(organized[task.id]);
      }
    });
    return organized;
  };

  const organizedTasks = useMemo(() => organizeTasksByParent(tasks), [tasks]);

  const getSubtasks = (task) => {
    if (!task?.id) return [];
    return organizedTasks[task.id]?._subtasks || [];
  };

  const otherProjects = useMemo(() => {
    if (!Array.isArray(availableProjects) || availableProjects.length === 0)
      return [];
    const currentId = currentProjectId ? parseInt(currentProjectId) : null;
    return availableProjects
      .filter((p) => p && p.id)
      .filter((p) => (currentId ? p.id !== currentId : true));
  }, [availableProjects, currentProjectId]);

const sourceTasks = useMemo(() => {
  if (!selectedProject || !selectedProject.id) return [];

  // ✅ المصدر الأول: المهام المرفقة مع كائن المشروع (الأفضل)
  if (selectedProject.tasks && Array.isArray(selectedProject.tasks)) {
    let projectTasks = selectedProject.tasks.filter((task) => {
      if (!task || !task.project_id) return false;
      return String(task.project_id) === String(selectedProject.id);
    });

    if (mode === "from-task") {
      return projectTasks.filter((t) => getSubtasks(t).length > 0);
    }
    return projectTasks;
  }

  // ✅ المصدر الثاني (Fallback): المهام من الـ Redux global state
  if (Array.isArray(tasks)) {
    const projectId = String(selectedProject.id);
    let projectTasks = tasks.filter((task) => {
      if (!task || !task.project_id) return false;
      return String(task.project_id) === projectId;
    });

    if (mode === "from-task") {
      return projectTasks.filter((t) => getSubtasks(t).length > 0);
    }
    return projectTasks;
  }

  return [];
}, [mode, selectedProject, tasks]); // ✅ إضافة selectedProject.tasks كـ dependency ضمني
  const activeUsers = useMemo(
    () =>
      allUsers.filter(
        (u) => u?.account_status === "active" || u?.status === "active",
      ),
    [allUsers],
  );

  const getFilteredUsers = () => {
    let users = activeUsers;
    if (userFilters.branch_id)
      users = users.filter(
        (u) => u?.branch_id === Number(userFilters.branch_id),
      );
    if (userFilters.section_id)
      users = users.filter(
        (u) => u?.section_id === Number(userFilters.section_id),
      );
    if (userFilters.position_id)
      users = users.filter(
        (u) => u?.position_id === Number(userFilters.position_id),
      );
    return users;
  };

  const branches = useMemo(
    () => [...new Set(activeUsers.map((u) => u?.branch_id).filter(Boolean))],
    [activeUsers],
  );
  const sections = useMemo(
    () => [...new Set(activeUsers.map((u) => u?.section_id).filter(Boolean))],
    [activeUsers],
  );
  const positions = useMemo(
    () => [...new Set(activeUsers.map((u) => u?.position_id).filter(Boolean))],
    [activeUsers],
  );

  const filteredTasks = useMemo(() => {
    if (!Array.isArray(sourceTasks)) return [];
    
    return sourceTasks.filter((task) => {
      if (!task) return false;
      const name =
        getLocalizedField(task, "title", i18n.language)?.toLowerCase() || "";
      const desc =
        getLocalizedField(task, "description", i18n.language)?.toLowerCase() ||
        "";
      return (
        name.includes(searchQuery.toLowerCase()) ||
        desc.includes(searchQuery.toLowerCase())
      );
    });

  }, [sourceTasks, searchQuery, i18n.language]);
      console.log('🔍 ImportModal Filters Debug:', {

  selectedProject: selectedProject,
  sourceTasks: sourceTasks,

  // organizedTasksSample: Object.entries(organizedTasks).slice(0, 3)
});

  useEffect(() => {
    if (isOpen) dispatch(fetchAllUsers());
  }, [isOpen, dispatch]);

  // ✅ مسح الأخطاء عند إغلاق المودال
  useEffect(() => {
    if (!isOpen) {
      setFieldErrors({});
    }
  }, [isOpen]);

  const handleTaskToggle = (taskId, withSubtasks = false) => {
    const newSelected = new Set(selectedTasks);
    const newSelectedSubtasks = { ...selectedSubtasks };
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
      delete newSelectedSubtasks[taskId];
      const newEditable = { ...editableFields };
      const newEdited = { ...editedValues };
      delete newEditable[taskId];
      delete newEdited[taskId];
      // ✅ مسح أخطاء هذه المهمة
      const newErrors = { ...fieldErrors };
      delete newErrors[taskId];
      setFieldErrors(newErrors);
      setEditableFields(newEditable);
      setEditedValues(newEdited);
    } else {
      newSelected.add(taskId);
      if (withSubtasks) {
        const task = sourceTasks.find((t) => t?.id === taskId);
        if (task) {
          const subs = getSubtasks(task);
          newSelectedSubtasks[taskId] = new Set(
            subs.map((s) => s?.id).filter(Boolean),
          );
        }
      }
    }
    setSelectedTasks(newSelected);
    setSelectedSubtasks(newSelectedSubtasks);
  };

  const handleSubtaskToggle = (parentId, subtaskId) => {
    const current = selectedSubtasks[parentId] || new Set();
    const newSet = new Set(current);
    if (newSet.has(subtaskId)) newSet.delete(subtaskId);
    else newSet.add(subtaskId);
    setSelectedSubtasks((prev) => ({ ...prev, [parentId]: newSet }));
  };

  // ✅ دالة لتحديد/إلغاء تحديد كل الأبناء
  const handleToggleAllSubtasks = (parentId) => {
    const task = sourceTasks.find((t) => t?.id === parentId);
    if (!task) return;

    const subs = getSubtasks(task);
    const current = selectedSubtasks[parentId] || new Set();

    if (current.size === subs.length) {
      // إلغاء تحديد الكل
      setSelectedSubtasks((prev) => {
        const updated = { ...prev };
        delete updated[parentId];
        return updated;
      });
    } else {
      // تحديد الكل
      const allSubIds = new Set(subs.map((s) => s?.id).filter(Boolean));
      setSelectedSubtasks((prev) => ({ ...prev, [parentId]: allSubIds }));
    }
  };

  const toggleExpand = (taskId) =>
    setExpandedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));

  const toggleFieldEdit = (taskId, fieldName) => {
    setEditableFields((prev) => ({
      ...prev,
      [taskId]: { ...prev[taskId], [fieldName]: !prev[taskId]?.[fieldName] },
    }));
    // ✅ مسح خطأ الحقل عند تفعيل التعديل
    if (fieldErrors[taskId]?.[fieldName]) {
      setFieldErrors((prev) => ({
        ...prev,
        [taskId]: { ...prev[taskId], [fieldName]: null },
      }));
    }
  };

  const updateEditedValue = (taskId, fieldName, value) => {
    setEditedValues((prev) => ({
      ...prev,
      [taskId]: { ...prev[taskId], [fieldName]: value },
    }));
    // ✅ مسح خطأ الحقل عند البدء بالكتابة
    if (fieldErrors[taskId]?.[fieldName]) {
      setFieldErrors((prev) => ({
        ...prev,
        [taskId]: { ...prev[taskId], [fieldName]: null },
      }));
    }
  };

  // ✅ دالة التحقق من صحة الحقول القابلة للتعديل
  const validateTaskFields = (taskId, edits, isEditable) => {
    const errors = {};
    const lang = i18n.language;
    const requiredMsg = lang === "ar" ? "مطلوب" : "is required";

    // التحقق من الحقول المطلوبة فقط إذا كانت قابلة للتعديل
    if (
      isEditable.title_ar &&
      (!edits.title_ar || edits.title_ar.trim() === "")
    ) {
      errors.title_ar = `${t("task.titleAr")} ${requiredMsg}`;
    }
    if (isEditable.due_date && (!edits.due_date || edits.due_date === "")) {
      errors.due_date = `${t("task.dueDate")} ${requiredMsg}`;
    }
    if (
      isEditable.amount &&
      (edits.amount === "" ||
        edits.amount === null ||
        isNaN(parseFloat(edits.amount)))
    ) {
      errors.amount = `${t("task.amount")} ${lang === "ar" ? "يجب أن يكون رقماً" : "must be a number"}`;
    }
    if (
      isEditable.assigned_id &&
      (!edits.assigned_id || edits.assigned_id === "")
    ) {
      errors.assigned_id = `${t("task.assignedTo")} ${requiredMsg}`;
    }

    return errors;
  };

  // const prepareImportedTasks = () => {
  //   const result = [];
  //   selectedTasks.forEach((taskId) => {
  //     const task = sourceTasks.find((t) => t?.id === taskId);
  //     if (!task) return;
  //     const edits = editedValues[taskId] || {};
  //     const isEditable = editableFields[taskId] || {};

  //     const mainTask = {
  //       ...task,
  //       project_id: targetProjectId
  //         ? parseInt(targetProjectId)
  //         : parseInt(task.project_id),
  //       task_status: isEditable.status ? edits.status : "pending",
  //       status: isEditable.status ? edits.status : "pending",
  //       priority: isEditable.priority ? edits.priority : task.priority,
  //       assigned_id: isEditable.assigned_id
  //         ? (edits.assigned_id ?? task.assigned_id)
  //         : task.assigned_id,
  //       due_date: isEditable.due_date ? edits.due_date : task.due_date,
  //       amount: isEditable.amount ? edits.amount : task.amount,
  //       needs_approval: isEditable.needs_approval
  //         ? edits.needs_approval
  //         : task.needs_approval,
  //       title_ar: isEditable.title_ar ? edits.title_ar : task.title_ar,
  //       title_en: isEditable.title_en ? edits.title_en : task.title_en,
  //       description_ar: isEditable.description_ar
  //         ? edits.description_ar
  //         : task.description_ar,
  //       description_en: isEditable.description_en
  //         ? edits.description_en
  //         : task.description_en,
  //       parent_id: mode === "from-task" ? currentParentTaskId : task.parent_id,
  //       id: undefined,
  //       created_at: undefined,
  //       updated_at: undefined,
  //       project: undefined,
  //       subtasks: undefined,
  //       sub_task: undefined,
  //       assigned_user: isEditable.assigned_id ? undefined : task.assigned_user,
  //     };
  //     result.push(mainTask);

  //     if (mode === "from-project" && selectedSubtasks[taskId]) {
  //       const subtasksToImport = getSubtasks(task);
  //       subtasksToImport.forEach((sub) => {
  //         if (selectedSubtasks[taskId]?.has(sub?.id)) {
  //           result.push({
  //             ...sub,
  //             task_status: "pending",
  //             status: "pending",
  //             project_id: targetProjectId
  //               ? parseInt(targetProjectId)
  //               : parseInt(task.project_id),
  //             parent_id: mainTask.id,
  //             id: undefined,
  //             created_at: undefined,
  //             updated_at: undefined,
  //             project: undefined,
  //             assigned_user: undefined,
  //           });
  //         }
  //       });
  //     }
  //   });
  //   return result;
  // };

  const prepareImportedTasks = () => {
    const result = [];

    selectedTasks.forEach((taskId) => {
      const task = sourceTasks.find((t) => t?.id === taskId);
      if (!task) return;

      const edits = editedValues[taskId] || {};
      const isEditable = editableFields[taskId] || {};

      // ✅ المهمة الرئيسية - إرسال جميع الحقول الإلزامية دائماً
      const mainTask = {
        // ✅ الحقول المطلوبة إجبارياً من الـ Backend (لا تحذفها أبداً)
        project_id: targetProjectId
          ? parseInt(targetProjectId)
          : parseInt(task.project_id),
        branch_id: task.branch_id || null,
        section_id: task.section_id || null,
        assigned_id: isEditable.assigned_id
          ? (edits.assigned_id ?? task.assigned_id)
          : task.assigned_id || null,
        type: task.type || "task", // ✅ حقل مطلوب
        title_ar: isEditable.title_ar
          ? edits.title_ar?.trim() || task.title_ar
          : task.title_ar || "عنوان غير محدد",
        title_en: isEditable.title_en
          ? edits.title_en?.trim() || task.title_en
          : task.title_en || "",
        priority: isEditable.priority
          ? edits.priority || task.priority
          : task.priority || "medium",
        due_date: isEditable.due_date
          ? edits.due_date || task.due_date
          : task.due_date || null,
        amount: isEditable.amount
          ? edits.amount
            ? parseFloat(edits.amount)
            : 0
          : task.amount
            ? parseFloat(task.amount)
            : 0,
        needs_approval: isEditable.needs_approval
          ? (edits.needs_approval ?? task.needs_approval)
          : (task.needs_approval ?? 0),

        // ✅ الحقول الاختيارية
        description_ar: isEditable.description_ar
          ? edits.description_ar || task.description_ar
          : task.description_ar || "",
        description_en: isEditable.description_en
          ? edits.description_en || task.description_en
          : task.description_en || "",
        start_date: task.start_date || null,
        end_date: task.end_date || null,

        // ✅ تعيين الحالة لـ pending دائماً عند الاستيراد
        task_status: "pending",
        status: "pending",

        // ✅ تعيين الوالد حسب الوضع
        parent_id:
          mode === "from-task" ? currentParentTaskId : task.parent_id || null,

        // ✅ حذف الحقول التي تسبب مشاكل في الإنشاء
        id: undefined,
  created_at: getCurrentDateTime(),
  updated_at: getCurrentDateTime(),
        completed_date: undefined,
        project: undefined,
        assigned_user: undefined, // ✅ لا نرسل كائن المستخدم، فقط assigned_id
        subtasks: undefined,
        sub_task: undefined,
      };

      result.push(mainTask);

      // ✅ المهام الفرعية (فقط في وضع من مشروع)
      if (mode === "from-project" && selectedSubtasks[taskId]) {
        const subtasksToImport = getSubtasks(task);
        subtasksToImport.forEach((sub) => {
          if (selectedSubtasks[taskId]?.has(sub?.id)) {
            result.push({
              ...sub,
              project_id: targetProjectId
                ? parseInt(targetProjectId)
                : parseInt(task.project_id),
              branch_id: sub.branch_id || null,
              section_id: sub.section_id || null,
              assigned_id: sub.assigned_id || null,
              type: sub.type || "task",
              title_ar: sub.title_ar || "عنوان غير محدد",
              title_en: sub.title_en || "",
              priority: sub.priority || "medium",
              due_date: sub.due_date || null,
              amount: sub.amount ? parseFloat(sub.amount) : 0,
              needs_approval: sub.needs_approval ?? 0,
              description_ar: sub.description_ar || "",
              description_en: sub.description_en || "",
              start_date: sub.start_date || null,
              end_date: sub.end_date || null,
              task_status: "pending",
              status: "pending",
              parent_id: mainTask.id, // ✅ ربط المهمة الفرعية بالأب الجديد
              // ✅ حذف الحقول التي تسبب مشاكل
              id: undefined,
    created_at: getCurrentDateTime(),  // ✅ نفس التاريخ للمهام الفرعية
    updated_at: getCurrentDateTime(),
              project: undefined,
              assigned_user: undefined,
              subtasks: undefined,
              sub_task: undefined,
            });
          }
        });
      }
    });

    return result;
  };
// ✅ دالة مساعدة: توليد تاريخ بصيغة MySQL (YYYY-MM-DD HH:mm:ss)
const getCurrentDateTime = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
};
  const handleImport = () => {
    // ✅ 1. التحقق من المشروع الهدف
    if (!targetProjectId) {
      toast.error(t("task.selectTargetProjectFirst"));
      return;
    }

    // ✅ 2. التحقق من اختيار المهام في الوضع اليدوي
    if (importMode === "manual" && selectedTasks.size === 0) {
      toast.error(t("task.selectAtLeastOneTask"));
      return;
    }

    // ✅ 3. التحقق من الحقول القابلة للتعديل
    const allErrors = {};
    let hasErrors = false;

    selectedTasks.forEach((taskId) => {
      const task = sourceTasks.find((t) => t?.id === taskId);
      if (!task) return;

      const edits = editedValues[taskId] || {};
      const isEditable = editableFields[taskId] || {};

      // التحقق فقط إذا كانت هناك حقول قابلة للتعديل
      if (Object.keys(isEditable).length > 0) {
        const taskErrors = validateTaskFields(taskId, edits, isEditable);
        if (Object.keys(taskErrors).length > 0) {
          allErrors[taskId] = taskErrors;
          hasErrors = true;
        }
      }
    });

    if (hasErrors) {
      setFieldErrors(allErrors);
      // ✅ التمرير لأول حقل به خطأ
      const firstTaskId = Object.keys(allErrors)[0];
      const firstField = Object.keys(allErrors[firstTaskId])[0];
      if (firstTaskId && firstField) {
        const element = document.querySelector(
          `[name="task-${firstTaskId}-${firstField}"]`,
        );
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.focus?.();
        }
      }
      toast.error(t("task.validationError"));
      return;
    }
    // ✅ 3. التحقق من اكتمال البيانات قبل الاستيراد
    const tasksToValidate =
      importMode === "all"
        ? sourceTasks.filter((t) => t?.id)
        : prepareImportedTasks();

    const missingFields = [];
    tasksToValidate.forEach((task, index) => {
      if (!task.title_ar || task.title_ar.trim() === "") {
        missingFields.push(`المهمة #${index + 1}: العنوان العربي مطلوب`);
      }
      if (!task.project_id) {
        missingFields.push(`المهمة #${index + 1}: معرف المشروع مطلوب`);
      }
      if (!task.type) {
        missingFields.push(`المهمة #${index + 1}: نوع المهمة مطلوب`);
      }
    });

    if (missingFields.length > 0) {
      toast.error(
        `❌ بيانات ناقصة:\n${missingFields.slice(0, 3).join("\n")}${missingFields.length > 3 ? `\n+${missingFields.length - 3} أخطاء أخرى` : ""}`,
      );
      return;
    }
    // ✅ 4. تنفيذ الاستيراد
    if (importMode === "all") {
        const currentDateTime = getCurrentDateTime(); // ✅ تاريخ الآن
      const tasksToImport = sourceTasks
        .filter((t) => t?.id)
        .map((task) => ({
          ...task,
          task_status: "pending",
          status: "pending",
          project_id: parseInt(targetProjectId),
          parent_id:
            mode === "from-task" ? currentParentTaskId : task.parent_id,
          id: undefined,
      created_at: currentDateTime,  // ✅ تاريخ الإنشاء = الآن
      updated_at: currentDateTime,  // ✅ تاريخ التحديث = الآن
          project: undefined,
          subtasks: undefined,
          sub_task: undefined,
        }));
      onImport(tasksToImport, targetProjectId);
    } else {
      const prepared = prepareImportedTasks();
      onImport(prepared, targetProjectId);
    }

    handleClose();
  };

  const handleClose = () => {
    setSelectedProject(null);
    setSelectedTasks(new Set());
    setSelectedSubtasks({});
    setExpandedTasks({});
    setSearchQuery("");
    setImportMode("manual");
    setEditableFields({});
    setEditedValues({});
    setUserFilters({ branch_id: "", section_id: "", position_id: "" });
    setFieldErrors({}); // ✅ مسح الأخطاء
    onClose();
  };

  const isAllSelected =
    selectedTasks.size === filteredTasks.length && filteredTasks.length > 0;

  // ✅ دالة مساعدة لعرض رسالة الخطأ لحقل معين
  const getFieldError = (taskId, fieldName) => {
    return fieldErrors[taskId]?.[fieldName] || null;
  };

  // ✅ دالة مساعدة لعرض حقل إدخال مع دعم الأخطاء
  const renderEditableInput = ({
    taskId,
    fieldName,
    label,
    value,
    onChange,
    placeholder,
    type = "text",
  }) => {
    const error = getFieldError(taskId, fieldName);
    return (
      <div className="space-y-1">
        <label className="text-xs font-medium text-text-muted">{label}:</label>
        <input
          type={type}
          name={`task-${taskId}-${fieldName}`}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full text-sm border rounded-lg px-3 py-2 focus:ring-2 outline-none transition-all ${
            error
              ? "border-danger focus:ring-danger/20"
              : "border-border focus:ring-primary/20"
          }`}
          placeholder={placeholder}
        />
        {error && (
          <p className="text-xs text-danger mt-1 flex items-center gap-1">
            <span>⚠️</span>
            {error}
          </p>
        )}
      </div>
    );
  };

  // ✅ دالة مساعدة لعرض قائمة منسدلة مع دعم الأخطاء
  const renderEditableSelect = ({
    taskId,
    fieldName,
    label,
    value,
    onChange,
    options,
  }) => {
    const error = getFieldError(taskId, fieldName);
    return (
      <div className="space-y-1">
        <label className="text-xs font-medium text-text-muted">{label}:</label>
        <select
          name={`task-${taskId}-${fieldName}`}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full text-sm border rounded-lg px-3 py-2 bg-background focus:ring-2 outline-none transition-all ${
            error
              ? "border-danger focus:ring-danger/20"
              : "border-border focus:ring-primary/20"
          }`}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-xs text-danger mt-1 flex items-center gap-1">
            <span>⚠️</span>
            {error}
          </p>
        )}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("task.importFromProject")}
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleImport}
            disabled={
              !selectedProject?.id ||
              (importMode === "manual" && selectedTasks.size === 0)
            }
          >
            {t("task.importTasks")}
          </Button>
        </>
      }
    >
      <div className="space-y-5 overflow-x-hidden">
        {/* Mode Info */}
        <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-2">
          <FolderTree size={18} className="text-primary" />
          <p className="text-sm text-text">
            {mode === "from-project"
              ? t("task.importFromProjectDesc")
              : t("task.importSubtasksDesc")}
          </p>
        </div>

        {/* Target Project Selection */}
        <div className="p-4 bg-primary/5 border-2 border-primary/20 rounded-xl">
          <label className="block text-sm font-bold mb-2 text-primary">
            {t("task.targetProject")} *
            <span className="text-xs text-text-muted block font-normal">
              {t("task.selectTargetProjectDesc")}
            </span>
          </label>
          <select
            value={targetProjectId}
            onChange={(e) =>
              setTargetProjectId(e.target.value ? parseInt(e.target.value) : "")
            }
            className={`w-full border-2 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-primary outline-none ${
              !targetProjectId ? "border-danger" : "border-primary/30"
            }`}
            required
          >
            <option value="">{t("task.chooseTargetProject")}</option>
            {Array.isArray(availableProjects) &&
              availableProjects
                .filter((p) => p?.id && p.id !== selectedProject?.id)
                .map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {getLocalizedField(proj, "name", i18n.language)}
                  </option>
                ))}
          </select>
          {!targetProjectId && (
            <p className="text-xs text-danger mt-1">
              ⚠️ {t("task.targetProjectRequired")}
            </p>
          )}
        </div>

        {/* Source Project Selection */}
        <div>
          <label className="block text-sm font-medium mb-2 text-text">
            {t("task.selectSourceProject")} *
          </label>
          <select
            value={selectedProject?.id || ""}
            onChange={(e) => {
              const projId = e.target.value ? parseInt(e.target.value) : null;
              const proj = otherProjects.find((p) => p?.id === projId) || null;
              setSelectedProject(proj);
              setSelectedTasks(new Set());
              setSelectedSubtasks({});
              setExpandedTasks({});
              setSearchQuery("");
              setEditableFields({});
              setEditedValues({});
              setFieldErrors({}); // ✅ مسح الأخطاء عند تغيير المشروع
            }}
            className="w-full border border-border rounded-lg px-3 py-2 bg-background text-text focus:ring-2 focus:ring-primary outline-none"
            disabled={availableProjects?.length === 0}
          >
            <option value="">{t("task.chooseProject")}</option>
            {Array.isArray(otherProjects) &&
              otherProjects
                .filter((p) => p?.id)
                .map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {getLocalizedField(proj, "name", i18n.language)}
                  </option>
                ))}
          </select>
          {availableProjects?.length === 0 && (
            <p className="text-xs text-text-muted mt-1">
              {t("project.noProjects")}
            </p>
          )}
        </div>

        {/* Import Mode */}
        {selectedProject?.id && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text">
              {t("task.importMode")}
            </label>
            <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-surface transition">
              <input
                type="radio"
                name="mode"
                value="all"
                checked={importMode === "all"}
                onChange={(e) => setImportMode(e.target.value)}
                className="w-4 h-4"
              />
              <div>
                <p className="font-medium text-sm text-text">
                  {t("task.importAll")}
                </p>
                <p className="text-xs text-text-muted">
                  {filteredTasks.length} {t("task.tasks")}
                </p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-surface transition">
              <input
                type="radio"
                name="mode"
                value="manual"
                checked={importMode === "manual"}
                onChange={(e) => setImportMode(e.target.value)}
                className="w-4 h-4"
              />
              <div>
                <p className="font-medium text-sm text-text">
                  {t("task.selectSpecific")}
                </p>
                <p className="text-xs text-text-muted">
                  {selectedTasks.size} {t("task.selectedTasks")}
                </p>
              </div>
            </label>
          </div>
        )}

        {/* Task List - Manual Mode */}
        {importMode === "manual" && selectedProject?.id && (
          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Search
                  className="absolute start-3 top-1/2 -translate-y-1/2 text-text-muted"
                  size={16}
                />
                <input
                  type="text"
                  placeholder={t("common.search")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full ps-10 pe-4 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setSelectedTasks(
                    isAllSelected
                      ? new Set()
                      : new Set(
                          filteredTasks.map((t) => t?.id).filter(Boolean),
                        ),
                  )
                }
              >
                {isAllSelected ? t("common.clear") : t("common.selectAll")}
              </Button>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
              {filteredTasks.length === 0 ? (
                <p className="text-center py-6 text-text-muted text-sm">
                  {searchQuery ? t("task.noTasksFound") : t("task.noTasks")}
                </p>
              ) : (
                filteredTasks
                  .filter((task) => task?.id)
                  .map((task) => {
                    const taskName =
                      getLocalizedField(task, "title", i18n.language) ||
                      task.title_ar ||
                      task.title_en ||
                      "عنوان غير محدد";
                    const taskStatus = task?.task_status || task?.status;
                    const isSelected = selectedTasks.has(task.id);
                    const isExpanded = expandedTasks[task.id];
                    const hasSubtasks = getSubtasks(task).length > 0;
                    const subtasksList = getSubtasks(task);

                    return (
                      <div
                        key={task.id}
                        className={`border border-border rounded-xl p-3 transition-all ${
                          isSelected
                            ? "bg-primary/5 border-primary/30"
                            : "bg-surface hover:bg-surface/70"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleTaskToggle(task.id)}
                            className="w-4 h-4 mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            {/* Task Header */}
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <p className="font-medium text-sm text-text truncate flex-1">
                                {taskName}
                              </p>
                              <Badge
                                variant={
                                  taskStatus === "completed"
                                    ? "status-completed"
                                    : taskStatus === "in_progress"
                                      ? "status-in-progress"
                                      : taskStatus === "canceled"
                                        ? "status-canceled"
                                        : "status-pending"
                                }
                                className="text-xs flex-shrink-0"
                              >
                                {t(`status.${taskStatus}`)} →{" "}
                                {t("status.pending")}
                              </Badge>
                            </div>

                            {/* Subtasks Controls */}
                            {isSelected &&
                              hasSubtasks &&
                              mode === "from-project" && (
                                <div className="mb-3 pb-3 border-b border-border/50 flex items-center gap-2 flex-wrap">
                                  <button
                                    onClick={() => toggleExpand(task.id)}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-medium transition-all"
                                  >
                                    {isExpanded ? (
                                      <ChevronDown size={14} />
                                    ) : (
                                      <ChevronRight size={14} />
                                    )}
                                    <span>
                                      {subtasksList.length} {t("task.subtasks")}
                                    </span>
                                  </button>

                                  {/* Quick Selection Buttons */}
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-text-muted">
                                      {t("task.importOptions")}:
                                    </span>
                                    <button
                                      onClick={() =>
                                        setSelectedSubtasks((prev) => {
                                          const updated = { ...prev };
                                          delete updated[task.id];
                                          return updated;
                                        })
                                      }
                                      className="text-xs px-2 py-1 rounded bg-surface border border-border hover:bg-surface/70 text-text transition"
                                      title={t("task.withoutSubtasks")}
                                    >
                                      {t("task.taskOnly")}
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleToggleAllSubtasks(task.id)
                                      }
                                      className={`text-xs px-2 py-1 rounded transition ${
                                        (selectedSubtasks[task.id]?.size ||
                                          0) === subtasksList.length
                                          ? "bg-primary/20 border border-primary/30 text-primary"
                                          : "bg-surface border border-border hover:bg-surface/70 text-text"
                                      }`}
                                      title={t("task.withAllSubtasks")}
                                    >
                                      {(selectedSubtasks[task.id]?.size ||
                                        0) === subtasksList.length
                                        ? `✓ ${t("task.allSubtasks")}`
                                        : t("task.allSubtasks")}
                                    </button>
                                  </div>
                                </div>
                              )}

                            {/* Subtasks List */}
                            {expandedTasks[task.id] && hasSubtasks && (
                              <div className="mt-3 ps-4 border-s-2 border-primary/30 bg-surface/50 rounded-lg p-3 space-y-2">
                                <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-border/50">
                                  <p className="text-xs font-semibold text-text-muted">
                                    {t("task.subtasks")} ({subtasksList.length})
                                  </p>
                                  {isSelected && (
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() =>
                                          handleToggleAllSubtasks(task.id)
                                        }
                                        className="text-xs text-primary hover:text-primary/80 font-medium px-2 py-1 rounded bg-primary/10 hover:bg-primary/20 transition"
                                        title={t("common.selectAll")}
                                      >
                                        {(selectedSubtasks[task.id]?.size ||
                                          0) === subtasksList.length
                                          ? t("common.clearAll")
                                          : t("common.selectAll")}
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  {subtasksList.map((sub) => {
                                    const isSubSelected = selectedSubtasks[
                                      task.id
                                    ]?.has(sub?.id);
                                    return (
                                      <label
                                        key={sub?.id}
                                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                                          isSubSelected
                                            ? "bg-primary/10 border border-primary/30"
                                            : "bg-background/50 border border-transparent hover:bg-background"
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isSubSelected || false}
                                          onChange={() =>
                                            handleSubtaskToggle(
                                              task.id,
                                              sub?.id,
                                            )
                                          }
                                          className="w-3 h-3"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <span className="text-xs font-medium text-text truncate block">
                                            {getLocalizedField(
                                              sub,
                                              "title",
                                              i18n.language,
                                            )}
                                          </span>
                                          <span className="text-xs text-text-muted">
                                            #{sub?.id}
                                          </span>
                                        </div>
                                        {sub?.task_status && (
                                          <Badge
                                            variant={`status-${sub.task_status}`}
                                            className="text-xs"
                                          >
                                            {t(`status.${sub.task_status}`)}
                                          </Badge>
                                        )}
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* ✅ Editable Fields with Validation */}
                            {isSelected && mode === "from-project" && (
                              <div className="mt-4 pt-4 border-t border-border">
                                {/* Header with Quick Actions */}
                                <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-border">
                                  <div className="flex items-center gap-2">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                      <Edit2
                                        size={16}
                                        className="text-primary"
                                      />
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-bold text-text">
                                        {t("task.editBeforeImport")}
                                      </h4>
                                      <p className="text-xs text-text-muted">
                                        {t("task.editFieldsHint")}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Quick Toggle Buttons */}
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                      onClick={() => {
                                        const allFields = [
                                          "title_ar",
                                          "title_en",
                                          "description_ar",
                                          "description_en",
                                          "status",
                                          "priority",
                                          "due_date",
                                          "assigned_id",
                                          "amount",
                                          "needs_approval",
                                        ];
                                        const newEditable = {
                                          ...editableFields,
                                          [task.id]: {},
                                        };
                                        allFields.forEach((f) => {
                                          newEditable[task.id][f] = true;
                                        });
                                        setEditableFields(newEditable);
                                      }}
                                      className="text-xs text-primary hover:text-primary/80 font-medium px-2 py-1 rounded bg-primary/10 hover:bg-primary/20 transition whitespace-nowrap"
                                      title={t("task.editAllFields")}
                                    >
                                      {t("task.editAll")}
                                    </button>
                                    <button
                                      onClick={() => {
                                        const newEditable = {
                                          ...editableFields,
                                        };
                                        const newEdited = { ...editedValues };
                                        delete newEditable[task.id];
                                        delete newEdited[task.id];
                                        const newErrors = { ...fieldErrors };
                                        delete newErrors[task.id];
                                        setFieldErrors(newErrors);
                                        setEditableFields(newEditable);
                                        setEditedValues(newEdited);
                                      }}
                                      className="text-xs text-danger hover:text-danger/80 font-medium px-2 py-1 rounded bg-danger/10 hover:bg-danger/20 transition whitespace-nowrap"
                                      title={t("task.resetEdits")}
                                    >
                                      {t("task.resetAll")}
                                    </button>
                                  </div>
                                </div>

                                {/* Grid Layout */}
                                <div className="grid grid-cols-1 gap-4">
                                  {/* Titles */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {/* Title AR */}
                                    {editableFields[task.id]?.title_ar ? (
                                      renderEditableInput({
                                        taskId: task.id,
                                        fieldName: "title_ar",
                                        label: t("task.titleAr"),
                                        value:
                                          editedValues[task.id]?.title_ar ??
                                          task.title_ar,
                                        onChange: (val) =>
                                          updateEditedValue(
                                            task.id,
                                            "title_ar",
                                            val,
                                          ),
                                        placeholder: t("task.titleAr"),
                                      })
                                    ) : (
                                      <div className="space-y-1">
                                        <label className="text-xs font-medium text-text-muted">
                                          {t("task.titleAr")}:
                                        </label>
                                        <div className="text-sm text-text bg-background px-3 py-2 rounded-lg border border-border">
                                          {task.title_ar || "-"}
                                        </div>
                                      </div>
                                    )}

                                    {/* Title EN */}
                                    {editableFields[task.id]?.title_en ? (
                                      renderEditableInput({
                                        taskId: task.id,
                                        fieldName: "title_en",
                                        label: t("task.titleEn"),
                                        value:
                                          editedValues[task.id]?.title_en ??
                                          task.title_en,
                                        onChange: (val) =>
                                          updateEditedValue(
                                            task.id,
                                            "title_en",
                                            val,
                                          ),
                                        placeholder: t("task.titleEn"),
                                      })
                                    ) : (
                                      <div className="space-y-1">
                                        <label className="text-xs font-medium text-text-muted">
                                          {t("task.titleEn")}:
                                        </label>
                                        <div className="text-sm text-text bg-background px-3 py-2 rounded-lg border border-border">
                                          {task.title_en || "-"}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Descriptions */}
                                  <div className="grid grid-cols-1 gap-3">
                                    {/* Description AR */}
                                    {editableFields[task.id]?.description_ar ? (
                                      <div className="space-y-1">
                                        <label className="text-xs font-medium text-text-muted">
                                          {t("task.descriptionAr")}:
                                        </label>
                                        <div
                                          className={`border rounded-lg overflow-hidden ${getFieldError(task.id, "description_ar") ? "border-danger" : "border-border"}`}
                                        >
                                          <ReactQuill
                                            theme="snow"
                                            value={
                                              editedValues[task.id]
                                                ?.description_ar ??
                                              task.description_ar ??
                                              ""
                                            }
                                            onChange={(content) => {
                                              updateEditedValue(
                                                task.id,
                                                "description_ar",
                                                content,
                                              );
                                              if (
                                                getFieldError(
                                                  task.id,
                                                  "description_ar",
                                                )
                                              ) {
                                                setFieldErrors((prev) => ({
                                                  ...prev,
                                                  [task.id]: {
                                                    ...prev[task.id],
                                                    description_ar: null,
                                                  },
                                                }));
                                              }
                                            }}
                                            modules={editorModules}
                                            formats={editorFormats}
                                            placeholder={t(
                                              "task.descriptionPlaceholder",
                                            )}
                                            className="bg-background"
                                            style={{ height: "150px" }}
                                          />
                                        </div>
                                        {getFieldError(
                                          task.id,
                                          "description_ar",
                                        ) && (
                                          <p className="text-xs text-danger mt-1 flex items-center gap-1">
                                            <span>⚠️</span>
                                            {getFieldError(
                                              task.id,
                                              "description_ar",
                                            )}
                                          </p>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="space-y-1">
                                        <label className="text-xs font-medium text-text-muted">
                                          {t("task.descriptionAr")}:
                                        </label>
                                        <div
                                          className="text-sm text-text bg-background px-3 py-2 rounded-lg border border-border min-h-[100px]"
                                          dangerouslySetInnerHTML={{
                                            __html: task.description_en,
                                          }}
                                        />
                                      </div>
                                    )}

                                    {/* Description EN */}
                                    {editableFields[task.id]?.description_en ? (
                                      <div className="space-y-1">
                                        <label className="text-xs font-medium text-text-muted">
                                          {t("task.descriptionEn")}:
                                        </label>
                                        <div className="border border-border rounded-lg overflow-hidden">
                                          <ReactQuill
                                            theme="snow"
                                            value={
                                              editedValues[task.id]
                                                ?.description_en ??
                                              task.description_en ??
                                              ""
                                            }
                                            onChange={(content) =>
                                              updateEditedValue(
                                                task.id,
                                                "description_en",
                                                content,
                                              )
                                            }
                                            modules={editorModules}
                                            formats={editorFormats}
                                            placeholder={t(
                                              "task.descriptionPlaceholderEn",
                                            )}
                                            className="bg-background"
                                            style={{ height: "150px" }}
                                          />
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="space-y-1">
                                        <label className="text-xs font-medium text-text-muted">
                                          {t("task.descriptionEn")}:
                                        </label>
                                        <div
                                          className="text-sm text-text bg-background px-3 py-2 rounded-lg border border-border min-h-[100px]"
                                          dangerouslySetInnerHTML={{
                                            __html: task.description_en,
                                          }}
                                        />
                                      </div>
                                    )}
                                  </div>

                                  {/* Status, Priority, Due Date */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {/* Status */}
                                    {editableFields[task.id]?.status ? (
                                      renderEditableSelect({
                                        taskId: task.id,
                                        fieldName: "status",
                                        label: t("task.status"),
                                        value:
                                          editedValues[task.id]?.status ??
                                          task.task_status ??
                                          task.status ??
                                          "pending",
                                        onChange: (val) =>
                                          updateEditedValue(
                                            task.id,
                                            "status",
                                            val,
                                          ),
                                        options: [
                                          {
                                            value: "pending",
                                            label: t("status.pending"),
                                          },
                                          {
                                            value: "in_progress",
                                            label: t("status.in_progress"),
                                          },
                                          {
                                            value: "completed",
                                            label: t("status.completed"),
                                          },
                                          {
                                            value: "canceled",
                                            label: t("status.canceled"),
                                          },
                                        ],
                                      })
                                    ) : (
                                      <div className="space-y-1">
                                        <label className="text-xs font-medium text-text-muted">
                                          {t("task.status")}:
                                        </label>
                                        <Badge
                                          variant={`status_${task.task_status || task.status}`}
                                          className="text-xs"
                                        >
                                          {t(
                                            `status.${task.task_status || task.status}`,
                                          )}
                                        </Badge>
                                      </div>
                                    )}

                                    {/* Priority */}
                                    {editableFields[task.id]?.priority ? (
                                      renderEditableSelect({
                                        taskId: task.id,
                                        fieldName: "priority",
                                        label: t("task.priority"),
                                        value:
                                          editedValues[task.id]?.priority ??
                                          task.priority ??
                                          "medium",
                                        onChange: (val) =>
                                          updateEditedValue(
                                            task.id,
                                            "priority",
                                            val,
                                          ),
                                        options: [
                                          {
                                            value: "low",
                                            label: t("priority.low"),
                                          },
                                          {
                                            value: "medium",
                                            label: t("priority.medium"),
                                          },
                                          {
                                            value: "high",
                                            label: t("priority.high"),
                                          },
                                        ],
                                      })
                                    ) : (
                                      <div className="space-y-1">
                                        <label className="text-xs font-medium text-text-muted">
                                          {t("task.priority")}:
                                        </label>
                                        <Badge
                                          variant={`priority_${task.priority}`}
                                          className="text-xs"
                                        >
                                          {t(`priority.${task.priority}`)}
                                        </Badge>
                                      </div>
                                    )}

                                    {/* Due Date */}
                                    {editableFields[task.id]?.due_date ? (
                                      renderEditableInput({
                                        taskId: task.id,
                                        fieldName: "due_date",
                                        label: t("task.dueDate"),
                                        value:
                                          editedValues[task.id]?.due_date ??
                                          task.due_date ??
                                          "",
                                        onChange: (val) =>
                                          updateEditedValue(
                                            task.id,
                                            "due_date",
                                            val,
                                          ),
                                        type: "date",
                                      })
                                    ) : (
                                      <div className="space-y-1">
                                        <label className="text-xs font-medium text-text-muted">
                                          {t("task.dueDate")}:
                                        </label>
                                        <span className="text-sm text-text">
                                          {task.due_date || "-"}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Assigned To & Amount */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {/* Assigned To */}
                                    {editableFields[task.id]?.assigned_id ? (
                                      <div className="space-y-1 md:col-span-2">
                                        <label className="text-xs font-medium text-text-muted">
                                          {t("task.assignedTo")}:
                                        </label>
                                        <select
                                          name={`task-${task.id}-assigned_id`}
                                          value={
                                            editedValues[task.id]
                                              ?.assigned_id ??
                                            task.assigned_id ??
                                            ""
                                          }
                                          onChange={(e) =>
                                            updateEditedValue(
                                              task.id,
                                              "assigned_id",
                                              e.target.value
                                                ? parseInt(e.target.value)
                                                : null,
                                            )
                                          }
                                          className={`w-full text-sm border rounded-lg px-3 py-2 bg-background focus:ring-2 outline-none ${
                                            getFieldError(
                                              task.id,
                                              "assigned_id",
                                            )
                                              ? "border-danger focus:ring-danger/20"
                                              : "border-border focus:ring-primary/20"
                                          }`}
                                        >
                                          <option value="">
                                            {t("task.unassigned")}
                                          </option>
                                          {getFilteredUsers()
                                            .filter((u) => u?.id && u?.name)
                                            .map((u) => (
                                              <option key={u.id} value={u.id}>
                                                {u.name}{" "}
                                                {u.position?.ar_name &&
                                                  `- ${u.position.ar_name}`}
                                              </option>
                                            ))}
                                        </select>
                                        {getFieldError(
                                          task.id,
                                          "assigned_id",
                                        ) && (
                                          <p className="text-xs text-danger mt-1 flex items-center gap-1">
                                            <span>⚠️</span>
                                            {getFieldError(
                                              task.id,
                                              "assigned_id",
                                            )}
                                          </p>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="space-y-1 md:col-span-2">
                                        <label className="text-xs font-medium text-text-muted">
                                          {t("task.assignedTo")}:
                                        </label>
                                        <span className="text-sm text-text">
                                          {task.assigned_user?.name ||
                                            t("task.unassigned")}
                                        </span>
                                      </div>
                                    )}

                                    {/* Amount */}
                                    {editableFields[task.id]?.amount ? (
                                      renderEditableInput({
                                        taskId: task.id,
                                        fieldName: "amount",
                                        label: t("task.amount"),
                                        value:
                                          editedValues[task.id]?.amount ??
                                          task.amount,
                                        onChange: (val) =>
                                          updateEditedValue(
                                            task.id,
                                            "amount",
                                            val,
                                          ),
                                        type: "number",
                                        placeholder: "0.00",
                                      })
                                    ) : (
                                      <div className="space-y-1">
                                        <label className="text-xs font-medium text-text-muted">
                                          {t("task.amount")}:
                                        </label>
                                        <span className="text-sm text-text">
                                          {task.amount || "0"}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Needs Approval */}
                                  <div className="pt-2 border-t border-border">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={
                                          editableFields[task.id]
                                            ?.needs_approval
                                            ? (editedValues[task.id]
                                                ?.needs_approval ??
                                              task.needs_approval)
                                            : task.needs_approval
                                        }
                                        onChange={(e) =>
                                          updateEditedValue(
                                            task.id,
                                            "needs_approval",
                                            e.target.checked ? 1 : 0,
                                          )
                                        }
                                        className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
                                        disabled={
                                          !editableFields[task.id]
                                            ?.needs_approval
                                        }
                                      />
                                      <span className="text-sm font-medium text-text">
                                        {t("task.needsApproval")}
                                      </span>
                                      {editableFields[task.id]
                                        ?.needs_approval ? (
                                        <span className="text-xs text-text-muted ms-auto">
                                          {(editedValues[task.id]
                                            ?.needs_approval ??
                                          task.needs_approval)
                                            ? t("common.yes")
                                            : t("common.no")}
                                        </span>
                                      ) : (
                                        <Badge
                                          variant={
                                            task.needs_approval
                                              ? "status-completed"
                                              : "status-pending"
                                          }
                                          className="text-xs ms-auto"
                                        >
                                          {task.needs_approval
                                            ? t("common.yes")
                                            : t("common.no")}
                                        </Badge>
                                      )}
                                    </label>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}

        {/* Summary */}
        {selectedTasks.size > 0 && targetProjectId && (
          <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/20 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-primary">
                  {t("task.willImport")}: <strong>{selectedTasks.size}</strong>{" "}
                  {t("task.tasks")}
                </p>
                <p className="text-xs text-text-muted mt-1">
                  {t("task.toProject")}:{" "}
                  <strong>
                    {availableProjects.find(
                      (p) => p?.id === parseInt(targetProjectId),
                    )?.name_ar ||
                      availableProjects.find(
                        (p) => p?.id === parseInt(targetProjectId),
                      )?.name_en}
                  </strong>
                </p>
              </div>
              <div className="text-end">
                <Badge variant="status-pending" className="text-xs">
                  {t("status.pending")}
                </Badge>
                <p className="text-xs text-text-muted mt-1">
                  {t("task.autoStatus")}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
