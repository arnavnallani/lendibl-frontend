import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon for serverless environment with fallback handling
try {
  neonConfig.webSocketConstructor = ws;
  neonConfig.useSecureWebSocket = true;
  neonConfig.pipelineConnect = false;
  neonConfig.pipelineTLS = false;
} catch (configError) {
  console.warn('Neon config warning:', configError);
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create pool with more resilient configuration
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 5, // Reduced pool size
  idleTimeoutMillis: 10000, // Shorter idle timeout
  connectionTimeoutMillis: 5000, // Increased timeout
  ssl: { rejectUnauthorized: false },
  allowExitOnIdle: false,
});

// Handle pool errors gracefully
pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

// Handle client connection errors
pool.on('connect', (client) => {
  console.log('Database client connected');
  client.on('error', (err) => {
    console.error('Database client error:', err);
  });
});

export const db = drizzle({ client: pool, schema });