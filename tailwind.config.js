module.exports = {
  content: ['./src/**/*.{html,js,jsx}'],
  purge: ['./client/**/*.html', './client/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: '#293241',
        'light-blue': '#98C1D9',
        'light-blue-navbar': '#D5E6EF',
        'dark-blue': '#3D5A80',
        light: '#E0FBFC',
        orange: '#f39882',
      },
    },
  },
  variants: {
    // all the following default to ['responsive']
    imageRendering: ['responsive'],
  },
  plugins: [require('tailwindcss-image-rendering')],
};
