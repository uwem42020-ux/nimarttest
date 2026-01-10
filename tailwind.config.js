/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Add this for dark mode support
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#008751',
          50: '#f0f9f6',
          100: '#dbf1e9',
          200: '#b9e2d3',
          300: '#8accb6',
          400: '#54af95',
          500: '#008751',
          600: '#007045',
          700: '#005a38',
          800: '#00482e',
          900: '#003c26',
        },
        secondary: {
          DEFAULT: '#FF6B35',
          50: '#fff5f0',
          100: '#ffe9db',
          200: '#ffceb6',
          300: '#ffaa82',
          400: '#ff7b4d',
          500: '#FF6B35',
          600: '#ed4f1b',
          700: '#c93d14',
          800: '#a63315',
          900: '#872d17',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-slow': 'pulse 3s infinite',
        'float': 'float 6s ease-in-out infinite',
        'move-right': 'moveRight 8s linear infinite',
        'move-left': 'moveLeft 8s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        moveRight: {
          '0%': { transform: 'translateX(-100px)' },
          '100%': { transform: 'translateX(100vw)' },
        },
        moveLeft: {
          '0%': { transform: 'translateX(100vw)' },
          '100%': { transform: 'translateX(-100px)' },
        },
      },
      // Add safe area utilities
      padding: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      margin: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      height: {
        'screen-dynamic': '100dvh', // Use dynamic viewport height for mobile
        'screen-safe': 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
      },
      minHeight: {
        'screen-dynamic': '100dvh',
        'screen-safe': 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
      },
      maxHeight: {
        'screen-dynamic': '100dvh',
        'screen-safe': 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
      },
    },
  },
  plugins: [],
}