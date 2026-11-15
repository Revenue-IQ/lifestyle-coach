/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  // Expo sets the colour scheme from app.json's userInterfaceStyle; NativeWind needs class mode for that.
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: '#FBF8F3',
        card: '#FFFFFF',
        ink: '#1F2933',
        muted: '#6B7280',
        line: '#E7E2DA',
        accent: '#2F855A',
        accentSoft: '#E6F4EC',
        warn: '#B91C1C',
        warnSoft: '#FEE2E2',
      },
      fontFamily: {
        sans: ['Geist_400Regular'],
        medium: ['Geist_500Medium'],
        semibold: ['Geist_600SemiBold'],
        bold: ['Geist_700Bold'],
      },
    },
  },
  plugins: [],
};
