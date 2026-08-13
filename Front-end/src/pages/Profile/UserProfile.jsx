import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState, useRef, memo } from "react";
import { 
  User, Mail, Building, Folder, BadgeCheck, Edit, ArrowLeft, 
  Calendar, Lock, Upload, Save, X, Eye, EyeOff, Camera, Key, Info 
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import UserAvatar from "../../components/shared/UserAvatar";
import Button from "../../components/shared/Button";
import { 
  fetchUserProfile, 
  fetchUserById, 
  updateUserProfile, 
  changePassword,
  clearUsersError,
  clearViewingProfile
} from "../../store/slices/userSlice";
import ProfileEditForm from "../../components/profile/ProfileEditForm";
import ChangePasswordForm from "../../components/profile/ChangePasswordForm";

// ✅ دالة مساعدة لعرض الاسم حسب اللغة (للفرع/القسم/المنصب)
const getOrgName = (item, lang, fallbackKey = "common.notSet") => {
  if (!item) return fallbackKey;
  return lang === 'ar' 
    ? (item.ar_name || item.en_name || fallbackKey)
    : (item.en_name || item.ar_name || fallbackKey);
};

// ✅ InfoCard Component
const InfoCard = memo(({ icon: Icon, label, value, t }) => (
  <div className="group flex items-start gap-3 p-4 rounded-xl bg-background/50 hover:bg-background border border-border/50 hover:border-primary/30 transition-all duration-200">
    <div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors flex-shrink-0">
      <Icon size={18} className="text-primary" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-muted mb-1">{label}</p>
      <p className="font-semibold text-text truncate">{value || t("common.notSet")}</p>
    </div>
  </div>
));
InfoCard.displayName = 'InfoCard';

const UserProfile = () => {
  const { t, i18n } = useTranslation(); // ✅ إضافة i18n
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userId } = useParams();
  
  const { profile, viewingProfile, loading, error, success } = useSelector((state) => state.users);
  const currentUser = useSelector((state) => state.auth?.user);
  
  const [activeTab, setActiveTab] = useState('view');
  const [editForm, setEditForm] = useState({ name: '', email: '', photo: null, photoPreview: null });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  const fileInputRef = useRef(null);

  const currentProfile = userId ? viewingProfile : profile;
  const isOwnProfile = !userId;
  const lang = i18n.language; // ✅ اللغة الحالية

  const getPhotoUrl = (photo) => {
    if (!photo) return null;
    if (photo.startsWith('http')) return photo;
    return `${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'}/storage/${photo}`;
  };

  useEffect(() => {
    if (currentProfile?.photo) {
      const url = getPhotoUrl(currentProfile.photo);
      console.log('🖼️ Image Debug:', {
        original: currentProfile.photo,
        generated: url
      });
    }
  }, [currentProfile]);

  useEffect(() => {
    if (currentUser?.photo) {
      const url = getPhotoUrl(currentUser.photo);
      console.log('🖼️ User Avatar:', {
        originalPath: currentUser.photo,
        generatedUrl: url,
        userName: currentUser.name
      });
    }
  }, []);

  // ✅ جلب البروفايل
  useEffect(() => {
    if (isOwnProfile) {
      dispatch(fetchUserProfile());
    } else {
      dispatch(fetchUserById(userId));
    }
    return () => {
      dispatch(clearUsersError());
      if (!isOwnProfile) dispatch(clearViewingProfile());
    };
  }, [dispatch, userId, isOwnProfile]);

  // ✅ عرض رسائل النجاح/الخطأ
  useEffect(() => {
    if (success) {
      toast.success(t(success));
      dispatch(clearUsersError());
    }
    if (error) {
      let errorMessage = t("profile.unknownError");
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (typeof error === 'object' && error !== null) {
        const keys = Object.keys(error);
        if (keys.length > 0) {
          const firstError = error[keys[0]];
          errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
        }
      }
      toast.error(errorMessage);
      const errorStr = JSON.stringify(error).toLowerCase();
      if (errorStr.includes('403') || errorStr.includes('404')) {
        setTimeout(() => navigate(-1), 2000);
      }
    }
  }, [success, error, dispatch, navigate, t]);

  // ✅ تهيئة فورم التعديل
  useEffect(() => {
    if (currentProfile && isOwnProfile && activeTab === 'edit') {
      setEditForm({
        name: currentProfile.name || '',
        email: currentProfile.email || '',
        photo: null,
        photoPreview: currentProfile.photo 
          ? `${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'}/storage/${currentProfile.photo}` 
          : null
      });
    }
  }, [currentProfile, isOwnProfile, activeTab]);

  // ✅ Handlers
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t("profile.maxFileSize"));
        return;
      }
      setEditForm(prev => ({
        ...prev,
        photo: file,
        photoPreview: URL.createObjectURL(file)
      }));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!isOwnProfile) return;
    const result = await dispatch(updateUserProfile(editForm));
    if (updateUserProfile.fulfilled.match(result)) {
      setEditForm(prev => ({
        ...prev,
        photo: null,
        photoPreview: result.payload?.photo 
          ? `${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'}/storage/${result.payload.photo}` 
          : prev.photoPreview
      }));
      setActiveTab('view');
    }
  };

  const handleChangePassword = async (passwordData) => {
    if (!isOwnProfile) return;
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error(t("profile.passwordsNotMatch"));
      return;
    }
    const result = await dispatch(changePassword(passwordData));
    if (changePassword.fulfilled.match(result)) {
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      setActiveTab('view');
    }
  };

  // ✅ Loading State
  if (loading && !currentProfile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent mx-auto"></div>
          <p className="text-text-muted animate-pulse">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  // ✅ Error State
  if (!currentProfile) {
    return (
      <div className="text-center py-20">
        <div className={`rounded-2xl w-24 h-24 flex items-center justify-center mx-auto mb-6 ${error ? 'bg-danger/10' : 'bg-warning/10'}`}>
          <User size={40} className={error ? 'text-danger' : 'text-warning'} />
        </div>
        <h2 className="text-2xl font-bold text-text mb-2">{error ? t("profile.notFound") : t("common.loading")}</h2>
        <p className="text-text-muted mb-6 max-w-md mx-auto">{error || t("profile.loadingData")}</p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft size={18} className="ms-2" />
          {t("common.back")}
        </Button>
      </div>
    );
  }

  // ✅ Tabs Configuration
  const tabs = [
    { id: 'view', label: t("profile.overview"), icon: Info },
    ...(isOwnProfile ? [
      { id: 'edit', label: t("profile.editProfile"), icon: Edit },
      { id: 'password', label: t("profile.security"), icon: Lock }
    ] : [])
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-6 md:py-10">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <button 
            onClick={() => navigate(-1)} 
            className="inline-flex items-center gap-2 text-muted hover:text-primary transition-colors group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">{t("common.back")}</span>
          </button>
          {isOwnProfile && (
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              {t("profile.myProfile")}
            </span>
          )}
        </div>

        {/* Profile Header Card */}
        <div className="relative bg-surface rounded-3xl border-2 border-border/50 overflow-hidden shadow-lg mb-6 md:mb-8">
          {/* Cover Gradient with Soft Glow */}
          <div className="h-32 md:h-48 bg-gradient-to-r from-primary via-primary/90 to-cyan-400 relative overflow-hidden">
            <div className="absolute -top-10 -end-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-10 -start-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          </div>
          
          {/* Profile Info */}
          <div className="px-6 pb-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-end gap-5 -mt-12 sm:-mt-16">
              {/* Avatar with Upload */}
              <div className="relative flex-shrink-0 z-10">
                <UserAvatar user={currentProfile} size="2xl" showBorder={true} className="shadow-xl ring-4 ring-surface bg-white" />
                {isOwnProfile && activeTab === 'edit' && (
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()} 
                    className="absolute -bottom-2 -end-2 p-2.5 rounded-full bg-primary text-white hover:bg-primary/90 transition shadow-lg hover:scale-105 z-20"
                    title={t("common.changePhoto")}
                  >
                    <Camera size={16} />
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </div>
              
              {/* Name & Title */}
              <div className="flex-1 pt-3 sm:pt-0 sm:pb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 drop-shadow-sm">
                  {currentProfile.name}
                </h1>
                <p className="font-semibold mt-1 text-primary flex items-center gap-2">
                  <BadgeCheck size={16} />
                  {/* ✅ عرض المنصب حسب اللغة */}
                  {getOrgName(currentProfile.position, lang, t("common.notSet"))}
                </p>
                
                {/* Organization Badges */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {currentProfile.branch && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 border border-gray-200 text-sm text-gray-700 hover:border-primary/50 transition shadow-sm">
                      <Building size={14} className="text-primary" />
                      {/* ✅ عرض الفرع حسب اللغة */}
                      {getOrgName(currentProfile.branch, lang)}
                    </span>
                  )}
                  {currentProfile.section && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 border border-gray-200 text-sm text-gray-700 hover:border-primary/50 transition shadow-sm">
                      <Folder size={14} className="text-primary" />
                      {/* ✅ عرض القسم حسب اللغة */}
                      {getOrgName(currentProfile.section, lang)}
                    </span>
                  )}
                </div>
              </div>
              
              {/* ✅ Status Badge */}
              <div className="flex-shrink-0">
                {(() => {
                  const isActive = currentProfile.account_status && String(currentProfile.account_status).toLowerCase() === 'active';
                  return (
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${
                      isActive 
                        ? 'bg-green-100 text-green-700 border border-green-300' 
                        : 'bg-red-100 text-red-700 border border-red-300'
                    }`}>
                      <span className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                      {isActive ? t("user.active") : t("user.inactive")}
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        {isOwnProfile && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                    isActive 
                      ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-105' 
                      : 'bg-surface text-muted hover:bg-background hover:text-primary border border-border/50'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Main Content Area */}
        <div className="bg-surface rounded-2xl border-2 border-border/50 shadow-sm overflow-hidden">
          {activeTab === 'view' && (
            <div className="p-5 md:p-8">
              <ProfileView profile={currentProfile} t={t} InfoCard={InfoCard} lang={lang} getOrgName={getOrgName} />
            </div>
          )}
          {activeTab === 'edit' && isOwnProfile && (
            <div className="p-5 md:p-8">
              <ProfileEditForm 
                editForm={editForm}
                setEditForm={setEditForm}
                currentProfile={currentProfile}
                handleUpdateProfile={handleUpdateProfile}
                handlePhotoChange={handlePhotoChange}
                fileInputRef={fileInputRef}
                loading={loading}
                t={t}
              />
            </div>
          )}
          {activeTab === 'password' && isOwnProfile && (
            <div className="p-5 md:p-8">
              <ChangePasswordForm
                passwordForm={passwordForm}
                setPasswordForm={setPasswordForm}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                onSubmit={handleChangePassword}
                loading={loading}
                onCancel={() => setActiveTab('view')}
                t={t}
              />
            </div>
          )}
        </div>

        {/* Viewing Other Profile Notice */}
        {!isOwnProfile && activeTab === 'view' && (
          <div className="mt-6 p-5 rounded-2xl border bg-primary/5 border-primary/20 flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Info size={18} className="text-primary" />
            </div>
            <p className="text-sm font-medium text-primary">
              {t("profile.viewingOther", { name: currentProfile.name })}
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

// ✅ Profile View Component - مُحدَّث لدعم اللغة
const ProfileView = ({ profile, t, InfoCard, lang, getOrgName }) => (
  <div className="space-y-8">
    {/* Quick Stats */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 text-center">
        <p className="text-2xl font-bold text-primary">#{profile.id}</p>
        <p className="text-xs text-muted mt-1">{t("user.id")}</p>
      </div>
      <div className="p-4 rounded-xl bg-gradient-to-br from-success/10 to-success/5 border border-success/20 text-center">
        <p className="text-2xl font-bold text-success">✓</p>
        <p className="text-xs text-muted mt-1">{t("user.verified")}</p>
      </div>
      <div className="p-4 rounded-xl bg-gradient-to-br from-cyan/10 to-cyan/5 border border-cyan/20 text-center">
        <p className="text-2xl font-bold text-cyan">{new Date(profile.created_at).getFullYear()}</p>
        <p className="text-xs text-muted mt-1">{t("user.joined")}</p>
      </div>
      <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 text-center">
        <p className="text-2xl font-bold text-primary">{profile.position?.code || '-'}</p>
        <p className="text-xs text-muted mt-1">{t("user.code")}</p>
      </div>
    </div>

    {/* Personal Information */}
    <div>
      <h3 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
        <User size={20} className="text-primary" />
        {t("profile.personalInfo")}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard icon={User} label={t("user.name")} value={profile.name} t={t} />
        <InfoCard icon={Mail} label={t("user.email")} value={profile.email} t={t} />
        {profile.email_verified_at && (
          <InfoCard icon={BadgeCheck} label={t("user.emailVerified")} value={new Date(profile.email_verified_at).toLocaleDateString('ar-EG')} t={t} />
        )}
<InfoCard 
  icon={Calendar} 
  label={t("user.memberSince")} 
  // ✅ التاريخ دائماً بالإنجليزي بغض النظر عن اللغة
  value={new Date(profile.created_at).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })} 
  t={t} 
/> </div>
    </div>

    {/* Organization Information */}
    <div>
      <h3 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
        <Building size={20} className="text-primary" />
        {t("profile.orgInfo")}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard icon={BadgeCheck} label={t("user.position")} value={getOrgName(profile.position, lang)} t={t} />
        <InfoCard icon={Building} label={t("user.branch")} value={getOrgName(profile.branch, lang)} t={t} />
        <InfoCard icon={Folder} label={t("user.section")} value={getOrgName(profile.section, lang)} t={t} />
        {profile.position?.code && (
          <InfoCard icon={Info} label={t("user.positionCode")} value={profile.position.code} t={t} />
        )}
      </div>
    </div>
  </div>
);

export default UserProfile;