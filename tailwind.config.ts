import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dbe8ff',
          500: '#4f74e3',
          600: '#3c5fd1',
          700: '#304bb0'
        }
      }
    }
  },
  plugins: []
}
export default config
