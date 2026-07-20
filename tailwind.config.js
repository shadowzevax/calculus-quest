/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#14202E',
        blueprint: '#1B3A5C',
        'blueprint-line': '#3E6A8F',
        paper: '#FBF7EE',
        coral: '#FF6B4A',
        gold: '#F0A93C',
        teal: '#3FBFAD',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      backgroundImage: {
        'grid-dark':
          'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
        'grid-light':
          'linear-gradient(rgba(27,58,92,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(27,58,92,0.06) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '22px 22px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
