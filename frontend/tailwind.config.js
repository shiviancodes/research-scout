/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'ui-sans-serif', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace']
      },
      colors: {
        domain: {
          finance: '#2dd4bf',
          healthcare: '#f87171',
          energy: '#fbbf24',
          concepts: '#a78bfa'
        },
        surface: '#111111',
        'border-subtle': '#1e1e1e'
      }
    }
  },
  plugins: []
};
