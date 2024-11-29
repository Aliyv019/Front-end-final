/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      screens: {
        'xs': '480px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
      },
      backgroundImage: {
        'background': "url('/src/assets/img/image_1.png')",
      },
      backgroundColor:{
        'grey-custom': '#F0F2F5'
      }
    },
  },
  plugins: [],
}