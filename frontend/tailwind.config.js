/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        /* Surfaces */
        surface: {
          DEFAULT: 'var(--color-surface)',
          deep: 'var(--color-surface-deep)',
          raised: 'var(--color-raised-surface)',
        },
        graphite: 'var(--color-graphite)',

        /* Accents */
        primary: {
          DEFAULT: 'var(--color-primary)',
          pale: 'var(--color-primary-pale)',
          deep: 'var(--color-primary-deep)',
        },
        secondary: 'var(--color-secondary)',
        'border-subtle': 'var(--color-border-subtle)',

        /* Text */
        heading: 'var(--color-heading)',
        body: 'var(--color-body)',
        muted: 'var(--color-muted)',
        'dark-ink': 'var(--color-dark-ink)',

        /* State */
        danger: 'var(--color-danger)',
        success: 'var(--color-success)',
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
      fontFamily: {
        sans: ['Albert Sans', 'Avenir Next', 'Helvetica Neue', 'system-ui', 'sans-serif'],
        display: ['Alumni Sans', 'Albert Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
