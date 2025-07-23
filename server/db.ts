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

// Create pool with optimized configuration for production
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 2, // Reduce connection pool to prevent timeout issues
  idleTimeoutMillis: 10000, // 10 second idle timeout
  connectionTimeoutMillis: 3000, // 3 second connection timeout
  statement_timeout: 5000, // 5 second query timeout
  query_timeout: 5000, // 5 second query timeout  
  ssl: { rejectUnauthorized: false },
  allowExitOnIdle: true,
});

// Minimal error handling without excessive logging
pool.on('error', (err) => {
  console.error('DB error:', err.message);
});

export const db = drizzle({ client: pool, schema });