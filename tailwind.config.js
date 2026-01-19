/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./{App.tsx,index.tsx,components/**/*.tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        serif: ['Outfit', 'sans-serif'], // Use Outfit everywhere for the geometric look
      },
      boxShadow: {
        'soft': '0 4px 40px -2px rgba(0, 0, 0, 0.05)',
        'float': '0 10px 40px -10px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'slide-up': 'slideUp 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}