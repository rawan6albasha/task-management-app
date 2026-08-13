// src/pages/AdminPage.jsx
import { useTranslation } from "react-i18next";
import { useAdmin } from "../../hooks/useAdmin";
import { useDispatch, useSelector } from "react-redux";
import { clearMessages } from "../../store/slices/adminSlice";
import { APP_CONFIG } from "../../config/appConfig";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { Shield, Users, CheckCircle, XCircle, Search, RefreshCw, Eye } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import UserAvatar from "../../components/shared/UserAvatar";
import SettingsManagement from "./SettingsManagement";
import { getLocalizedField } from "../../utils/helpers";

const AdminPage = () => {

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(); // ✅ أضف i18n


  const { 
    filteredUsers, 
    loading, 
    error, 
    success, 
    updateUserStatus, 
    fetchAllUsers,
    getUserImageUrl,
    statusFilter,
    setStatusFilter,
    searchTerm,
    setSearchTerm,
    allUsers
  } = useAdmin();
  const currentUser = useSelector((state) => state.auth?.user);

  // console.log('allUsers from useAdmin:', filteredUsers)
useEffect(() => {
  if (success) { 
    toast.success(success); 
    dispatch(clearMessages()); 
  }
  
  if (error) { 
    // ✅ ضمان أن error هو string قبل العرض
    const errorMessage = typeof error === 'string' 
      ? error 
      : 'حدث خطأ غير متوقع';
    
    toast.error(errorMessage); 
    dispatch(clearMessages()); 
  }
}, [success, error, dispatch]);
useEffect(() => {
  console.log('🔍 Debug AdminPage:', {
    allUsers: allUsers?.length,
    filteredUsers: filteredUsers?.length,
    loading,
    error
  });
}, [allUsers, filteredUsers, loading, error]);
useEffect(() => {
  console.log('🔍 AdminPage Debug:', {
    allUsersCount: allUsers?.length,
    filteredUsersCount: filteredUsers?.length,
    firstUser: allUsers?.[0]?.name,
  });
}, [allUsers, filteredUsers]);

const handleStatusChange = async (userId, newStatus) => {
  await updateUserStatus(userId, newStatus);
};

  const handleViewProfile = (userId) => {
    navigate(`/profile/${userId}`); // ✅ توجيه للبروفايل الموحد
  };

  if (loading && filteredUsers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  // داخل المكون قبل return

  return (
    <div className="space-y-6 animate-slideIn pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between gap-4 pb-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary-light">
            <Shield size={24} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-text">{t("admin.title")}</h1>
            <p className="text-sm text-muted">{t("admin.manageUsers")}</p>
          </div>
        </div>
        <button 
          onClick={fetchAllUsers}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white bg-primary hover:opacity-90 transition"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          {t("common.refresh")}
        </button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
          <input
            type="text"
            placeholder={t("admin.searchUsers")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full ps-12 pe-4 py-3 rounded-lg border-2 outline-none transition bg-surface text-text"
          />
        </div>
<select
  value={statusFilter}
  onChange={(e) => setStatusFilter(e.target.value)}
  className="px-4 py-3 rounded-lg border-2 outline-none transition bg-surface text-text"
>
  <option value="all">{t("admin.allUsers")}</option>
  <option value="active">{t("admin.activeUsers")}</option>
  <option value="inactive">{t("admin.inactiveUsers")}</option>
  <option value="banned">{t("admin.bannedUsers")}</option> {/* ✅ جديد */}
</select>
      </div>

      {/* Table - Desktop */}
      <div className="hidden md:block rounded-xl overflow-hidden border shadow-sm bg-surface">
        <table className="w-full">
          <thead className="bg-background">
            <tr className="border-b-2">
              <th className="text-start px-6 py-4 text-sm font-bold text-text">{t("user.name")}</th>
              <th className="text-start px-6 py-4 text-sm font-bold text-text">{t("user.email")}</th>
              <th className="text-start px-6 py-4 text-sm font-bold text-text">{t("user.position")}</th>
              <th className="text-start px-6 py-4 text-sm font-bold text-text">{t("user.status")}</th>

            </tr>
          </thead>

          <tbody>
          
{filteredUsers.map((user) => {
  // ✅ احسب اسم المنصب داخل الـ map حيث user معرف
const positionName = i18n.language === 'ar' 
  ? user.position?.ar_name 
  : user.position?.en_name || user.position?.ar_name 
  || '-';
   console.log('positionName',positionName)
  return (
    <tr key={user.id} className="hover:bg-background/50 transition">
  
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
              <UserAvatar
                linkTo={currentUser?.id === user.id ? "/profile" : `/profile/${user.id}`}
                user={user}
                size="md"
                showBorder={true}
                className="hover:scale-105 transition-transform"
              />
                    <div>
                      <p className="font-semibold text-sm text-text">{user.name}</p>
                      <p className="text-xs text-muted">#{user.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm truncate max-w-[200px] text-muted">{user.email}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1 text-sm font-medium px-2 py-1 rounded bg-primary-light text-primary">
                   { positionName}
                  </span>
                </td>
                <td className="px-6 py-4">
  <select
    value={user.account_status}
    onChange={(e) => handleStatusChange(user.id, e.target.value)}
    className={`px-3 py-1.5 rounded-lg font-semibold text-xs border-2 outline-none transition cursor-pointer ${
      user.account_status === 'active' 
        ? 'bg-success/10 text-success border-success/30 focus:ring-success/20' 
        : user.account_status === 'banned'
          ? 'bg-danger/10 text-danger border-danger/30 focus:ring-danger/20'
          : 'bg-warning/10 text-warning border-warning/30 focus:ring-warning/20'
    }`}
  >
    <option value="active" className="bg-surface text-text">{t("user.active")}</option>
    <option value="inactive" className="bg-surface text-text">{t("user.inactive")}</option>
    <option value="banned" className="bg-surface text-text">{t("user.banned")}</option>
  </select>
                </td>

              
    </tr>
  );
})}
          
          </tbody>
           
       
        </table>
      </div>

      {/* Cards - Mobile */}
<div className="md:hidden space-y-3">
  {filteredUsers.map((user) => (
    <div key={user.id} className="rounded-xl p-4 border-2 transition hover:shadow-md bg-surface">
      <div className="flex items-center gap-3 mb-3">
        <img src={getUserImageUrl(user.photo)} alt={user.name}
             className="w-12 h-12 rounded-full object-cover border-2"
             onError={(e) => { e.target.src = '/assets/default-avatar.png'; }} />
        <div className="flex-1 min-w-0">
          <h4 className="font-bold truncate text-text">{user.name}</h4>
          <p className="text-xs truncate text-muted">{user.email}</p>
        </div>
        
        {/* ✅ تصحيح مقارنة الحالة للقيم النصية */}
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
          user.account_status === 'active' ? 'bg-success/20 text-success' : 
          user.account_status === 'banned' ? 'bg-danger/20 text-danger' : 'bg-warning/20 text-warning'
        }`}>
          {user.account_status === 'active' ? t("user.active") : 
           user.account_status === 'banned' ? t("user.banned") : t("user.inactive")}
        </span>
      </div>
      
      {/* ✅ إزالة زر العين، والاحتفاظ بـ select فقط */}
      <div className="flex gap-2 pt-2 border-t">
        <select
          value={user.account_status}
          onChange={(e) => handleStatusChange(user.id, e.target.value)}
          className={`flex-1 px-3 py-2 rounded-lg font-semibold text-xs border-2 outline-none transition cursor-pointer ${
            user.account_status === 'active' 
              ? 'bg-success/10 text-success border-success/30' 
              : user.account_status === 'banned'
                ? 'bg-danger/10 text-danger border-danger/30'
                : 'bg-warning/10 text-warning border-warning/30'
          }`}
        >
          <option value="active">{t("user.active")}</option>
          <option value="inactive">{t("user.inactive")}</option>
          <option value="banned">{t("user.banned")}</option>
        </select>
      </div>
    </div>
  ))}
</div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed">
          <Users size={40} className="mx-auto mb-4 text-primary" />
          <p className="text-lg font-bold text-muted">
            {searchTerm || statusFilter !== 'all' ? t("admin.noResults") : t("admin.noUsers")}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
    { label: t("admin.totalUsers"), value: filteredUsers.length, color: "primary" },
    { label: t("admin.activeUsers"), value: filteredUsers.filter(u => u.account_status === 'active').length, color: "success" },
    { label: t("admin.inactiveUsers"), value: filteredUsers.filter(u => u.account_status === 'inactive').length, color: "warning" },
    { label: t("admin.bannedUsers"), value: filteredUsers.filter(u => u.account_status === 'banned').length, color: "danger" }, // ✅ جديد
   ].map((stat, idx) => (
          <div key={idx} className={`rounded-xl p-5 text-center border-2 bg-surface border-${stat.color}/40`}>
            <div className={`text-3xl font-bold mb-1 text-${stat.color}`}>{stat.value}</div>
            <p className="text-sm text-muted">{stat.label}</p>
          </div>
        ))}
      </div>
       <SettingsManagement />
    </div>
  );
};

export default AdminPage;