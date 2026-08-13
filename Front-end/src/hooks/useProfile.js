// src/hooks/useProfile.js
import { useDispatch, useSelector } from "react-redux";
import { useCallback, useEffect } from "react";
import { 
  fetchMyProfile, 
  fetchOtherProfile, 
  updateProfileStatus,
  clearProfileMessages 
} from "../store/slices/profileSlice";

export function useProfile(profileId = null) {
  const dispatch = useDispatch();
  const { profile, loading, error, success, isOwnProfile } = useSelector((state) => state.profile);
  
  // ✅ جلب البروفايل (يحدد تلقائي إذا كان شخصي أو موظف آخر)
  const fetchProfile = useCallback(async () => {
    if (profileId) {
      await dispatch(fetchOtherProfile(profileId));
    } else {
      await dispatch(fetchMyProfile());
    }
  }, [dispatch, profileId]);
  
  // ✅ تغيير حالة الموظف (للدمن فقط)
  const toggleStatus = useCallback(async (userId, newStatus) => {
    const result = await dispatch(updateProfileStatus({ userId, accountStatus: newStatus }));
    return result.meta?.requestStatus === 'fulfilled';
  }, [dispatch]);
  
  // ✅ مسح الرسائل
  const clearMessages = useCallback(() => {
    dispatch(clearProfileMessages());
  }, [dispatch]);
  
  // ✅ جلب تلقائي عند التحميل
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);
  
  return {
    // 📊 البيانات
    profile,
    loading,
    error,
    success,
    isOwnProfile,  // ✅ مهم: هل هذا بروفايلي؟
    
    // ⚙️ الدوال
    fetchProfile,
    toggleStatus,
    clearMessages,
    
    // 🔐 الصلاحيات (من الـ SRS)
    canEdit: profile?.position?.value === 'system_admin' || isOwnProfile,
    canViewDetails: true,  // حسب الهرمية في الـ SRS
  };
}