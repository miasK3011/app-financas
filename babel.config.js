module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Inlines the raw .sql migration text at compile time instead of
    // letting Babel try to parse it as JavaScript — required for
    // src/db/migrations/migrations.js's `import m0000 from './0000_....sql'`
    // (see research.md — Decisão: Migrations do Drizzle no boot do Expo).
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
