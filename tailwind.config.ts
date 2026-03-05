import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    screens: {
      xs: '360px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
    extend: {
      colors: {
        accent: '#0ea5e9',
        'accent-2': '#6366f1',
        'accent-3': '#10b981',
        bg: '#0a0a0b',
        'bg-card': '#111113',
        'bg-card-hover': '#18181b',
        border: '#222225',
        'text-primary': '#fafafa',
        'text-muted': '#a1a1aa',
        'text-dim': '#71717a',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
