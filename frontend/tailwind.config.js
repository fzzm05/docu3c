/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          "light-background": "#F9f9f9",
          "light-accent": "#E9EdEB",
          "dark-background": "#131517",
          "dark-accent": "#1e1f24",
          brandcolor1: "#182C27",
          brandcolor2: "#243E36",
          brandcolor3: "#4D6A62",
        },
        fontFamily: {
          sans: [ 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        },
      },
    },
    plugins: [],
    darkMode: 'class',
};