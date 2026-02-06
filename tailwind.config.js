/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/login.ejs",
    "./views/index.ejs",
    "./views/signup.ejs",
    "./views/emailverify.ejs",
    "./assets/tailwindinput.css.{html,ejs,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {colors: {
        'bodyColor': '#0F172A',
    }},
  },
  plugins: [],
}

