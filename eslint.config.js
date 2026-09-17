const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    ignores: ['dist/*', 'src/db/migrations/*', '.expo/*'],
  },
  {
    // The React Compiler experiment (app.json) is disabled: this app's
    // forms (react-hook-form's `watch()`) and every data-fetching hook
    // (fetch-on-mount + track-loading) are both idiomatic patterns the
    // compiler's lint rules treat as "incompatible" or risky for
    // auto-memoization. There's no Compiler adoption planned here and
    // no concurrent-rendering/Suspense surface where the concerns these
    // rules guard against would actually bite in a single-user offline
    // app, so both are turned off project-wide rather than
    // worked around call-site by call-site.
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/incompatible-library': 'off',
    },
  },
];
