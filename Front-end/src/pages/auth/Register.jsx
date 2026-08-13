import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../../store/slices/authSlice";
import { fetchSettingsByCode } from "../../store/slices/settingsSlice";
import { UserPlus, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "../../components/shared/Button";
import api from "../../lib/axios";
import toast from "react-hot-toast";

export default function Register() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedLang, setSelectedLang] = useState(i18n.language || 'ar');

  const { branches, sections, positions, loading: settingsLoading } = useSelector(
    (state) => state.settings
  );

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    branch_id: "",
    section_id: "",
    position_id: ""
  });

  useEffect(() => {
    dispatch(fetchSettingsByCode("branch"));
    dispatch(fetchSettingsByCode("section"));
    dispatch(fetchSettingsByCode("position"));
  }, [dispatch]);

  useEffect(() => {
    if (branches.length > 0 && !form.branch_id) {
      setForm(f => ({ ...f, branch_id: branches[0].id }));
    }
    if (sections.length > 0 && !form.section_id) {
      setForm(f => ({ ...f, section_id: sections[0].id }));
    }
    if (positions.length > 0 && !form.position_id) {
      setForm(f => ({ ...f, position_id: positions[0].id }));
    }
  }, [branches, sections, positions, form.branch_id, form.section_id, form.position_id]);

  // ✅ تغيير اللغة
  const handleLanguageChange = (lang) => {
    setSelectedLang(lang);
    i18n.changeLanguage(lang);
    document.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (form.password !== form.password_confirmation) {
      setError(t('register.passwordMismatch'));
      return;
    }

    setLoading(true);
    
    try {
      const response = await api.post("/api/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        password_confirmation: form.password_confirmation,
        branch_id: form.branch_id ? Number(form.branch_id) : null,
        section_id: form.section_id ? Number(form.section_id) : null,
        position_id: form.position_id ? Number(form.position_id) : null,
      }, {
        headers: {
          'Accept-Language': selectedLang
        }
      });

      const responseData = response.data || response;
      
      if (responseData.code === 201 || responseData.code === 200) {
        const token = responseData?.data?.access_token || responseData?.access_token || null;
        
        if (token) {
          const userData = responseData.data?.user || responseData.user || {};
          dispatch(login({ 
            user: userData, 
            token, 
            permissions: userData.permissions || ['*'] 
          }));
          localStorage.setItem('token', token);
          localStorage.setItem('app_language', selectedLang);
          toast.success(responseData.message || t('register.success'));
          navigate('/tasks');
        } else {
          if (typeof toast !== 'undefined') {
            toast.success(responseData.message || t('register.pendingApproval'));
          }
          
          navigate('/login', {
            state: { 
              successMessage: responseData.message || t('register.pendingApprovalDetail') 
            },
            replace: true
          });
        }
      } else {
        setError(responseData.message || t('register.failed'));
      }
    } catch (err) {
      console.error('❌ Registration error:', err);
      
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const validationErrors = err.response.data.errors;
        const firstField = Object.keys(validationErrors)[0];
        const errorMessage = validationErrors[firstField]?.[0];
        setError(typeof errorMessage === 'string' ? errorMessage : t('register.validationError'));
      } else {
        setError(err.response?.data?.message || t('register.unexpectedError'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (settingsLoading && !branches.length && !sections.length && !positions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-8 px-4">
      <div className="bg-surface border border-border rounded-xl shadow-lg p-8 w-full max-w-2xl">
        
        {/* ✅ منتقي اللغة */}
        <div className="flex justify-end mb-4">
          <div className="flex items-center gap-2 bg-background border border-border rounded-lg p-1">
            <button
              type="button"
              onClick={() => handleLanguageChange('ar')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                selectedLang === 'ar' 
                  ? 'bg-primary text-white' 
                  : 'text-text-muted hover:text-text'
              }`}
            >
              عربي
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('en')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                selectedLang === 'en' 
                  ? 'bg-primary text-white' 
                  : 'text-text-muted hover:text-text'
              }`}
            >
              English
            </button>
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <UserPlus className="text-primary" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-text">{t('register.title')}</h1>
          <p className="text-text-muted mt-2">{t('register.subtitle')}</p>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger text-danger px-4 py-3 rounded-lg mb-6 text-sm">
            {typeof error === 'string' 
              ? error 
              : error?.message || Object.values(error || {})[0]?.[0] || t('register.unexpectedError')}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-2">{t('register.fullName')} *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={(e) => { setForm({ ...form, name: e.target.value }); setError(""); }}
                className="w-full border border-border rounded-lg px-4 py-2.5 bg-background focus:ring-2 focus:ring-primary outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">{t('register.email')} *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={(e) => { setForm({ ...form, email: e.target.value }); setError(""); }}
                className="w-full border border-border rounded-lg px-4 py-2.5 bg-background focus:ring-2 focus:ring-primary outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">{t('register.password')} *</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={(e) => { setForm({ ...form, password: e.target.value }); setError(""); }}
                className="w-full border border-border rounded-lg px-4 py-2.5 bg-background focus:ring-2 focus:ring-primary outline-none"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">{t('register.confirmPassword')} *</label>
              <input
                type="password"
                name="password_confirmation"
                value={form.password_confirmation}
                onChange={(e) => { setForm({ ...form, password_confirmation: e.target.value }); setError(""); }}
                className="w-full border border-border rounded-lg px-4 py-2.5 bg-background focus:ring-2 focus:ring-primary outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">{t('register.branch')} *</label>
              <select
                name="branch_id"
                value={form.branch_id}
                onChange={(e) => { setForm({ ...form, branch_id: e.target.value }); setError(""); }}
                className="w-full border border-border rounded-lg px-4 py-2.5 bg-background focus:ring-2 focus:ring-primary outline-none"
                required
                disabled={branches.length === 0}
              >
                <option value="">{t('register.selectBranch')}</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.ar_name || b.en_name}</option>
                ))}
              </select>
              {branches.length === 0 && <p className="text-xs text-text-muted mt-1">{t('common.loading')}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">{t('register.section')} *</label>
              <select
                name="section_id"
                value={form.section_id}
                onChange={(e) => { setForm({ ...form, section_id: e.target.value }); setError(""); }}
                className="w-full border border-border rounded-lg px-4 py-2.5 bg-background focus:ring-2 focus:ring-primary outline-none"
                required
                disabled={sections.length === 0}
              >
                <option value="">{t('register.selectSection')}</option>
                {sections.map(s => (
                  <option key={s.id} value={s.id}>{s.ar_name || s.en_name}</option>
                ))}
              </select>
              {sections.length === 0 && <p className="text-xs text-text-muted mt-1">{t('common.loading')}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text mb-2">{t('register.position')} *</label>
              <select
                name="position_id"
                value={form.position_id}
                onChange={(e) => { setForm({ ...form, position_id: e.target.value }); setError(""); }}
                className="w-full border border-border rounded-lg px-4 py-2.5 bg-background focus:ring-2 focus:ring-primary outline-none"
                required
                disabled={positions.length === 0}
              >
                <option value="">{t('register.selectPosition')}</option>
                {positions.map(p => (
                  <option key={p.id} value={p.id}>{p.ar_name || p.en_name}</option>
                ))}
              </select>
              {positions.length === 0 && <p className="text-xs text-text-muted mt-1">{t('common.loading')}</p>}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => navigate("/login")} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button 
              type="submit" 
              loading={loading || settingsLoading} 
              disabled={settingsLoading}
              className="flex-1"
            >
              {t('register.createAccount')}
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-text-muted">
            {t('register.haveAccount')}{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              {t('register.login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}