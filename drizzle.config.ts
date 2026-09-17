import type { Config } from 'drizzle-kit';

/**
 * `driver: 'expo'` is required so drizzle-kit emits migrations in the
 * shape `drizzle-orm/expo-sqlite/migrator` expects (a journal + raw SQL
 * files bundled as a Metro asset — see research.md, "Migrations do
 * Drizzle no boot do Expo").
 */
export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'sqlite',
  driver: 'expo',
} satisfies Config;
