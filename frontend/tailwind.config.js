/** @type {import('tailwindcss').Config} */
import daisyui from 'daisyui'

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}'
  ],
  darkMode: ["class"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        sm: '640px',
        md: '768px', 
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Cal Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "bounce-in": "bounce-in 0.6s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "fade-in": {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { opacity: 0, transform: "translateY(20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        "bounce-in": {
          "0%": { opacity: 0, transform: "scale(0.3)" },
          "50%": { opacity: 1, transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        light: {
          primary: "#2563eb", // Modern blue
          secondary: "#7c3aed", // Rich purple
          accent: "#06b6d4", // Vibrant cyan
          neutral: "#1e293b", // Deep slate
          "base-100": "#ffffff", // Pure white
          "base-200": "#f8fafc", // Light slate
          "base-300": "#f1f5f9", // Lighter slate
          "base-content": "#1e293b", // Dark text
          info: "#0284c7", // Sky blue
          success: "#059669", // Emerald
          warning: "#d97706", // Amber
          error: "#dc2626", // Red
        },
        dark: {
          primary: "#3b82f6", // Bright blue
          secondary: "#8b5cf6", // Bright purple
          accent: "#22d3ee", // Cyan
          neutral: "#475569", // Medium slate
          "base-100": "#0f172a", // Dark slate
          "base-200": "#1e293b", // Darker slate
          "base-300": "#334155", // Medium slate
          "base-content": "#f8fafc", // Light text
          info: "#0ea5e9", // Sky blue
          success: "#10b981", // Emerald
          warning: "#f59e0b", // Amber
          error: "#ef4444", // Red
        },
        modern: {
          primary: "#6366f1", // Indigo
          secondary: "#ec4899", // Pink
          accent: "#14b8a6", // Teal
          neutral: "#1f2937",
          "base-100": "#fafbfc",
          "base-200": "#f4f6f8",
          "base-300": "#e5e9f0",
          "base-content": "#1f2937",
          info: "#0ea5e9",
          success: "#22c55e",
          warning: "#f59e0b",
          error: "#ef4444",
        },
        luxury: {
          primary: "#7c2d12", // Rich brown
          secondary: "#be185d", // Deep pink
          accent: "#b45309", // Amber
          neutral: "#1c1917",
          "base-100": "#fefdf8",
          "base-200": "#faf7f2",
          "base-300": "#f5f1eb",
          "base-content": "#1c1917",
          info: "#0ea5e9",
          success: "#166534",
          warning: "#a16207",
          error: "#991b1b",
        },
      },
    ],
  },
}