/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        'sky-dark': '#0F172A',  /* For starry background */
        'sky-accent': '#38BDF8', /* For highlights and accents */
        'cloud-light': '#F1F5F9', /* For light elements */
        'flight-primary': '#3B82F6', /* Primary button/interactive color */
        'flight-success': '#10B981', /* For good reliability scores */
        'flight-warning': '#F59E0B', /* For medium reliability scores */
        'flight-danger': '#EF4444', /* For poor reliability scores */
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      textShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.25)',
      },
    }
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        '.text-shadow-sm': {
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.25)',
        },
        '.text-shadow': {
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.25)',
        },
        '.text-shadow-md': {
          textShadow: '0 4px 8px rgba(0, 0, 0, 0.25)',
        },
        '.text-shadow-none': {
          textShadow: 'none',
        },
      }
      addUtilities(newUtilities)
    }
  ]
}; 