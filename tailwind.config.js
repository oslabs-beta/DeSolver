module.exports = {
  content: ['./src/**/*.{html,js,jsx}'],
  purge: ['./client/**/*.html', './client/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: '#293241',
        'light-blue': '#98C1D9',
        'dark-blue': '#3D5A80',
        light: '#E0FBFC',
        orange: '#EE6C4D',
      },
    },
  },
  plugins: [],
};
