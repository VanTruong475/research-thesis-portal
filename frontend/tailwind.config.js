/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        /* Surfaces */
        lacquer: {
          DEFAULT: 'var(--color-lacquer)',
          deep: 'var(--color-lacquer-deep)',
          raised: 'var(--color-raised-lacquer)',
        },
        graphite: 'var(--color-graphite)',

        /* Accents */
        kinpaku: {
          DEFAULT: 'var(--color-kinpaku)',
          pale: 'var(--color-kinpaku-pale)',
          deep: 'var(--color-kinpaku-deep)',
        },
        patina: 'var(--color-patina)',
        hairline: 'var(--color-hairline)',

        /* Text */
        champagne: 'var(--color-champagne)',
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
