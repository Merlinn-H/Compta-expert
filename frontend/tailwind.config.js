/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        income: '#16a34a',
        expense: '#dc2626',
        quebec: '#1d4ed8',
        france: '#7c3aed',
      },
    },
  },
  plugins: [],
}
