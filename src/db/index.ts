import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.ts';

const { Pool } = pg;

// Global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: pg.Pool | null | undefined;
}

export const isPostgresConfigured = (): boolean => {
  return Boolean(process.env.SQL_HOST && process.env.SQL_HOST.trim() !== '');
};

export const createPool = (): pg.Pool | null => {
  if (!isPostgresConfigured()) {
    return null;
  }

  if (!global._postgresPool) {
    try {
      global._postgresPool = new Pool({
        host: process.env.SQL_HOST,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        max: 10,
        connectionTimeoutMillis: 10000,
      });

      global._postgresPool.on('error', (err) => {
        console.warn('Postgres SQL pool warning:', err.message);
      });
    } catch (e) {
      console.warn('Failed to initialize Postgres pool:', e);
      global._postgresPool = null;
    }
  }
  return global._postgresPool;
};

export const pool = createPool();
export const db = pool ? drizzle(pool, { schema }) : null;

