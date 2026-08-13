// src/hooks/usePermissions.js
import { useSelector } from 'react-redux';
import { APP_CONFIG } from '../config/appConfig';

const usePermissions = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  
  // ✅ استخراج منصب المستخدم مباشرة من position_id
  // إذا كان غير موجود، نعتبره موظف عادي (6) كقيمة افتراضية آمنة
  const userPosition = Number(user?.position_id) || 6;
  
  const userPermissions = user?.permissions || [];

  const can = (action, options = {}) => {
    if (!isAuthenticated) return false;

    // ✅ 1. إذا كان لديه صلاحية '*' (أدمن شامل)
    if (userPermissions.includes('*')) return true;

    // ✅ 2. إذا كان لديه الصلاحية مباشرة في القائمة
    if (userPermissions.includes(action)) return true;

    // ✅ 3. التحقق الهرمي (باستخدام الأرقام)
    if (options.requiresPosition) {
      const levels = APP_CONFIG.hierarchy?.levels || [];
      const requiredPos = Number(options.requiresPosition);
      
      const userIndex = levels.indexOf(userPosition);
      const requiredIndex = levels.indexOf(requiredPos);

      // ✅ أصغر index = رتبة أعلى في الهرم
      // مثال: General Manager (10) index=1 <= Section Manager (7) index=4 ← صحيح
      if (userIndex !== -1 && requiredIndex !== -1 && userIndex <= requiredIndex) {
        return true;
      }
    }

    return false;
  };

  return { can, userPosition };
};

export default usePermissions;