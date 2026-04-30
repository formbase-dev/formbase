import themer from '@tailus/themer';
import aspectRatio from '@tailwindcss/aspect-ratio';
import containerQueries from '@tailwindcss/container-queries';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';
import animate from 'tailwindcss-animate';
import plugin from 'tailwindcss/plugin';

import { type Config } from 'tailwindcss';

// Default sans-serif font stack (previously from tailwindcss/defaultTheme)
const defaultSansFonts = [
  'ui-sans-serif',
  'system-ui',
  'sans-serif',
  '"Apple Color Emoji"',
  '"Segoe UI Emoji"',
  '"Segoe UI Symbol"',
  '"Noto Color Emoji"',
];

export const tailwindPreset: Config = {
  content: ['./src/**/*.{js,jsx,ts,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', ...defaultSansFonts],
      },

      colors: ({ colors }) => ({
        primary: {
          ...colors.zinc,
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          ...colors.lime,
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        accent: {
          ...colors.pink,
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        success: colors.lime,
        danger: colors.red,
        warning: colors.yellow,
        info: colors.blue,
        gray: colors.zinc,
        white: colors.white,
        black: colors.black,
        transparent: colors.transparent,
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Chart colors
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
        // Sidebar colors
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      }),

      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
        '3xl': 'calc(var(--radius) + 12px)',
        '4xl': 'calc(var(--radius) + 16px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      gradientColorStopPositions: {
        5: '5%',
      },
    },
  },
  plugins: [
    animate,
    typography,
    forms,
    aspectRatio,
    containerQueries,
    themer({
      radius: 'smoothest',
      background: 'lighter',
      border: 'light',
      padding: 'large',
      components: {
        button: {
          rounded: '2xl',
        },
      },
    }),
    // Base UI data attribute variants
    plugin(function (api) {
      // Base UI state variants
      api.addVariant('data-open', '&[data-open]');
      api.addVariant('data-closed', '&:not([data-open])');
      api.addVariant('data-checked', '&[data-checked]');
      api.addVariant('data-unchecked', '&:not([data-checked])');
      api.addVariant('data-disabled', '&[data-disabled]');
      api.addVariant('data-highlighted', '&[data-highlighted]');
      api.addVariant('data-pressed', '&[data-pressed]');
      api.addVariant('data-selected', '&[data-selected]');
      api.addVariant('data-invalid', '&[data-invalid]');
      api.addVariant('data-valid', '&[data-valid]');
      api.addVariant('data-required', '&[data-required]');
      api.addVariant('data-readonly', '&[data-readonly]');
      api.addVariant('data-focus', '&[data-focus]');
      api.addVariant('data-focus-visible', '&[data-focus-visible]');
      api.addVariant('data-active', '&[data-active]');
      api.addVariant('data-hover', '&[data-hover]');

      // for children with data attributes
      api.addVariant('in-data-open', '[data-open] &');
      api.addVariant('in-data-closed', ':not([data-open]) &');

      // supports backdrop filter
      api.addVariant(
        'supports-backdrop-filter',
        '@supports (backdrop-filter: blur(0))',
      );
    }),
  ],
};
