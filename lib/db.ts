// Database connection utility for Neon PostgreSQL
// This file provides a reusable database client connection

import { Client } from 'pg';

let client: Client | null = null;

/**
 * Get or create a database client connection
 * Reuses existing connection if available
 */
export function getDbClient(): Client {
  if (!client) {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    client = new Client({
      connectionString: databaseUrl,
    });
  }

  return client;
}

/**
 * Execute a query with automatic connection handling
 * Use this for one-off queries
 */
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<{ rows: T[]; rowCount: number }> {
  const dbClient = getDbClient();
  
  // Connect if not already connected
  if (!dbClient._connected) {
    await dbClient.connect();
  }

  try {
    const result = await dbClient.query(text, params);
    return {
      rows: result.rows as T[],
      rowCount: result.rowCount || 0,
    };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Close the database connection
 * Call this when shutting down the application
 */
export async function closeDb(): Promise<void> {
  if (client) {
    await client.end();
    client = null;
  }
}

/**
 * Test database connection
 * Useful for health checks
 */
export async function testConnection(): Promise<boolean> {
  try {
    const dbClient = getDbClient();
    if (!dbClient._connected) {
      await dbClient.connect();
    }
    await dbClient.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}
