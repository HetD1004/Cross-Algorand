/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Binance Brand Colors
        primary: {
          50: '#fef9e7',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#F0B90B', // Binance Gold - Main brand color
          500: '#F0B90B',
          600: '#d39e09',
          700: '#b68507',
          800: '#946d06',
          900: '#7a5a05',
          950: '#4a3603',
        },
        // Binance Dark Theme Backgrounds
        background: {
          DEFAULT: '#0B0E11', // Binance dark background
          dark: '#0B0E11',
          light: '#f5f5f5',
        },
        surface: {
          DEFAULT: '#1E2329', // Binance card background
          dark: '#1E2329',
          hover: '#2B3139', // Binance hover state
          light: '#ffffff',
        },
        // Binance Status Colors
        status: {
          active: '#0ECB81', // Binance green
          completed: '#848E9C', // Binance muted gray
          upcoming: '#F0B90B', // Binance yellow
        },
        // Trading colors (For/Against voting)
        success: '#0ECB81', // Binance buy/green
        error: '#F6465D', // Binance sell/red
        // Text colors
        text: {
          primary: '#EAECEF', // Binance light text
          secondary: '#B7BDC6', // Binance muted text
          muted: '#848E9C', // Binance disabled text
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 12px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 6px 16px rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        card: '16px',
        button: '8px',
      },
    },
  },
  plugins: [],
};
