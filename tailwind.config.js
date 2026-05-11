/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(220 20% 90%)",
        input: "hsl(220 20% 90%)",
        ring: "hsl(224 71% 59%)",
        background: "hsl(220 33% 98%)",
        foreground: "hsl(225 29% 17%)",
        primary: {
          DEFAULT: "hsl(248 67% 59%)",
          foreground: "hsl(0 0% 100%)"
        },
        secondary: {
          DEFAULT: "hsl(42 100% 69%)",
          foreground: "hsl(230 28% 17%)"
        },
        muted: {
          DEFAULT: "hsl(220 18% 96%)",
          foreground: "hsl(224 14% 48%)"
        },
        accent: {
          DEFAULT: "hsl(220 24% 95%)",
          foreground: "hsl(225 29% 17%)"
        },
        card: {
          DEFAULT: "hsl(0 0% 100%)",
          foreground: "hsl(225 29% 17%)"
        }
      },
      borderRadius: {
        xl: "1.25rem",
        "2xl": "1.75rem",
        "3xl": "2rem"
      },
      boxShadow: {
        soft: "0 22px 60px rgba(27, 39, 94, 0.10)",
        card: "0 18px 45px rgba(20, 26, 60, 0.10)"
      },
      backgroundImage: {
        "hero-wash":
          "radial-gradient(circle at top left, rgba(255,215,130,0.28), transparent 28%), radial-gradient(circle at top right, rgba(123,97,255,0.12), transparent 24%), linear-gradient(180deg, #fbfcff 0%, #f4f7fb 100%)"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-4px)" }
        }
      },
      animation: {
        float: "float 4s ease-in-out infinite"
      }
    }
  },
  plugins: []
};
