/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "fade-in": {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        "fade-out": {
          from: { opacity: 1 },
          to: { opacity: 0 },
        },
        "slide-in-from-top": {
          from: { transform: "translateY(-100%)" },
          to: { transform: "translateY(0)" },
        },
        "slide-in-from-bottom": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "slide-out-to-top": {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(-100%)" },
        },
        "slide-out-to-bottom": {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(100%)" },
        },
        "slide-in-from-left": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-in-from-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-out-to-left": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-100%)" },
        },
        "slide-out-to-right": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(100%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-in-out",
        "fade-out": "fade-out 0.2s ease-in-out",
        "slide-in-from-top": "slide-in-from-top 0.2s ease-in-out",
        "slide-in-from-bottom": "slide-in-from-bottom 0.2s ease-in-out",
        "slide-out-to-top": "slide-out-to-top 0.2s ease-in-out",
        "slide-out-to-bottom": "slide-out-to-bottom 0.2s ease-in-out",
        "slide-in-from-left": "slide-in-from-left 0.2s ease-in-out",
        "slide-in-from-right": "slide-in-from-right 0.2s ease-in-out",
        "slide-out-to-left": "slide-out-to-left 0.2s ease-in-out",
        "slide-out-to-right": "slide-out-to-right 0.2s ease-in-out",
        "in": "fade-in 200ms ease-out",
        "out": "fade-out 200ms ease-in",
        "in-bottom": "slide-in-from-bottom 0.2s ease-out",
        "in-top": "slide-in-from-top 0.2s ease-out",
        "in-right": "slide-in-from-right 0.2s ease-out",
        "in-left": "slide-in-from-left 0.2s ease-out",
        "out-bottom": "slide-out-to-bottom 0.2s ease-in",
        "out-top": "slide-out-to-top 0.2s ease-in",
        "out-right": "slide-out-to-right 0.2s ease-in",
        "out-left": "slide-out-to-left 0.2s ease-in",
      },
    },
  },
  plugins: [],
}

