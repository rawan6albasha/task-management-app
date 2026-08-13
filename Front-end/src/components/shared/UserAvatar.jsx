// src/components/shared/UserAvatar.jsx
import { User } from "lucide-react";
import { Link } from "react-router-dom";
import { APP_CONFIG } from "../../config/appconfig";

export default function UserAvatar({ 
  user, 
  size = "md", 
  showBorder = true, 
  linkTo = null,
  className = ""
}) {
  if (!user) return null;

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-9 h-9 text-sm", 
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
    "2xl": "w-24 h-24 text-2xl"
  };

  const avatarSize = sizeClasses[size] || sizeClasses.md;

  // ✅ إصلاح رابط الصورة - دعم مسارات مختلفة
  const getImageUrl = (photo) => {
    if (!photo) return null;
    
    // إذا كان الرابط كامل يبدأ بـ http
    if (photo.startsWith('http')) return photo;
    
    // إذا كان يبدأ بـ storage/
    if (photo.startsWith('storage/')) {
      return `${APP_CONFIG.api.baseUrl}/${photo}`;
    }
    
    // المسار الافتراضي
    return `${APP_CONFIG.api.baseUrl}/storage/${photo}`;
  };

  const initial = user.name?.charAt(0).toUpperCase() || "?";
  const photoUrl = user.photo ? getImageUrl(user.photo) : null;

  const avatarContent = (
    <div className={`relative w-full h-full rounded-full overflow-hidden ${showBorder ? 'ring-2 ring-primary/20' : ''}`}>
      {photoUrl ? (
        <>
          <img
            src={photoUrl}
            alt={user.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.querySelector('.avatar-fallback')?.classList.remove('hidden');
            }}
          />
          <div className="avatar-fallback hidden w-full h-full rounded-full bg-gradient-to-br from-primary to-cyan-400 items-center justify-center">
            <span className="font-bold text-white">{initial}</span>
          </div>
        </>
      ) : (
        <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center">
          <span className="font-bold text-white">{initial}</span>
        </div>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link 
        to={linkTo} 
        className={`${avatarSize} rounded-full flex items-center justify-center hover:opacity-90 transition ${className}`}
      >
        {avatarContent}
      </Link>
    );
  }

  return (
    <div className={`${avatarSize} rounded-full flex items-center justify-center ${className}`}>
      {avatarContent}
    </div>
  );
}