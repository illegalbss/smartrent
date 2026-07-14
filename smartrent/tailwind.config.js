/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        // RentaFlow deep maroon — brand-700 is the exact spec hex (#5C1010);
        // brand-500 is a lighter, more legible maroon for buttons/links.
        brand: {
          50: "#fbeaea",
          100: "#f3cfcf",
          200: "#e6a3a3",
          300: "#d57272",
          400: "#bd4444",
          500: "#8f2323",
          600: "#741818",
          700: "#5c1010",
          800: "#4a0d0d",
          900: "#3a0a0a",
          950: "#240606",
        },
        // RentaFlow gold accent — gold-500 is the exact spec hex (#D4A017).
        gold: {
          50: "#fdf8ec",
          100: "#faefce",
          200: "#f3dd9d",
          300: "#eac765",
          400: "#dfb03d",
          500: "#d4a017",
          600: "#b3830f",
          700: "#8c670c",
          800: "#6b4f0a",
          900: "#4a3707",
          950: "#2e2204",
        },
        ink: {
          50: "#f9fafb",
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
