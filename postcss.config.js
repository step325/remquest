// Tailwind v4: un solo plugin. Gestisce gia' @import e i prefissi vendor,
// quindi postcss-import e autoprefixer non servono piu'.
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
