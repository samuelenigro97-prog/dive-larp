/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './assets/js/main.js'],
  theme: {
    extend: {
      colors: {
        'dive-black': '#04060A',
        'dive-orange': '#FF6B00',
        'dive-purple': '#B829FF',
        'dive-cyan': '#00D4FF',
        'dive-blue': '#2979FF',
        'dive-red': '#FF2A4B',
        'dive-green': '#00FF88',
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'sans-serif'],
        orbitron: ['Orbitron', 'sans-serif'],
        mono: ['"Share Tech Mono"', 'monospace'],
        rajdhani: ['Rajdhani', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
