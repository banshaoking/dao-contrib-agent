/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // New design system colors
        primary: {
          DEFAULT: '#7C3AED',
          hover: '#6D28D9',
        },
        secondary: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
        },
        success: {
          DEFAULT: '#22C55E',
          hover: '#16A34A',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
