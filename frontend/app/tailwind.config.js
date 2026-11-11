import animate from "tailwindcss-animate"

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        // AyuAahar palette: forest (primary), sand (surfaces), ink (text), saffron (accent)
        forest: { 200: "#c1ecd4", 300: "#a5d0b9", 700: "#3f6653", 800: "#274e3d", 900: "#1b4332", 950: "#012d1d" },
        sand: { 50: "#fcf9f5", 100: "#f6f3ef", 200: "#e5e2de" },
        ink: { DEFAULT: "#1c1c1a", 300: "#c1c8c2", 500: "#5d6560", 700: "#414844" },
        saffron: { 200: "#ffdcc1", 300: "#ffb878", 500: "#d68c45", 600: "#a85f1c", 700: "#8c4f09" },
        danger: { DEFAULT: "#ba1a1a", soft: "#ffdad6" },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        soft: "0 8px 40px rgba(28, 28, 26, 0.04)",
        lift: "0 12px 48px rgba(28, 28, 26, 0.08)",
      },
    },
  },
  plugins: [animate],
}