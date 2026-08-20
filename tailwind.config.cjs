/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        ink: "#172033",
        graphite: "#344256",
        mist: "#eef4f8",
        line: "#d9e4ea",
        forest: "#176b58",
        copper: "#b5651d",
        berry: "#7a315f",
        navy: "#203a55"
      }
    }
  },
  plugins: []
};
