import { useTranslation } from "react-i18next";
import { Upload, Save, X, Image as ImageIcon } from "lucide-react";
import UserAvatar from "../../components/shared/UserAvatar";
import Button from "../../components/shared/Button";

const ProfileEditForm = ({ 
  editForm, 
  setEditForm, 
  currentProfile, 
  handleUpdateProfile, 
  handlePhotoChange,
  fileInputRef,
  loading
}) => {
  const { t } = useTranslation();

  return (
    <form onSubmit={handleUpdateProfile} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Photo Upload Card */}
        <div className="rounded-3xl border border-border/60 bg-background/70 p-5 shadow-sm">
          <div className="relative text-center">
            <div className="mx-auto w-fit">
              <UserAvatar 
                user={{ ...currentProfile, photo: editForm.photoPreview || currentProfile.photo }} 
                size="xl" 
                showBorder={true} 
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 end-0  p-2 rounded-full bg-primary text-white hover:bg-primary/90 transition shadow-lg"
                title={t("common.changePhoto")}
              >
                <Upload size={14} />
              </button>
            </div>
            
            <div className="mt-5 space-y-3">
              <p className="text-sm font-semibold text-text">{t("profile.profilePhoto")}</p>
              
              {/* File Requirements */}
              <div className="bg-background/50 rounded-xl p-3 border border-border/50">
                <div className="flex items-start gap-2 text-xs text-muted">
                  <ImageIcon size={14} className="mt-0.5 flex-shrink-0 text-primary" />
                  <div className="space-y-1.5 text-start">
                    <p><span className="font-medium text-text">{t("profile.maxFileSize")}:</span> 5MB</p>
                    <p><span className="font-medium text-text">{t("profile.allowedFormats")}:</span> JPG, PNG, GIF, WebP</p>
                  </div>
                </div>
              </div>
              
              {editForm.photo && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-2.5">
                  <p className="text-xs text-primary font-medium truncate">
                    ✓ {editForm.photo.name}
                  </p>
                  <p className="text-[10px] text-primary/70 mt-0.5">
                    {(editForm.photo.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}
              
              <p className="text-xs mx-10 text-muted leading-relaxed">
                {t("profile.profilePhotoHelp")}
              </p>
            </div>
          </div>
          
          <input 
            ref={fileInputRef} 
            type="file" 
            accept="image/*" 
            onChange={handlePhotoChange} 
            className="hidden" 
          />
        </div>

        {/* Form Fields Card */}
        <div className="space-y-5 rounded-3xl border border-border/60 bg-background/70 p-5 shadow-sm">
          <div>
            <label className="block text-sm font-medium mb-2">{t("user.name")} *</label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full border border-border rounded-2xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary outline-none transition"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">{t("user.email")} *</label>
            <input
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
              className="w-full border border-border rounded-2xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary outline-none transition"
              required
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border justify-end">
        <Button type="submit" loading={loading} className="w-full sm:w-auto">
          <Save size={16} className="ms-2" /> {t("common.save")}
        </Button>
        <Button type="button" variant="ghost" onClick={() => window.history.back()} className="w-full sm:w-auto">
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
};

export default ProfileEditForm;