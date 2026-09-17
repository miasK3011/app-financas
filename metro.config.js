const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// drizzle-kit (driver: 'expo') emits raw .sql migration files that
// src/db/migrations/migrations.js imports directly; Metro needs to treat
// .sql as a bundleable source extension (text) instead of ignoring it.
// See research.md — Decisão: Migrations do Drizzle no boot do Expo.
config.resolver.sourceExts.push('sql');

module.exports = config;
