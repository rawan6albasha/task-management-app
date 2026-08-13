import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export default function Button({ children, variant = 'primary', size = 'md', loading = false, className, ...props }) {
  const base = "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md active:scale-95";
  const variants = {
    primary: "bg-primary text-white hover:bg-primary-hover shadow-sm hover:shadow-lg focus:ring-primary/30",
    secondary: "bg-surface text-text border-2 border-border hover:border-primary hover:bg-primary/5 focus:ring-primary/30",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-sm hover:shadow-lg focus:ring-red-500/30",
    ghost: "bg-transparent text-text hover:bg-background border border-transparent hover:border-border focus:ring-primary/30"
  };
  const sizes = { 
    sm: "px-3 py-1.5 text-xs gap-1.5", 
    md: "px-4 py-2.5 text-sm gap-2", 
    lg: "px-6 py-3 text-base gap-2" 
  };

  return (
    <button className={twMerge(clsx(base, variants[variant], sizes[size], className))} disabled={loading} {...props}>
      {loading && <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />}
      {children}
    </button>
  );
}