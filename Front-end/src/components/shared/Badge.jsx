import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export default function Badge({ children, variant = 'default', className }) {
  const variants = {
    default: "bg-gray-100 text-gray-800",
    status_pending: "bg-status-pending/15 text-status-pending border border-status-pending/30 shadow-sm",
    status_in_progress: "bg-status-in-progress/15 text-status-in-progress border border-status-in-progress/30 shadow-sm",
    status_completed: "bg-status-completed/15 text-status-completed border border-status-completed/30 shadow-sm",
    status_canceled: "bg-status-canceled/15 text-status-canceled border border-status-canceled/30 shadow-sm",
    priority_high: "bg-priority-high/15 text-priority-high border border-priority-high/30 shadow-sm",
    priority_medium: "bg-priority-medium/15 text-priority-medium border border-priority-medium/30 shadow-sm",
    priority_low: "bg-priority-low/15 text-priority-low border border-priority-low/30 shadow-sm",
  };
  return (
    <span className={twMerge(clsx("inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:shadow-md", variants[variant], className))}>
      {children}
    </span>
  );
}