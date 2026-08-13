// src/hooks/useAdmin.js
import { useDispatch, useSelector } from "react-redux";
import { useCallback, useEffect, useMemo, useState } from "react";
import { 
  fetchAllAdminUsers, 
  toggleUserStatus, 
  clearMessages,
  getUserImageUrl 
} from "../store/slices/adminSlice";

export function useAdmin() {
  const dispatch = useDispatch();
  const { users, loading, error, success } = useSelector((state) => state.admin);
  
  const [statusFilter, setStatusFilter] = useState("all"); // ✅ يدعم: 'all' | 'active' | 'inactive' | 'banned'
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAllUsers = useCallback(async () => {
    await dispatch(fetchAllAdminUsers());
  }, [dispatch]);

  const updateUserStatus = useCallback(async (userId, targetStatus) => {
    try {
      // ✅ نرسل الحالة كنص: 'active' | 'inactive' | 'banned'
      const result = await dispatch(toggleUserStatus({ 
        userId, 
        accountStatus: String(targetStatus) 
      }));
      return result.meta?.requestStatus === 'fulfilled';
    } catch (err) {
      console.error('❌ Toggle error:', err);
      return false;
    }
  }, [dispatch]);

  const allUsers = useMemo(() => [
    ...(users?.['active users'] || []),
    ...(users?.['deactive users'] || [])
  ], [users?.['active users'], users?.['deactive users']]);

  // 🔍 فلترة مزدوجة محدثة للقيم النصية
  const filteredUsers = useMemo(() => {
    let result = allUsers;
    
    // ✅ فلترة حسب الحالة النصية
    if (statusFilter === 'active') {
      result = result.filter(u => u.account_status === 'active');
    } else if (statusFilter === 'inactive') {
      result = result.filter(u => u.account_status === 'inactive');
    } else if (statusFilter === 'banned') {
      result = result.filter(u => u.account_status === 'banned');
    }
    // إذا كان 'all' أو 'deactive' → نعرض غير النشطين + المحظورين
    
    // 🔍 فلترة البحث
    if (searchTerm?.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(u => 
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.position?.ar_name?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [allUsers, statusFilter, searchTerm]);

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  return {
    allUsers,
    filteredUsers,
    loading,
    error,
    success,
    fetchAllUsers,
    updateUserStatus,
    clearMessages: () => dispatch(clearMessages()),
    getUserImageUrl,
    statusFilter,
    setStatusFilter,
    searchTerm,
    setSearchTerm,
  };
}