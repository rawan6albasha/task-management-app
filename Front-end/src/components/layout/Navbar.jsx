import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckSquare, FolderOpen, Bell, LogOut, LayoutDashboard, Shield, Menu, X } from 'lucide-react'; // ✅ إضافة أيقونات الموبايل
import LanguageSwitcher from './LanguageSwitcher';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from "./../../store/slices/authSlice";
import { useNavigate } from "react-router-dom";
import UserAvatar from '../shared/UserAvatar';
import NotificationDropdown from './NotificationDropdown';
import usePermission from "../../hooks/usePermissions";
import { useState } from 'react'; // ✅ إضافة useState

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { can } = usePermission();
  const location = useLocation();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  // ✅ حالة القائمة الجانبية للموبايل
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isActive = (path) => location.pathname === path || (path === '/' && location.pathname === '/dashboard');
  
  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
    setMobileMenuOpen(false); // ✅ إغلاق القائمة عند الخروج
  };

  // ✅ قائمة الروابط الرئيسية (لإعادة الاستخدام)
  const navLinks = [
    { to: '/', label: 'nav.dashboard', icon: LayoutDashboard, permission: null },
    { to: '/tasks', label: 'nav.tasks', icon: CheckSquare, permission: null },
    { to: '/admin/users', label: 'nav.admin', icon: Shield, permission: { action: 'admin:view', requiresPosition: "7" } },
    { to: '/projects', label: 'nav.projects', icon: FolderOpen, permission: null },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-surface border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* ✅ Logo - دائماً ظاهر */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 bg-gradient-to-br from-primary via-blue-400 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg">
                <FolderOpen size={20} className="text-white" />
              </div>
              <h1 className="text-lg font-bold text-gradient tracking-tight hidden xs:inline">TaskFlow</h1>
            </Link>
          </div>

          {/* ✅ Desktop Navigation - يظهر من md فأعلى */}
          <div className="hidden md:flex items-center gap-1">
            {isAuthenticated && navLinks.map((link) => {
              // ✅ التحقق من الصلاحية إذا وُجدت
              if (link.permission && !can(link.permission.action, { requiresPosition: link.permission.requiresPosition })) {
                return null;
              }
              return (
                <Link 
                  key={link.to}
                  to={link.to} 
                  className={`flex items-center gap-2 text-sm font-semibold transition-all duration-200 px-3 py-2 rounded-lg ${
                    isActive(link.to) 
                      ? 'text-primary bg-primary/10 shadow-sm' 
                      : 'text-text-muted hover:text-text hover:bg-background'
                  }`}
                >
                  <link.icon size={16} /> 
                  {t(link.label)}
                </Link>
              );
            })}
          </div>

          {/* ✅ Right Side Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {isAuthenticated ? (
              <>
                {/* Notifications - دائمًا ظاهر */}
                <NotificationDropdown />
                
                {/* User Info - يظهر من lg فأعلى */}
                <div className="hidden lg:flex items-center gap-2 ms-1 ps-2 border-l border-border">
                  <UserAvatar   
                    linkTo="/profile"
                    user={user} 
                    size="sm" 
                    showBorder={true}
                    className="hover:scale-105 transition-transform"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-text truncate max-w-[100px]">{user?.name}</p>
                    <p className="text-[10px] text-text-muted capitalize">{user?.position?.ar_name || user?.role}</p>
                  </div>
                </div>
              </>
            ) : (
              <Link to="/login" className="text-xs sm:text-sm font-semibold text-primary hover:text-primary/80 transition-colors px-2 py-2">
                {t('nav.login')}
              </Link>
            )}
            
            {/* Language Switcher - دائمًا ظاهر */}
            <LanguageSwitcher />
            
            {/* Logout - دائمًا ظاهر */}
            {isAuthenticated && (
              <button 
                onClick={handleLogout} 
                className="p-2 hover:bg-red-100 rounded-lg transition-all duration-200 group" 
                title={t('common.logout')}
              >
                <LogOut size={16} className="text-red-500 group-hover:text-red-600 transition-colors" />
              </button>
            )}

            {/* ✅ Mobile Menu Toggle - يظهر فقط على الموبايل */}
            {isAuthenticated && (
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 hover:bg-background rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ✅ Mobile Menu - يظهر فقط على الموبايل عند الفتح */}
      {mobileMenuOpen && isAuthenticated && (
        <div className="md:hidden border-t border-border bg-surface/95 backdrop-blur-sm animate-fadeIn">
          <div className="px-4 py-3 space-y-1">
            {/* User Info Mobile */}
            <div className="flex items-center gap-3 pb-3 mb-3 border-b border-border">
              <UserAvatar   
                linkTo="/profile"
                user={user} 
                size="md" 
                showBorder={true}
              />
              <div>
                <p className="text-sm font-semibold text-text">{user?.name}</p>
                <p className="text-xs text-text-muted capitalize">{user?.position?.ar_name || user?.role}</p>
              </div>
            </div>
            
            {/* Mobile Nav Links */}
            {navLinks.map((link) => {
              // ✅ التحقق من الصلاحية
              if (link.permission && !can(link.permission.action, { requiresPosition: link.permission.requiresPosition })) {
                return null;
              }
              return (
                <Link 
                  key={link.to}
                  to={link.to} 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive(link.to) 
                      ? 'text-primary bg-primary/10' 
                      : 'text-text-muted hover:text-text hover:bg-background'
                  }`}
                >
                  <link.icon size={18} /> 
                  {t(link.label)}
                </Link>
              );
            })}
            
            {/* Mobile Actions */}
            <div className="pt-3 mt-3 border-t border-border">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-danger hover:bg-red-50 transition-colors"
              >
                <LogOut size={18} /> 
                {t('common.logout')}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}