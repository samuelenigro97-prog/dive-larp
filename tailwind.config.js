/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './assets/js/main.js'],
  safelist: [
    'text-dive-orange', 'text-dive-cyan', 'text-dive-green', 'text-dive-red', 'text-dive-purple',
    'text-dive-orange/70', 'text-dive-cyan/70', 'text-dive-green/70', 'text-dive-red/70', 'text-dive-purple/70',
    'border-dive-orange/30', 'border-dive-cyan/30', 'border-dive-green/30', 'border-dive-red/30', 'border-dive-purple/30',
    'border-dive-orange/40', 'border-dive-cyan/40', 'border-dive-green/40', 'border-dive-red/40', 'border-dive-purple/40'
  ],
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
