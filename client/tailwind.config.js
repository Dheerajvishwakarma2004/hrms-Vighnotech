import defaultTheme from 'tailwindcss/defaultTheme';
import plugin from 'tailwindcss/plugin';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Warm neutrals replace Tailwind's cool slate everywhere (text-slate-*, bg-slate-*, border-slate-*).
        slate: {
          50: '#faf8f5',
          100: '#f4f1ec',
          200: '#e9e4dd',
          300: '#d8d1c7',
          400: '#a09889',
          500: '#766e63',
          600: '#5a534a',
          700: '#443e37',
          800: '#2d2925',
          900: '#1e1b18',
          950: '#12100e',
        },
        // One confident accent: deep teal.
        primary: {
          50: '#effaf8',
          100: '#d6f2ee',
          200: '#b0e5de',
          300: '#7fd0c8',
          400: '#47b4ab',
          500: '#2a9a92',
          600: '#1b7f79',
          700: '#186762',
          800: '#175350',
          900: '#164643',
          950: '#082b2a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', ...defaultTheme.fontFamily.sans],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', ...defaultTheme.fontFamily.sans],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(45 35 20 / 0.04), 0 2px 8px -2px rgb(45 35 20 / 0.06)',
        popover: '0 12px 40px -12px rgb(45 35 20 / 0.28), 0 6px 16px -8px rgb(45 35 20 / 0.16)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'scale-in': {
          from: { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'slide-in-left': { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'scale-in': 'scale-in 180ms ease-out',
        'slide-in-left': 'slide-in-left 200ms ease-out',
      },
    },
  },
  plugins: [
    // `in-table:` styles cell content only when DataTable renders the table layout (not the card layout),
    // e.g. `in-table:max-w-[12rem] in-table:truncate`.
    plugin(({ addVariant }) => addVariant('in-table', 'table &')),
  ],
};
