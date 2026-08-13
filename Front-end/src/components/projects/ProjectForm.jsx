import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import {
  createProject,
  updateProject,
  fetchProjects,
} from "../../store/slices/projectSlice";
import Modal from "../shared/Modal";
import Button from "../shared/Button";
import api from "../../lib/axios";
import ReactQuill from "react-quill-new";

export default function ProjectForm({ isOpen, onClose, project = null }) {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // ✅ حالة الفورم مع إضافة project_color
  const [form, setForm] = useState({
    name_ar: "",
    name_en: "",
    start_date: "",
    expected_expired_date: "",
    project_amount: "",
    description_ar: "",
    description_en: "",
    status: "starting_soon",
    is_active: true,
    project_color: "#3b82f6", // ✅ لون افتراضي
  });

  // ✅ إعدادات المحرر
  const editorModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ],
  };

  const editorFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'align', 'link', 'blockquote', 'code-block'
  ];

  // ✅ مسح الأخطاء عند إغلاق المودال
  useEffect(() => {
    if (!isOpen) {
      setFieldErrors({});
      setLoading(false);
    }
  }, [isOpen]);

  // ✅ تعبئة الفورم عند التعديل
  useEffect(() => {
    if (project) {
      setForm({
        name_ar: project.name_ar || "",
        name_en: project.name_en || "",
        start_date: project.start_date || "",
        expected_expired_date: project.expected_expired_date || "",
        project_amount: project.project_amount || "0",
        description_ar: project.description_ar || "",
        description_en: project.description_en || "",
        status: project.status || "starting_soon",
        is_active: project.is_active === 1,
        project_color: project.project_color || "#3b82f6", // ✅ إضافة اللون
      });
      setFieldErrors({});
    } else {
      setForm({
        name_ar: "",
        name_en: "",
        start_date: "",
        expected_expired_date: "",
        project_amount: "0",
        description_ar: "",
        description_en: "",
        status: "starting_soon",
        is_active: true,
        project_color: "#3b82f6", // ✅ لون افتراضي عند الإنشاء
      });
      setFieldErrors({});
    }
  }, [project, isOpen]);

  // ✅ دالة التحقق من صحة البيانات
  const validateForm = () => {
    const errors = {};
    const lang = i18n.language;
    const requiredMsg = lang === 'ar' ? 'هذا الحقل مطلوب' : 'This field is required';
    const invalidDateMsg = lang === 'ar' ? 'تاريخ النهاية المتوقع يجب أن يكون بعد تاريخ البداية' : 'Expected end date must be after start date';
    
    const requiredFields = [
      { field: 'name_ar', label: 'project.nameAr' },
      { field: 'name_en', label: 'project.nameEn' },
    ];
    
    requiredFields.forEach(({ field, label }) => {
      const val = form[field];
      if (!val || val.trim() === "") {
        errors[field] = `${t(label)} ${requiredMsg.toLowerCase()}`;
      }
    });
    
    if (form.start_date && form.expected_expired_date && 
        new Date(form.expected_expired_date) < new Date(form.start_date)) {
      errors.expected_expired_date = invalidDateMsg;
    }
    
    if (form.project_amount && (isNaN(parseFloat(form.project_amount)) || parseFloat(form.project_amount) < 0)) {
      errors.project_amount = lang === 'ar' ? 'المبلغ يجب أن يكون رقماً موجباً' : 'Amount must be a positive number';
    }
    
    return errors;
  };

  // ✅ دالة الإرسال
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("name_ar", form.name_ar || "");
      formData.append("name_en", form.name_en || "");
      formData.append("start_date", form.start_date);
      formData.append("expected_expired_date", form.expected_expired_date);
      formData.append("project_amount", form.project_amount || "0");
      formData.append("description_ar", form.description_ar || "");
      formData.append("description_en", form.description_en || "");
      formData.append("status", form.status);
      formData.append("is_active", form.is_active ? 1 : 0);
      formData.append("project_color", form.project_color || "#3b82f6"); // ✅ إضافة اللون

      if (project?.id) {
        formData.append("_method", "PUT");
        await api.post(`/projects/update/${project.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/projects/store", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      dispatch(fetchProjects());
      onClose();
    } catch (err) {
      console.error('❌ Submit error:', err);
      
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const backendErrors = err.response.data.errors;
        const newErrors = {};
        
        const keyMap = {
          'name_ar': 'name_ar',
          'name_en': 'name_en',
          'start_date': 'start_date',
          'expected_expired_date': 'expected_expired_date',
          'project_amount': 'project_amount',
          'description_ar': 'description_ar',
          'description_en': 'description_en',
          'status': 'status',
        };
        
        Object.keys(backendErrors).forEach(backendKey => {
          const formKey = keyMap[backendKey] || backendKey;
          const message = Array.isArray(backendErrors[backendKey]) 
            ? backendErrors[backendKey][0] 
            : String(backendErrors[backendKey]);
          newErrors[formKey] = message;
        });
        
        setFieldErrors(newErrors);
        
        const firstField = Object.keys(newErrors)[0];
        if (firstField) {
          const element = document.querySelector(`[name="${firstField}"]`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.focus?.();
          }
        }
      } else {
        const errorMsg = err.response?.data?.message;
        let errorText = t("project.saveError");
        
        if (typeof errorMsg === 'string') {
          errorText = errorMsg;
        } else if (typeof errorMsg === 'object' && errorMsg !== null) {
          const firstKey = Object.keys(errorMsg)[0];
          const firstValue = errorMsg[firstKey];
          errorText = Array.isArray(firstValue) ? firstValue[0] : String(firstValue);
        }
        
        setError(errorText);
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
          if (fieldErrors[name]) {
            setFieldErrors({ ...fieldErrors, [name]: null });
          }
        }}
        className={`w-full border rounded-lg px-3 py-2 bg-background focus:ring-2 outline-none transition-all ${
          fieldErrors[name] ? 'border-danger focus:ring-danger/20' : 'border-border focus:ring-primary/20'
        }`}
        {...props}
      />
      {fieldErrors[name] && (
        <p className="text-xs text-danger mt-1 flex items-center gap-1">
          <span>⚠️</span>
          {fieldErrors[name]}
        </p>
      )}
    </div>
  );

  const renderSelect = ({ name, label, options, required = false, ...props }) => (
    <div>
      <label className="block text-sm font-medium mb-1">
        {t(label)} {required && <span className="text-danger">*</span>}
      </label>
      <select
        name={name}
        value={form[name] || ""}
        onChange={(e) => {
          setForm({ ...form, [name]: e.target.value });
          if (fieldErrors[name]) {
            setFieldErrors({ ...fieldErrors, [name]: null });
          }
        }}
        className={`w-full border rounded-lg px-3 py-2 bg-background focus:ring-2 outline-none transition-all ${
          fieldErrors[name] ? 'border-danger focus:ring-danger/20' : 'border-border focus:ring-primary/20'
        }`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {fieldErrors[name] && (
        <p className="text-xs text-danger mt-1 flex items-center gap-1">
          <span>⚠️</span>
          {fieldErrors[name]}
        </p>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={project ? t("common.edit") : t("common.add")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {t("common.save")}
          </Button>
        </>
      }
    >
      {error && (
        <div className="bg-danger/10 border border-danger text-danger px-4 py-3 rounded-lg mb-4 text-sm flex items-start gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* الاسم بالعربي */}
        {renderInput({
          name: "name_ar",
          label: "project.nameAr",
          required: true,
          placeholder: t("project.nameArPlaceholder")
        })}

        {/* الاسم بالإنجليزي */}
        {renderInput({
          name: "name_en",
          label: "project.nameEn",
          required: true,
          placeholder: t("project.nameEnPlaceholder")
        })}

        {/* التواريخ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderInput({
            name: "start_date",
            label: "project.startDate",
            type: "date"
          })}
          {renderInput({
            name: "expected_expired_date",
            label: "project.expectedEndDate",
            type: "date"
          })}
        </div>

        {/* المبلغ */}
        {renderInput({
          name: "project_amount",
          label: "project.amount",
          type: "number",
          step: "0.01",
          placeholder: "0.00"
        })}

        {/* ✅ لون المشروع */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("project.color")}
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              name="project_color"
              value={form.project_color || "#3b82f6"}
              onChange={(e) => {
                setForm({ ...form, project_color: e.target.value });
                if (fieldErrors.project_color) {
                  setFieldErrors({ ...fieldErrors, project_color: null });
                }
              }}
              className="w-12 h-10 border border-border rounded-lg cursor-pointer bg-background"
              title={t("project.selectColor")}
            />
            <span className="text-sm text-text-muted font-mono">
              {form.project_color || "#3b82f6"}
            </span>
          </div>
          {fieldErrors.project_color && (
            <p className="text-xs text-danger mt-1 flex items-center gap-1">
              <span>⚠️</span>
              {fieldErrors.project_color}
            </p>
          )}
        </div>

        {/* الوصف بالعربي */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("project.descriptionAr")}
          </label>
          <div className={`react-quill-wrapper rounded-lg border overflow-hidden focus-within:ring-2 transition-all ${
            fieldErrors.description_ar ? 'border-danger focus-within:ring-danger/20' : 'border-border focus-within:ring-primary/20'
          }`}>
            <ReactQuill
              theme="snow"
              value={form.description_ar || ""}
              onChange={(content) => {
                setForm({ ...form, description_ar: content });
                if (fieldErrors.description_ar) {
                  setFieldErrors({ ...fieldErrors, description_ar: null });
                }
              }}
              modules={editorModules}
              formats={editorFormats}
              placeholder={t("project.descriptionArPlaceholder")}
              className="h-full"
              style={{ height: '150px' }}
            />
          </div>
          {fieldErrors.description_ar && (
            <p className="text-xs text-danger mt-1 flex items-center gap-1">
              <span>⚠️</span>
              {fieldErrors.description_ar}
            </p>
          )}
        </div>

        {/* الوصف بالإنجليزي */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("project.descriptionEn")}
          </label>
          <div className="react-quill-wrapper rounded-lg border border-border overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
            <ReactQuill
              theme="snow"
              value={form.description_en || ""}
              onChange={(content) => {
                setForm({ ...form, description_en: content });
                if (fieldErrors.description_en) {
                  setFieldErrors({ ...fieldErrors, description_en: null });
                }
              }}
              modules={editorModules}
              formats={editorFormats}
              placeholder={t("project.descriptionEnPlaceholder")}
              className="h-full"
              style={{ height: '150px' }}
            />
          </div>
          {fieldErrors.description_en && (
            <p className="text-xs text-danger mt-1 flex items-center gap-1">
              <span>⚠️</span>
              {fieldErrors.description_en}
            </p>
          )}
        </div>

        {/* الحالة */}
        {renderSelect({
          name: "status",
          label: "project.status",
          options: [
            { value: "starting_soon", label: t("status.starting_soon") },
            { value: "in_progress", label: t("status.in_progress") },
            { value: "completed", label: t("status.completed") },
            { value: "canceled", label: t("status.canceled") }
          ]
        })}
      </form>
    </Modal>
  );
}