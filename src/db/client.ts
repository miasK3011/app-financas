import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

const DATABASE_NAME = 'app-financas.db';

const expoDb = openDatabaseSync(DATABASE_NAME);

export const db = drizzle(expoDb, { schema });
