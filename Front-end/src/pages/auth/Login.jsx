import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { login } from "../../store/slices/authSlice";
import { useTranslation } from "react-i18next";
import { LogIn, Globe } from "lucide-react";
import Button from "../../components/shared/Button";
import api from "../../lib/axios";
import { useNavigate, Link, useLocation } from "react-router-dom";

export default function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  
  const [form, setForm] = useState({ 
    email: "", 
    password: "",
    remember_me: false 
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedLang, setSelectedLang] = useState(i18n.language || 'ar');
  const successMsg = location.state?.successMessage || null;

  // ✅ إخفاء الرسالة بعد 5 ثواني
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => {
        // Navigation state will be cleared on unmount
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // ✅ تغيير اللغة
  const handleLanguageChange = (lang) => {
    setSelectedLang(lang);
    i18n.changeLanguage(lang);
    document.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // ✅ إرسال اللغة في الـ header
      const response = await api.post('/api/login', {
        email: form.email,
        password: form.password,
        remember_me: form.remember_me
      }, {
        headers: {
          'Accept-Language': selectedLang
        }
      });
      
      const responseData = response;
      
      if (responseData.code === 200 || response.status === 200) {
        const { access_token, user } = responseData.data;
        
        localStorage.setItem('token', access_token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('app_language', selectedLang); // ✅ حفظ اللغة المفضلة
        
        dispatch(login({
          user,
          token: access_token,
          permissions: user.permissions || (user.role === 'admin' ? ['*'] : ['task:view'])
        }));
        
        navigate('/tasks');
      } else {
        setError(responseData.message || t('login.failed'));
      }
      
    } catch (error) {
      console.error('Login Error:', error);
      
      const backendMessage = error.response?.data?.message;
      
      if (backendMessage?.includes('deactivated')) {
        setError(t('login.deactivated'));
      } else if (backendMessage?.includes('credentials')) {
        setError(t('login.invalidCredentials'));
      } else {
        setError(backendMessage || t('login.connectionError'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="bg-surface border border-border rounded-xl shadow-lg p-8 w-full max-w-md">
        
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

        {successMsg && (
          <div className="mb-6 p-3 bg-success/10 border border-success/30 text-success rounded-lg text-sm flex items-start gap-2">
            <span>✅</span>
            <span>{successMsg}</span>
            <button onClick={() => {}} className="ms-auto text-success hover:opacity-70">✕</button>
          </div>
        )}

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <LogIn className="text-primary" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-text">{t('login.title')}</h1>
          <p className="text-text-muted mt-2">{t('login.welcome')}</p>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger text-danger px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text mb-2">{t('login.email')}</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-border rounded-lg px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              placeholder="example@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">{t('login.password')}</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border border-border rounded-lg px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              placeholder="••••••••"
              required
            />
          </div>

          {/* ✅ Remember Me Checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember_me"
              checked={form.remember_me}
              onChange={(e) => setForm({ ...form, remember_me: e.target.checked })}
              className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
            />
            <label htmlFor="remember_me" className="ms-2 text-sm text-text">
              {t('login.rememberMe')}
            </label>
          </div>

          <Button type="submit" loading={loading} className="w-full">
            {t('login.submit')}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-text-muted">
            {t('login.noAccount')}{" "}
            <Link to="/register" className="text-primary hover:underline font-medium">
              {t('login.register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}