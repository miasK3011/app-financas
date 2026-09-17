const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    ignores: ['dist/*', 'src/db/migrations/*', '.expo/*'],
  },
  {
    rules: {
      // `src/hooks/**` follows the standard "fetch on mount, track
      // loading" pattern (setLoading(true) then an async repository
      // call) throughout this app — there's no React Compiler adoption
      // planned and no concurrent-rendering/Suspense tree where the
      // cascading-render concern this rule guards against would apply
      // to a single-user offline app.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
];
