import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const toggleLang = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  return (
    <button 
      onClick={toggleLang}
      className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-background transition text-sm font-medium"
    >
      <Globe size={16} />
      <span>{i18n.language === 'ar' ? 'English' : 'العربية'}</span>
    </button>
  );
}