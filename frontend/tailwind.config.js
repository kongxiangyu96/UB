/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0f0f0f',
          card: '#1a1a1a',
          border: '#2a2a2a',
          hover: '#242424',
        },
        accent: {
          DEFAULT: '#7c6af7',
          hover: '#6b5ce7',
        },
      },
    },
  },
  plugins: [],
}
