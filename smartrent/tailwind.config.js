/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefdf3",
          100: "#d7f9e2",
          200: "#b1f1c8",
          300: "#7fe3a8",
          400: "#4bcd84",
          500: "#26b568",
          600: "#189253",
          700: "#157444",
          800: "#155c38",
          900: "#134c30",
        },
        ink: {
          50: "#f6f7f8",
          100: "#eceef1",
          200: "#d5d9df",
          300: "#b1b9c4",
          400: "#8792a2",
          500: "#697487",
          600: "#545e70",
          700: "#454d5c",
          800: "#3b414d",
          900: "#1f2329",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
      boxShadow: {
        soft: "0 4px 24px rgba(15, 23, 42, 0.06)",
        card: "0 2px 12px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};
