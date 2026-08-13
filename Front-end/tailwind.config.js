import forms from '@tailwindcss/forms'

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        surface: "hsl(var(--surface))",
        border: "hsl(var(--border))",
        text: "hsl(var(--text))",
        "text-muted": "hsl(var(--text-muted))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          hover: "hsl(var(--primary-hover))",
        },
        status: {
          pending: "hsl(var(--status-pending))",
          "in-progress": "hsl(var(--status-in-progress))",
          completed: "hsl(var(--status-completed))",
          canceled: "hsl(var(--status-canceled))",
        },
        priority: {
          high: "hsl(var(--priority-high))",
          medium: "hsl(var(--priority-medium))",
          low: "hsl(var(--priority-low))",
        }
      },
      fontFamily: { 
        sans: ["'Tajawal'", "Inter", "system-ui", "sans-serif"],
        heading: ["'Tajawal'", "system-ui", "sans-serif"],
        body: ["'Tajawal'", "system-ui", "sans-serif"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem", fontWeight: "500" }],
        sm: ["0.875rem", { lineHeight: "1.25rem", fontWeight: "500" }],
        base: ["1rem", { lineHeight: "1.5rem", fontWeight: "400" }],
        lg: ["1.125rem", { lineHeight: "1.75rem", fontWeight: "500" }],
        xl: ["1.25rem", { lineHeight: "1.75rem", fontWeight: "600" }],
        "2xl": ["1.5rem", { lineHeight: "2rem", fontWeight: "700" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem", fontWeight: "700" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem", fontWeight: "800" }],
        display: ["2.5rem", { lineHeight: "3rem", fontWeight: "800" }],
        h1: ["2rem", { lineHeight: "2.5rem", fontWeight: "800" }],
        h2: ["1.5rem", { lineHeight: "2rem", fontWeight: "700" }],
        body: ["1rem", { lineHeight: "1.5rem" }],
        small: ["0.875rem", { lineHeight: "1.25rem" }],
      },
      borderRadius: { 
        DEFAULT: "0.5rem",
        lg: "0.875rem",
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        'xs': '0 1px 1px 0 rgba(0, 0, 0, 0.05)',
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        'color-pending': '0 0 0 3px rgba(229, 194, 58, 0.1)',
        'color-in-progress': '0 0 0 3px rgba(59, 130, 246, 0.1)',
        'color-completed': '0 0 0 3px rgba(34, 197, 94, 0.1)',
        'color-canceled': '0 0 0 3px rgba(239, 68, 68, 0.1)',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
      animation: {
        'slideIn': 'slideInUp 0.5s ease-out',
        'fadeIn': 'fadeIn 0.3s ease-out',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'bounce-subtle': 'bounce-subtle 1s ease-in-out infinite',
      },
      keyframes: {
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        }
      }
    }
  },
  plugins: [
        forms,
    // ✅ إضافة تنسيقات مخصصة لـ ReactQuill
    function({ addBase }) {
      addBase({
        '.ql-container': {
          'font-size': '0.875rem',
          'border-bottom-left-radius': '0.5rem',
          'border-bottom-right-radius': '0.5rem',
        },
        '.ql-toolbar': {
          'border-top-left-radius': '0.5rem',
          'border-top-right-radius': '0.5rem',
          'background-color': '#f8fafc',
        }
      });
    }
  ]
}