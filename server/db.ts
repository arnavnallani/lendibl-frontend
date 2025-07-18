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

// Create pool with lightweight configuration for deployment
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 3, // Minimal pool size for deployment
  idleTimeoutMillis: 30000, // Longer idle timeout
  connectionTimeoutMillis: 10000, // Longer connection timeout
  ssl: { rejectUnauthorized: false },
  allowExitOnIdle: true, // Allow clean shutdown
});

// Minimal error handling without excessive logging
pool.on('error', (err) => {
  console.error('DB error:', err.message);
});

export const db = drizzle({ client: pool, schema });