// src/components/guards/PermissionGuard.jsx
import { useSelector } from 'react-redux';
import usePermissions from '../../hooks/usePermissions';

export default function PermissionGuard({ 
  permission, 
  requiresPosition, 
  task, 
  fallback = null, 
  children 
}) {
  const { isAuthenticated } = useSelector(state => state.auth);
  const { can, canForTask } = usePermissions();
  
  // ✅ إذا كان هناك task، نستخدم canForTask
  const hasAccess = task 
    ? isAuthenticated && canForTask(permission, task)
    : isAuthenticated && can(permission, { requiresPosition });
  
  return hasAccess ? children : fallback;
}