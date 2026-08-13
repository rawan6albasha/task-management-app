import { HashRouter, Routes, Route } from 'react-router-dom';  // تغيير: BrowserRouter → HashRouter
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Layout from './components/layout/Layout.jsx';
import ProjectDetailsPage from './pages/projects/ProjectDetailsPage.jsx';
import ProjectsPage from './pages/projects/ProjectsPage.jsx';
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import TasksPage from './pages/Tasks/TasksPage.jsx';
import Dashboard from './pages/dashboard/Dashboard.jsx';
import AdminPage from './pages/admin/AdminPage.jsx';
import { restoreAuth } from './store/slices/authSlice.js';
import { Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import UserProfile from './pages/Profile/UserProfile.jsx';
import TaskDetailsPage from './pages/Tasks/TaskDetailsPage.jsx';
import { useTranslation } from 'react-i18next';

// مكون للحماية
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useSelector(state => state.auth);
  return isAuthenticated ? children : <Navigate to="/login" />;
}

// مكون للحماية (Admin فقط)
function AdminRoute({ children }) {
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const isAdmin = user?.role === 'admin';
  
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/" />;
  
  return children;
}

export default function App() {
  const dispatch = useDispatch();
    const { i18n } = useTranslation();

  // استعادة الـ auth state من localStorage عند بدء التطبيق
  useEffect(() => {
    const savedAuth = localStorage.getItem('auth');
    if (savedAuth) {
      try {
        dispatch(restoreAuth(JSON.parse(savedAuth)));
      } catch (error) {
        console.error('Failed to restore auth:', error);
      }
    }
  }, [dispatch]);
    useEffect(() => {
    // ✅ تحديث اتجاه الصفحة فوراً عند تغيير اللغة أو عند التحميل الأول
    const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
  }, [i18n.language]); // يعمل عند التغيير وأيضاً عند أول رندر

  
  return (
    <HashRouter>  {/* بدون basename */}
      <Routes>
        {/* صفحات المصادقة (عامة) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* الصفحات المحمية - مُغلفة بـ ProtectedRoute */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailsPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="tasks/:id" element={<TaskDetailsPage />} />
          <Route path="admin/users" element={<AdminPage />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="profile/:userId" element={<UserProfile />} />
        </Route>
      </Routes>
      <Toaster position="top-center" />
    </HashRouter>
  );
}