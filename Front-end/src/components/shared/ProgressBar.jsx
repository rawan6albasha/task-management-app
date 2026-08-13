export default function ProgressBar({ value = 0, className = '', status = 'default' }) {
  const statusColors = {
    default: 'bg-primary',
    completed: 'bg-status-completed',
    'in-progress': 'bg-status-in-progress',
    pending: 'bg-status-pending',
    canceled: 'bg-status-canceled'
  };

  const progressColor = statusColors[status] || statusColors.default;
  
  return (
    <div className={`w-full bg-border rounded-full overflow-hidden h-2.5 shadow-inner ${className}`}>
      <div 
        className={`${progressColor} h-2.5 rounded-full transition-all duration-500 ease-out shadow-lg relative`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"></div>
      </div>
    </div>
  );
}