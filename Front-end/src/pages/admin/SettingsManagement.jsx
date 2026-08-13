// src/components/admin/SettingsManagement.jsx
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { 
  fetchSettingsByCode, 
  addSetting, 
  updateSetting,
  clearSettingsSuccess,
  clearSettingsError,
   deleteSetting,
} from "../../store/slices/settingsSlice";
import { 
  Plus, 
  Edit2, 
  Save, 
  X, 
  Building2, 
  Briefcase,
  Users,
  Trash2
} from "lucide-react";
import toast from "react-hot-toast";

// ✅ قائمة أنواع الإعدادات
const SETTING_TYPES = {
  POSITION: 'position',
  BRANCH: 'branch',
  SECTION: 'section'
};

// ✅ قائمة المناصب المحددة
const POSITION_TYPES = [
  { value: "general_manager", ar: "مدير عام", en: "General Manager" },
  { value: "system_administrator", ar: "مدير النظام", en: "System Administrator" },
  { value: "general_manager_assistant", ar: "مساعد مدير عام", en: "General Manager Assistant" },
  { value: "branch_manager", ar: "مدير فرع", en: "Branch Manager" },
  { value: "section_manager", ar: "مدير قسم", en: "Section Manager" },
  { value: "employee", ar: "موظف", en: "Employee" },
];

// ✅ تسميات أنواع الإعدادات
const SETTING_LABELS = {
  [SETTING_TYPES.POSITION]: { ar: 'المناصب', en: 'Positions', icon: Briefcase },
  [SETTING_TYPES.BRANCH]: { ar: 'الفروع', en: 'Branches', icon: Building2 },
  [SETTING_TYPES.SECTION]: { ar: 'الأقسام', en: 'Sections', icon: Users },
};

export default function SettingsManagement() {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  
  const { positions, branches, sections, loading, error, success } = useSelector((state) => state.settings);
  
  // ✅ نوع الإعداد النشط (منصب/فرع/قسم)
  const [activeSettingType, setActiveSettingType] = useState(SETTING_TYPES.POSITION);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    position_type: "",
    ar_name: "",
    en_name: "",
    value: ""
  });

  // ✅ جلب البيانات حسب النوع النشط
  useEffect(() => {
    dispatch(fetchSettingsByCode(activeSettingType));
  }, [dispatch, activeSettingType]);

  // ✅ عرض رسائل النجاح/الخطأ
  useEffect(() => {
    if (success) {
      toast.success(success);
      dispatch(clearSettingsSuccess());
    }
    if (error) {
      toast.error(error);
      dispatch(clearSettingsError());
    }
  }, [success, error, dispatch]);

  // ✅ الحصول على البيانات الحالية حسب النوع
  const getCurrentData = () => {
    switch(activeSettingType) {
      case SETTING_TYPES.POSITION: return positions;
      case SETTING_TYPES.BRANCH: return branches;
      case SETTING_TYPES.SECTION: return sections;
      default: return [];
    }
  };

  // ✅ فتح النموذج للإضافة
  const handleAddNew = () => {
    setEditingItem(null);
    setFormData({
      position_type: "",
      ar_name: "",
      en_name: "",
      value: ""
    });
    setIsFormOpen(true);
  };

  // ✅ فتح النموذج للتعديل
  const handleEdit = (item) => {
    setEditingItem(item);
    
    // البحث عن نوع المنصب من القائمة (فقط للمناصب)
    let positionType = null;
    if (activeSettingType === SETTING_TYPES.POSITION) {
      positionType = POSITION_TYPES.find(
        p => p.ar === item.ar_name || p.en === item.en_name
      );
    }
    
    setFormData({
      position_type: positionType?.value || "",
      ar_name: item.ar_name || "",
      en_name: item.en_name || "",
      value: item.value || ""
    });
    setIsFormOpen(true);
  };

  // ✅ حفظ البيانات (إضافة أو تحديث)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // التحقق من البيانات
    if (!formData.ar_name || !formData.en_name) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    // تحضير البيانات حسب النوع
    let payload = {
      code: activeSettingType,
      ar_name: formData.ar_name,
      en_name: formData.en_name,
      value: formData.value
    };

    // إذا كان منصب، نستخدم الأسماء من القائمة المحددة
    if (activeSettingType === SETTING_TYPES.POSITION && formData.position_type) {
      const selectedPosition = POSITION_TYPES.find(p => p.value === formData.position_type);
      payload = {
        ...payload,
        ar_name: formData.ar_name || selectedPosition?.ar,
        en_name: formData.en_name || selectedPosition?.en
      };
    }

    try {
      if (editingItem) {
        // تحديث
        await dispatch(updateSetting({
          setting_id: editingItem.id,
          ...payload
        })).unwrap();
      } else {
        // إضافة جديد
        await dispatch(addSetting(payload)).unwrap();
      }
      
      setIsFormOpen(false);
      // إعادة جلب البيانات
      dispatch(fetchSettingsByCode(activeSettingType));
    } catch (error) {
      // الخطأ يتم عرضه عبر useEffect
    }
  };

  // ✅ إلغاء التعديل
  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingItem(null);
  };

  // ✅ تبديل نوع الإعداد
  const handleTypeChange = (type) => {
    setActiveSettingType(type);
    setIsFormOpen(false);
    setEditingItem(null);
  };
  const handleDelete = async (itemId) => {
  // ✅ تأكيد قبل الحذف
  if (!window.confirm(t("admin.confirmDeleteSetting"))) {
    return;
  }
  
  try {
    await dispatch(deleteSetting(itemId)).unwrap();
    toast.success(t("admin.settingDeleted"));
    // ✅ إعادة جلب البيانات لتحديث القائمة
    dispatch(fetchSettingsByCode(activeSettingType));
  } catch (error) {
    toast.error(error || t("admin.deleteFailed"));
  }
};

  const currentData = getCurrentData();
  const activeLabel = SETTING_LABELS[activeSettingType];
  const ActiveIcon = activeLabel.icon;

  return (
    <div className="bg-surface rounded-xl border border-border p-6">
      {/* Header مع دروب داون الأنواع */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <ActiveIcon className="text-primary" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text">
              {i18n.language === 'ar' ? activeLabel.ar : activeLabel.en}
            </h2>
            <p className="text-sm text-muted">
              {t("admin.manageSettings", { type: i18n.language === 'ar' ? activeLabel.ar : activeLabel.en })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* ✅ دروب داون اختيار النوع */}
          <select
            value={activeSettingType}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="px-8 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:ring-2 focus:ring-primary outline-none"
          >
            {Object.entries(SETTING_TYPES).map(([key, value]) => {
              const label = SETTING_LABELS[value];
              return (
                <option key={value} value={value}>
                  {i18n.language === 'ar' ? label.ar : label.en}
                </option>
              );
            })}
          </select>
          
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">{t("common.add")}</span>
          </button>
        </div>
      </div>

      {/* Form */}
      {isFormOpen && (
        <div className="mb-6 p-4 bg-background rounded-lg border border-border animate-fadeIn">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ✅ حقل نوع المنصب (فقط للمناصب) */}
            {activeSettingType === SETTING_TYPES.POSITION && (
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  {t("admin.positionType")} *
                </label>
                <select
                  value={formData.position_type}
                  onChange={(e) => {
                    const selected = POSITION_TYPES.find(p => p.value === e.target.value);
                    setFormData({
                      ...formData,
                      position_type: e.target.value,
                      ar_name: selected?.ar || "",
                      en_name: selected?.en || ""
                    });
                  }}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:ring-2 focus:ring-primary outline-none"
                  required
                >
                  <option value="">{t("admin.selectPosition")}</option>
                  {POSITION_TYPES.map((pos) => (
                    <option key={pos.value} value={pos.value}>
                      {i18n.language === 'ar' ? pos.ar : pos.en}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* الاسم العربي */}
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  {t("admin.arabicName")} *
                </label>
                <input
                  type="text"
                  value={formData.ar_name}
                  onChange={(e) => setFormData({ ...formData, ar_name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:ring-2 focus:ring-primary outline-none"
                  placeholder={
                    activeSettingType === SETTING_TYPES.POSITION ? "الاسم بالعربية" :
                    activeSettingType === SETTING_TYPES.BRANCH ? "اسم الفرع بالعربية" :
                    "اسم القسم بالعربية"
                  }
                  required
                />
              </div>

              {/* الاسم الإنجليزي */}
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  {t("admin.englishName")} *
                </label>
                <input
                  type="text"
                  value={formData.en_name}
                  onChange={(e) => setFormData({ ...formData, en_name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:ring-2 focus:ring-primary outline-none"
                  placeholder={
                    activeSettingType === SETTING_TYPES.POSITION ? "Name in English" :
                    activeSettingType === SETTING_TYPES.BRANCH ? "Branch Name in English" :
                    "Section Name in English"
                  }
                  required
                />
              </div>

              {/* القيمة */}
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  {t("admin.value")}
                </label>
                <input
                  type="text"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:ring-2 focus:ring-primary outline-none"
                  placeholder="101"
                />
              </div>
            </div>

            {/* أزرار الحفظ والإلغاء */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 text-text-muted hover:text-text transition"
              >
                <X size={18} />
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
              >
                <Save size={18} />
                {loading ? t("common.saving") : editingItem ? t("common.update") : t("common.save")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table - Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-background border-b">
            <tr>
              {activeSettingType === SETTING_TYPES.POSITION && (
                <th className="text-start px-4 py-3 text-sm font-bold text-text">{t("admin.positionType")}</th>
              )}
              <th className="text-start px-4 py-3 text-sm font-bold text-text">{t("admin.arabicName")}</th>
              <th className="text-start px-4 py-3 text-sm font-bold text-text">{t("admin.englishName")}</th>
              <th className="text-start px-4 py-3 text-sm font-bold text-text">{t("admin.value")}</th>
              <th className="text-end px-4 py-3 text-sm font-bold text-text">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {currentData.length === 0 ? (
              <tr>
                <td colSpan={activeSettingType === SETTING_TYPES.POSITION ? 5 : 4} className="text-center py-8 text-muted">
                  {t("admin.noSettings", { type: i18n.language === 'ar' ? activeLabel.ar : activeLabel.en })}
                </td>
              </tr>
            ) : (
              currentData.map((item) => {
                const positionType = activeSettingType === SETTING_TYPES.POSITION 
                  ? POSITION_TYPES.find(p => p.ar === item.ar_name || p.en === item.en_name)
                  : null;
                
                return (
                  <tr key={item.id} className="hover:bg-background/50 transition">
                    {activeSettingType === SETTING_TYPES.POSITION && (
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary">
                          <Briefcase size={14} />
                          {positionType 
                            ? (i18n.language === 'ar' ? positionType.ar : positionType.en)
                            : item.ar_name
                          }
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm text-text">{item.ar_name}</td>
                    <td className="px-4 py-3 text-sm text-text">{item.en_name}</td>
                    <td className="px-4 py-3 text-sm text-muted">{item.value || '-'}</td>
<td className="px-4 py-3 text-end">
  <div className="flex items-center justify-end gap-1">
    <button
      onClick={() => handleEdit(item)}
      className="p-2 text-primary hover:bg-primary/10 rounded-lg transition"
      title={t("common.edit")}
    >
      <Edit2 size={16} />
    </button>
    {/* ✅ زر الحذف - يظهر فقط إذا لم يكن عنصرًا ثابتًا */}
    {!item.is_system && ( // ✅ يمكنك إضافة هذا الحقل في الـ DB إذا أردت منع حذف العناصر الأساسية
      <button
        onClick={() => handleDelete(item.id)}
        className="p-2 text-danger hover:bg-danger/10 rounded-lg transition"
        title={t("common.delete")}
        disabled={loading}
      >
        <Trash2 size={16} />
      </button>
    )}
  </div>
</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {currentData.length === 0 ? (
          <div className="text-center py-8 text-muted">
            {t("admin.noSettings", { type: i18n.language === 'ar' ? activeLabel.ar : activeLabel.en })}
          </div>
        ) : (
          currentData.map((item) => {
            const positionType = activeSettingType === SETTING_TYPES.POSITION 
              ? POSITION_TYPES.find(p => p.ar === item.ar_name || p.en === item.en_name)
              : null;
            
            return (
              <div key={item.id} className="p-4 border rounded-lg bg-background">
<div className="flex items-start justify-between mb-3">
  {activeSettingType === SETTING_TYPES.POSITION && (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary">
      <Briefcase size={14} />
      {positionType 
        ? (i18n.language === 'ar' ? positionType.ar : positionType.en)
        : item.ar_name
      }
    </span>
  )}
  <div className="flex items-center gap-1">
    <button
      onClick={() => handleEdit(item)}
      className="p-2 text-primary hover:bg-primary/10 rounded-lg transition"
    >
      <Edit2 size={16} />
    </button>
    {/* ✅ زر الحذف للموبايل */}
    {!item.is_system && (
      <button
        onClick={() => handleDelete(item.id)}
        className="p-2 text-danger hover:bg-danger/10 rounded-lg transition"
        disabled={loading}
      >
        <Trash2 size={16} />
      </button>
    )}
  </div>
</div>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted">{t("admin.arabicName")}:</span> {item.ar_name}</p>
                  <p><span className="text-muted">{t("admin.englishName")}:</span> {item.en_name}</p>
                  {item.value && (
                    <p><span className="text-muted">{t("admin.value")}:</span> {item.value}</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}