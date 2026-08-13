import usePermissions from '../hooks/usePermissions';
export function PermissionTestButtons() {
  const { can, role } = usePermissions();
  const perms = ['task:create', 'task:edit', 'project:create', 'user:manage'];
  return (
    <div className="p-4 bg-surface border border-border rounded-lg mb-6">
      <h3 className="font-bold text-sm mb-3">🔐 اختبار الصلاحيات (الدور: {role})</h3>
      <div className="flex flex-wrap gap-2">
        {perms.map(p => (
          <span key={p} className={`px-3 py-1 rounded text-xs font-medium border ${can(p) ? 'bg-success/10 text-success border-success' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
            {p} {can(p) ? '✅' : ''}
          </span>
        ))}
      </div>
    </div>
  );
}