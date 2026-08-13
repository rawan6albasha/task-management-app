import { useState } from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

/**
 * مكون Input قابل لإعادة الاستخدام
 */
export default function Input({
  type = "text",
  label,
  placeholder,
  value,
  onChange,
  error,
  icon: Icon,
  disabled = false,
  required = false,
  className = "",
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const actualType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-text">
          {label}
          {required && <span className="text-red-500 ms-1">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-muted pointer-events-none">
            <Icon size={18} />
          </div>
        )}

        <input
          type={actualType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full px-4 py-3 ${Icon ? "ps-12" : ""} bg-surface border-2 rounded-lg transition-all
            ${error
              ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
            }
            ${disabled ? "bg-background/50 cursor-not-allowed opacity-60" : ""}
            text-text placeholder:text-text-muted outline-none
            ${className}
          `}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
    </div>
  );
}
