/**
 * مكون Stat Card قابل لإعادة الاستخدام
 * يعرض إحصائية مع أيقونة وقيمة
 */
export default function StatCard({ 
  icon: Icon, 
  title, 
  value, 
  description,
  variant = 'default',
  className = ''
}) {
  const variants = {
    default: 'border-border',
    success: 'border-emerald-200 bg-emerald-50/50',
    warning: 'border-yellow-200 bg-yellow-50/50',
    danger: 'border-red-200 bg-red-50/50',
    info: 'border-blue-200 bg-blue-50/50',
  };

  const iconColors = {
    default: 'text-primary',
    success: 'text-emerald-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
    info: 'text-blue-600',
  };

  return (
    <div className={`bg-surface border-2 rounded-xl p-6 transition-all hover:shadow-lg ${variants[variant]} ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-muted text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-text mb-2">{value}</p>
          {description &&  <div className="text-xs text-text-muted"
      dangerouslySetInnerHTML={{ __html: description }} 
    />}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg bg-background ${iconColors[variant]}`}>
            <Icon size={24} />
          </div>
        )}
      </div>
    </div>
  );
}
