/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e0e7ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#1e40af', // Dark Blue (Main Interaction)
          700: '#1e3a8a',
          800: '#172554', // Very Dark Blue
          900: '#0f172a', // Almost Black Blue
        },
        neutral: {
          50: '#ffffff', // Main Background (White)
          100: '#f8fafc', // Secondary Background (Very Light Gray)
          200: '#f1f5f9', // Component Background
          300: '#e2e8f0', // Borders
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155', // Secondary Text
          800: '#1e293b', // Primary Text
          900: '#020617', // Contrast Text (Black)
        },
        accent: {
          yellow: '#FFD700', // Deep Yellow (Gold)
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
