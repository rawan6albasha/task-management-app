import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Lock } from "lucide-react";
import Button from "../../components/shared/Button";

const ChangePasswordForm = ({
  passwordForm,
  setPasswordForm,
  showPassword,
  setShowPassword,
  onSubmit,
  loading,
  onCancel
}) => {
  const { t } = useTranslation();

  const handleChange = (field) => (e) => {
    setPasswordForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const toggleVisibility = (field) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(passwordForm);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-3xl border border-border/60 bg-background/70 p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-text mb-1">{t("profile.changePassword")}</h2>
            <p className="text-sm text-muted leading-6">{t("profile.passwordHelp")}</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-2 text-sm font-medium">
            <Lock size={16} /> {t("profile.security")}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t("profile.currentPassword")} *</label>
            <div className="relative">
              <input
                type={showPassword.current ? 'text' : 'password'}
                value={passwordForm.current_password}
                onChange={handleChange('current_password')}
                autoComplete="current-password"
                className="w-full border border-border rounded-2xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary outline-none transition"
                required
              />
              <button
                type="button"
                onClick={() => toggleVisibility('current')}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary"
                aria-label={showPassword.current ? t("profile.hidePassword") : t("profile.showPassword")}
              >
                {showPassword.current ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t("profile.newPassword")} *</label>
            <div className="relative">
              <input
                type={showPassword.new ? 'text' : 'password'}
                value={passwordForm.new_password}
                onChange={handleChange('new_password')}
                autoComplete="new-password"
                className="w-full border border-border rounded-2xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary outline-none transition"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => toggleVisibility('new')}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary"
                aria-label={showPassword.new ? t("profile.hidePassword") : t("profile.showPassword")}
              >
                {showPassword.new ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t("profile.confirmPassword")} *</label>
            <div className="relative">
              <input
                type={showPassword.confirm ? 'text' : 'password'}
                value={passwordForm.confirm_password}
                onChange={handleChange('confirm_password')}
                autoComplete="new-password"
                className="w-full border border-border rounded-2xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary outline-none transition"
                required
              />
              <button
                type="button"
                onClick={() => toggleVisibility('confirm')}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary"
                aria-label={showPassword.confirm ? t("profile.hidePassword") : t("profile.showPassword")}
              >
                {showPassword.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-border justify-end">
        <Button type="submit" loading={loading} className="w-full sm:w-auto">
          <Lock size={16} className="ms-2" /> {t("profile.changePassword")}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} className="w-full sm:w-auto">
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
};

export default ChangePasswordForm;