/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        blue: {
          950: '#172554',
        },
        gold: {
          300: '#fcd34d',
          400: '#facc15',
          500: '#d4af37',
          600: '#b8941e',
          700: '#9d7a1a',
        },
      },
    },
  },
  plugins: [],
}

