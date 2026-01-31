import type { Config } from 'tailwindcss'

export default {
  content: [],
  theme: {
    extend: {
      colors: {
        // Mana colors from the game
        mana: {
          fire: '#dc2626',
          earth: '#16a34a',
          air: '#0ea5e9',
          water: '#1d4ed8',
          death: '#64748b',
          life: '#fafafa',
          arcane: '#eab308',
        },
      },
      fontFamily: {
        // Can add fantasy fonts later
        game: ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
