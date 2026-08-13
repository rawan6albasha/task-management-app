export default function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div 
      className={`bg-surface border border-border rounded-2xl shadow-sm p-6 ${hover ? 'hover:shadow-xl hover:border-primary/20 transition-all duration-300 cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}