// src/components/tasks/TaskForm.jsx
import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { fetchProjects } from "../../store/slices/projectSlice";
import Modal from "../shared/Modal";
import Button from "../shared/Button";
import FileUploader from "../shared/FileUploader";
import { getLocalizedField } from "../../utils/helpers";
import { fetchAllUsers } from "../../store/slices/userSlice";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { fetchSettingsByCode } from "../../store/slices/settingsSlice";
import { useAdmin } from "../../hooks/useAdmin";
import { fetchTaskTypes } from "../../store/slices/taskSlice";

export default function TaskForm({
  isOpen,
  onClose,
  task = null,
  onSubmit,
  parentTaskId = null,
  defaultProjectId = null,
  defaultBranchId = null,
  defaultSectionId = null,
  defaultPriority = null,
  defaultStatus = null,
}) {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showNewTypeInput, setShowNewTypeInput] = useState(false);

  // ✅ نظام الأخطاء
  const [fieldErrors, setFieldErrors] = useState({});

  // ✅ Redux Data
  const { projects: projectsList, loading: projectsLoading } = useSelector(
    (state) => state.project,
  );
  const { branches, sections, positions, loading: settingsLoading } = useSelector(
    (state) => state.settings,
  );
  const { allUsers: usersData, loading: usersLoading } = useAdmin();
  const currentUser = useSelector((state) => state.auth?.user) || null;

  // ✅ أنواع المهام من Redux مع قيم افتراضية آمنة
  const tasksState = useSelector((state) => state.tasks) || {};
  const taskTypes = tasksState.taskTypes || [];
  const taskTypesLoading = tasksState.taskTypesLoading || false;
  const taskTypesError = tasksState.taskTypesError || null;

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
    "header", "bold", "italic", "underline", "strike",
    "list", "align", "link", "blockquote", "code-block",
  ];

  const [userFilters, setUserFilters] = useState({
    branch_id: "",
    section_id: "",
    position_id: "",
  });
  const allUsers = useMemo(() => usersData || [], [usersData]);

  // ✅ خيارات الفروع/الأقسام/المناصب
  const branchOptions = useMemo(() =>
    branches
      .map((b) => ({
        id: b.id,
       name: i18n.language === 'ar' 
        ? (b.ar_name || b.en_name || `Branch ${b.id}`)
        : (b.en_name || b.ar_name || `Branch ${b.id}`),
    })) 
      .filter((opt) => opt.id),
    [branches, i18n.language],
  );

  const sectionOptions = useMemo(() =>
    sections
      .map((s) => ({
        id: s.id,
      name: i18n.language === 'ar' 
        ? (s.ar_name || s.en_name || `Section ${s.id}`)
        : (s.en_name || s.ar_name || `Section ${s.id}`),
    }))
      .filter((opt) => opt.id),
    [sections, i18n.language],
  );

  const positionsOptions = useMemo(() =>
    positions
      .map((s) => ({
        id: s.id,
      name: i18n.language === 'ar' 
        ? (s.ar_name || s.en_name || `Position ${s.id}`)
        : (s.en_name || s.ar_name || `Position ${s.id}`),
   }))
      .filter((opt) => opt.id),
    [positions, i18n.language],
  );

  // ✅ فلترة المستخدمين
  const getFilteredUsers = useMemo(() => {
    return () => {
      let users = allUsers;
      if (userFilters.branch_id)
        users = users.filter((u) => String(u.branch_id) === String(userFilters.branch_id));
      if (userFilters.section_id)
        users = users.filter((u) => String(u.section_id) === String(userFilters.section_id));
      if (userFilters.position_id)
        users = users.filter((u) => String(u.position_id) === String(userFilters.position_id));
      return users;
    };
  }, [allUsers, userFilters]);

  // ✅ جلب أنواع المهام عند فتح المودال (مرة واحدة فقط)
  useEffect(() => {
    if (isOpen && taskTypes.length === 0 && !taskTypesLoading) {
      dispatch(fetchTaskTypes());
    }
  }, [isOpen,  taskTypes.length]);

  // ✅ حالة الفورم
  const [form, setForm] = useState({
    project_id: defaultProjectId || task?.project_id || task?.project?.id || "",
    branch_id: task?.branch_id || task?.branch?.id || currentUser?.branch_id || "",
    section_id: task?.section_id || task?.section?.id || currentUser?.section_id || "",
    assigned_id: task?.assigned_id || task?.assigned_user?.id || "",
    approved_by_id: task?.approved_by_id || task?.approved_by?.id || "",
    type: task?.type || "task",
    title_ar: task?.title_ar || "",
    title_en: task?.title_en || "",
    description_ar: task?.description_ar || task?.description || "",
    description_en: task?.description_en || task?.description || "",
    priority: task?.priority || "medium",
    task_status: task?.task_status || task?.status || "pending",
    due_date: task?.due_date || "",
    start_date: task?.start_date || "",
    end_date: task?.end_date || "",
    needs_approval: task?.needs_approval || 0,
    rate: task?.rate || "",
    amount: task?.amount || "0",
    parent_id: task?.parent_id || parentTaskId || "",
    task_id: task?.id || "",
    new_files: [],
    library_files:
      task?.library_files?.map((f) => (typeof f === "object" ? f.id : f)) ||
      task?.files?.map((f) => ({ id: f.id, name: f.name, file_path: f.file_path })) ||
      [],
  });

  // ✅ تعبئة الفورم عند التعديل أو الإنشاء
  useEffect(() => {
    if (isOpen && task) {
      setForm({
        project_id: task.project_id || task.project?.id || defaultProjectId || "",
        branch_id: task.branch_id || task.branch?.id || currentUser?.branch_id || "",
        section_id: task.section_id || task.section?.id || currentUser?.section_id || "",
        assigned_id: task.assigned_id || task.assigned_user?.id || "",
        approved_by_id: task.approved_by_id || task.approved_by?.id || "",
        type: task.type || "task",
        title_ar: task.title_ar || "",
        title_en: task.title_en || "",
        description_ar: task.description_ar || task.description || "",
        description_en: task.description_en || task.description || "",
        priority: task.priority || "medium",
        task_status: task.task_status || task.status || "pending",
        due_date: task.due_date || "",
        start_date: task.start_date || "",
        end_date: task.end_date || "",
        needs_approval: task.needs_approval || 0,
        rate: task.rate || "",
        amount: task.amount || "0",
        parent_id: task.parent_id || task.parent?.id || parentTaskId || "",
        task_id: task.id || "",
        new_files: [],
        library_files:
          task.library_files?.map((f) => (typeof f === "object" ? f.id : f)) ||
          task.files?.map((f) => ({ id: f.id, name: f.name, file_path: f.file_path })) ||
          [],
      });
      setFieldErrors({});
    } else if (isOpen && !task) {
      setForm((prev) => ({
        ...prev,
        project_id: defaultProjectId || "",
        branch_id: defaultBranchId || currentUser?.branch_id || "",
        section_id: defaultSectionId || currentUser?.section_id || "",
        assigned_id: "",
        approved_by_id: "",
        type: "task",
        title_ar: "",
        title_en: "",
        description_ar: "",
        description_en: "",
        priority: defaultPriority || "medium",
        task_status: defaultStatus || "pending",
        due_date: "",
        start_date: "",
        end_date: "",
        needs_approval: 0,
        rate: "",
        amount: "0",
        parent_id: parentTaskId || "",
        task_id: "",
        new_files: [],
        library_files: [],
      }));
      setFieldErrors({});
    }
  }, [task, isOpen, currentUser, parentTaskId, defaultProjectId, defaultBranchId, defaultSectionId, defaultPriority, defaultStatus]);

  // ✅ جلب البيانات الأخرى عند فتح المودال
  useEffect(() => {
    if (isOpen) {
      if (!localStorage.getItem("token")) {
        setError("يجب تسجيل الدخول أولاً");
        return;
      }
      dispatch(fetchProjects());
      dispatch(fetchAllUsers());
      dispatch(fetchSettingsByCode("branch"));
      dispatch(fetchSettingsByCode("section"));
      dispatch(fetchSettingsByCode("position"));
      if (defaultProjectId && !task) {
        setForm((prev) => ({ ...prev, project_id: defaultProjectId }));
      }
    }
  }, [isOpen, dispatch, defaultProjectId, task]);

  // ✅ تنظيف الأخطاء عند الإغلاق
  useEffect(() => {
    if (!isOpen) {
      setFieldErrors({});
      setLoading(false);
      setShowNewTypeInput(false);
    }
  }, [isOpen]);

  // ✅ التحقق من صحة البيانات
  const validateForm = () => {
    const errors = {};
    const lang = i18n.language;
    const requiredMsg = lang === "ar" ? "هذا الحقل مطلوب" : "This field is required";
    const invalidDateMsg = lang === "ar" ? "تاريخ النهاية يجب أن يكون بعد تاريخ البداية" : "End date must be after start date";

    const requiredFields = [
      { field: "project_id", label: "task.project" },
      { field: "branch_id", label: "task.branch" },
      { field: "section_id", label: "task.section" },
      { field: "title_ar", label: "task.titleAr" },
      { field: "priority", label: "task.priority" },
      { field: "type", label: "task.type" },
      { field: "assigned_id", label: "task.assignedTo" },
      { field: "due_date", label: "task.dueDate" },
      { field: "amount", label: "task.amount" },
    ];

    requiredFields.forEach(({ field, label }) => {
      const val = form[field];
      if (!val || val === "" || (Array.isArray(val) && val.length === 0)) {
        errors[field] = `${t(label)} ${requiredMsg.toLowerCase()}`;
      }
    });

    if (form.start_date && form.end_date && new Date(form.end_date) < new Date(form.start_date)) {
      errors.end_date = invalidDateMsg;
    }
    return errors;
  };

  // ✅ إرسال الفورم
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    const localErrors = validateForm();
    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      const firstField = Object.keys(localErrors)[0];
      document.querySelector(`[name="${firstField}"]`)?.focus();
      return;
    }

    const libraryFileIds = Array.isArray(form.library_files)
      ? form.library_files.map((f) => (typeof f === "object" ? f.id : f)).filter((id) => id)
      : [];

    const formData = {
      ...form,
      project_id: form.project_id ? Number(form.project_id) : null,
      branch_id: form.branch_id ? Number(form.branch_id) : null,
      section_id: form.section_id || currentUser?.section_id || null,
      assigned_id: form.assigned_id ? Number(form.assigned_id) : null,
      approved_by_id: form.needs_approval === 1 && form.approved_by_id ? Number(form.approved_by_id) : null,
      parent_id: form.parent_id ? Number(form.parent_id) : null,
      needs_approval: form.needs_approval ? 1 : 0,
      rate: form.rate ? parseFloat(form.rate) : null,
      amount: form.amount !== "" && form.amount !== null ? parseFloat(parseFloat(form.amount).toFixed(2)) : null,
      title_en: form.title_en?.trim() || null,
      description_en: form.description_en?.trim() || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      library_files: libraryFileIds,
      new_files: form.new_files?.length > 0 ? form.new_files : undefined,
    };

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      console.error("❌ Submit error:", err);
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const backendErrors = err.response.data.errors;
        const newErrors = {};
        const keyMap = {
          assigned_id: "assigned_id", title_ar: "title_ar", title_en: "title_en",
          due_date: "due_date", project_id: "project_id", branch_id: "branch_id",
          section_id: "section_id", amount: "amount", parent_id: "parent_id", type: "type",
        };
        Object.keys(backendErrors).forEach((backendKey) => {
          const formKey = keyMap[backendKey] || backendKey;
          const message = backendErrors[backendKey][0];
          newErrors[formKey] = message;
        });
        setFieldErrors(newErrors);
        const firstField = Object.keys(newErrors)[0];
        document.querySelector(`[name="${firstField}"]`)?.focus();
      } else {
        setFieldErrors({ general: err.message || t("task.saveError") });
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ دوال العرض المساعدة
  const renderInput = ({ name, label, type = "text", required = false, ...props }) => (
    <div>
      <label className="block text-sm font-medium mb-1">
        {t(label)} {required && <span className="text-danger">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={form[name] || ""}
        onChange={(e) => {
          setForm({ ...form, [name]: e.target.value });
          if (fieldErrors[name]) setFieldErrors({ ...fieldErrors, [name]: null });
        }}
        className={`w-full border rounded-lg px-3 py-2 bg-background focus:ring-2 outline-none transition-all ${
          fieldErrors[name] ? "border-danger focus:ring-danger/20" : "border-border focus:ring-primary/20"
        }`}
        {...props}
      />
      {fieldErrors[name] && (
        <p className="text-xs text-danger mt-1 flex items-center gap-1">
          <span>⚠️</span> {fieldErrors[name]}
        </p>
      )}
    </div>
  );

  const renderSelect = ({ name, label, options, required = false, disabled = false, placeholderKey, ...props }) => (
    <div>
      <label className="block text-sm font-medium mb-1">
        {t(label)} {required && <span className="text-danger">*</span>}
      </label>
      <select
        name={name}
        value={form[name] || ""}
        onChange={(e) => {
          setForm({ ...form, [name]: e.target.value });
          if (fieldErrors[name]) setFieldErrors({ ...fieldErrors, [name]: null });
        }}
        disabled={disabled}
        className={`w-full border rounded-lg px-3 py-2 bg-background focus:ring-2 outline-none transition-all ${
          fieldErrors[name] ? "border-danger focus:ring-danger/20" : "border-border focus:ring-primary/20"
        } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        {...props}
      >
        <option value="">
          {t(placeholderKey || `task.select${label.replace("task.", "").replace("Ar", "").replace("En", "")}`)}
        </option>
        {options?.map((opt) => (
          <option key={opt.id} value={opt.id}>{opt.name}</option>
        ))}
      </select>
      {fieldErrors[name] && (
        <p className="text-xs text-danger mt-1 flex items-center gap-1">
          <span>⚠️</span> {fieldErrors[name]}
        </p>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task ? t("common.edit") : t("common.add")}
      size="lg"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose} disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" onClick={handleSubmit} loading={loading}>
            {t("common.save")}
          </Button>
        </>
      }
    >
      {fieldErrors.general && (
        <div className="bg-danger/10 border border-danger text-danger px-4 py-3 rounded-lg mb-4 text-sm flex items-start gap-2">
          <span>⚠️</span> <span>{fieldErrors.general}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
        <input type="hidden" name="task_id" value={form.task_id} />
        <input type="hidden" name="parent_id" value={form.parent_id} />

        {/* Project Selection */}
        {renderSelect({
          name: "project_id",
          label: "task.project",
          options: projectsList?.map((p) => ({ id: p.id, name: getLocalizedField(p, "name", i18n.language) })) || [],
          required: true,
          disabled: projectsLoading,
          placeholderKey: "task.selectProject",
        })}

        {/* Organizational Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderSelect({ name: "branch_id", label: "task.branch", options: branchOptions, required: true, disabled: settingsLoading, placeholderKey: "task.selectBranch" })}
          {renderSelect({ name: "section_id", label: "task.section", options: sectionOptions, required: true, disabled: settingsLoading, placeholderKey: "task.selectSection" })}
        </div>

        {/* Assigned To */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("task.assignedTo")} <span className="text-danger">*</span>
          </label>
          {!usersLoading && allUsers.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3 p-3 bg-background rounded-lg border border-border">
              <select value={userFilters.branch_id} onChange={(e) => setUserFilters({ ...userFilters, branch_id: e.target.value })} className="text-xs border border-border rounded px-2 py-1.5" disabled={settingsLoading}>
                <option value="">{t("task.allBranches")}</option>
                {branchOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <select value={userFilters.section_id} onChange={(e) => setUserFilters({ ...userFilters, section_id: e.target.value })} className="text-xs border border-border rounded px-2 py-1.5" disabled={settingsLoading}>
                <option value="">{t("task.allSections")}</option>
                {sectionOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <select value={userFilters.position_id} onChange={(e) => setUserFilters({ ...userFilters, position_id: e.target.value })} className="text-xs border border-border rounded px-2 py-1.5" disabled={settingsLoading}>
                <option value="">{t("task.allPositions")}</option>
                {positionsOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </div>
          )}
          <select
            name="assigned_id"
            value={form.assigned_id || ""}
            onChange={(e) => {
              setForm({ ...form, assigned_id: e.target.value });
              if (fieldErrors.assigned_id) setFieldErrors({ ...fieldErrors, assigned_id: null });
            }}
            className={`w-full border rounded-lg px-3 py-2 bg-background focus:ring-2 outline-none transition-all ${fieldErrors.assigned_id ? "border-danger focus:ring-danger/20" : "border-border focus:ring-primary/20"}`}
            required
            disabled={usersLoading}
          >
            <option value="">
              {usersLoading ? t("common.loading") : allUsers.length === 0 ? t("task.noUsersFound") : t("task.selectUser")}
            </option>
            {getFilteredUsers().map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} - {getLocalizedField(user.position, "name", i18n.language)}
              </option>
            ))}
          </select>
          {fieldErrors.assigned_id && (
            <p className="text-xs text-danger mt-1 flex items-center gap-1">
              <span>⚠️</span> {fieldErrors.assigned_id}
            </p>
          )}
          {(userFilters.branch_id || userFilters.section_id || userFilters.position_id) && (
            <button type="button" onClick={() => setUserFilters({ branch_id: "", section_id: "", position_id: "" })} className="text-xs text-primary mt-2 hover:underline">
              {t("task.clearFilters")}
            </button>
          )}
        </div>

        {/* ✅ Task Type - مع حماية من القيم غير المُعرّفة */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("task.type")} <span className="text-danger">*</span>
          </label>
          {console.log('taskTypes',taskTypes)}
          {!showNewTypeInput ? (
            <>
              <select
                name="type"
                value={form.type || ""}
                onChange={(e) => {
                  if (e.target.value === "__new__") {
                    setShowNewTypeInput(true);
                    setForm({ ...form, type: "" });
                  } else {
                    setForm({ ...form, type: e.target.value });
                    if (fieldErrors.type) setFieldErrors({ ...fieldErrors, type: null });
                  }
                }}
                disabled={taskTypesLoading}
                className={`w-full border rounded-lg px-3 py-2 bg-background focus:ring-2 outline-none transition-all ${
                  fieldErrors.type ? "border-danger focus:ring-danger/20" : "border-border focus:ring-primary/20"
                } ${taskTypesLoading ? "opacity-60 cursor-not-allowed" : ""}`}
                required
              >
                <option value="">
                  {taskTypesLoading ? t("common.loading") : t("task.selectType")}
                </option>
                {/* ✅ استخدام (taskTypes || []) لمنع خطأ .map */}
                {(taskTypes || []).map((type, index) => (
                  <option key={type.value + "-" + index} value={type.value}>
                    {type.value}
                  </option>
                ))}
                <option value="__new__">+ {t("task.addNewType")}</option>
              </select>
            </>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                name="new_type_name"
                value={form.type || ""}
                onChange={(e) => {
                  setForm({ ...form, type: e.target.value });
                  if (fieldErrors.type) setFieldErrors({ ...fieldErrors, type: null });
                }}
                placeholder={t("task.enterNewType")}
                className={`flex-1 border rounded-lg px-3 py-2 bg-background focus:ring-2 outline-none transition-all ${
                  fieldErrors.type ? "border-danger focus:ring-danger/20" : "border-border focus:ring-primary/20"
                }`}
                autoFocus
                required
              />
              <button type="button" onClick={() => { setShowNewTypeInput(false); setForm({ ...form, type: "task" }); }} className="px-3 py-2 text-sm text-text-muted hover:text-text transition-colors" title={t("common.cancel")}>
                <span className="sr-only">{t("common.cancel")}</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          {fieldErrors.type && (
            <p className="text-xs text-danger mt-1 flex items-center gap-1">
              <span>⚠️</span> {fieldErrors.type}
            </p>
          )}
        </div>

        {/* Titles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderInput({ name: "title_ar", label: "task.titleAr", required: true, placeholder: t("task.titleArPlaceholder") })}
          {renderInput({ name: "title_en", label: "task.titleEn", placeholder: t("task.titleEnPlaceholder") })}
        </div>

        {/* Descriptions */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("task.descriptionAr")} <span className="text-danger">*</span>
            </label>
            <div className={`react-quill-wrapper rounded-lg border overflow-hidden focus-within:ring-2 focus-within:border-primary transition-all ${fieldErrors.description_ar ? "border-danger focus-within:ring-danger/20" : "border-border focus-within:ring-primary/20"}`}>
              <ReactQuill theme="snow" value={form.description_ar || ""} onChange={(content) => { setForm({ ...form, description_ar: content }); if (fieldErrors.description_ar) setFieldErrors({ ...fieldErrors, description_ar: null }); }} modules={editorModules} formats={editorFormats} placeholder={t("task.descriptionPlaceholderAr")} className="h-full" style={{ height: "150px" }} />
            </div>
            {fieldErrors.description_ar && (
              <p className="text-xs text-danger mt-1 flex items-center gap-1">
                <span>⚠️</span> {fieldErrors.description_ar}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("task.descriptionEn")}</label>
            <div className="react-quill-wrapper rounded-lg border border-border overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
              <ReactQuill theme="snow" value={form.description_en || ""} onChange={(content) => setForm({ ...form, description_en: content })} modules={editorModules} formats={editorFormats} placeholder={t("task.descriptionPlaceholderEn")} className="h-full" style={{ height: "150px" }} />
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {renderInput({ name: "start_date", label: "task.startDate", type: "date" })}
          {renderInput({ name: "due_date", label: "task.dueDate", type: "date", required: true })}
          {renderInput({ name: "end_date", label: "task.endDate", type: "date" })}
        </div>

        {/* Priority & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderSelect({ name: "priority", label: "task.priority", options: [{ id: "low", name: t("priority.low") }, { id: "medium", name: t("priority.medium") }, { id: "high", name: t("priority.high") }], required: true })}
          {renderSelect({ name: "task_status", label: "task.status", options: [{ id: "pending", name: t("status.pending") }, { id: "in_progress", name: t("status.in_progress") }, { id: "completed", name: t("status.completed") }, { id: "canceled", name: t("status.canceled") }], required: true })}
        </div>

        {/* Approval Settings */}
        <div className="p-4 bg-background rounded-lg border border-border">
          <h4 className="text-sm font-bold text-text mb-3">{t("task.approvalSettings")}</h4>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" id="needs_approval" checked={form.needs_approval === 1} onChange={(e) => setForm({ ...form, needs_approval: e.target.checked ? 1 : 0 })} className="w-4 h-4 text-primary border-border rounded focus:ring-primary" />
            <span className="text-sm font-medium">{t("task.needsApproval")}</span>
          </label>
          <p className="text-xs text-text-muted mt-2">{t("task.approvalAutoHandled")}</p>
        </div>

        {form.needs_approval === 1 && renderSelect({ name: "approved_by_id", label: "task.approvedBy", options: getFilteredUsers().map((u) => ({ id: u.id, name: `${u.name} - ${getLocalizedField(u.position, "name", i18n.language)}` })) })}

        {/* Amount */}
        {renderInput({ name: "amount", label: "task.amount", type: "number", step: "0.01", required: true, placeholder: "0.00" })}

        {/* Files */}
        <div>
          <label className="block text-sm font-medium mb-2">{t("task.attachFiles")}</label>
          <FileUploader onChange={(files) => { setForm({ ...form, new_files: files }); if (fieldErrors.new_files) setFieldErrors({ ...fieldErrors, new_files: null }); }} existingFiles={form.library_files} maxFiles={5} maxSizeMB={5} />
          {fieldErrors.new_files && (
            <p className="text-xs text-danger mt-1 flex items-center gap-1">
              <span>⚠️</span> {fieldErrors.new_files}
            </p>
          )}
        </div>
      </form>
    </Modal>
  );
}