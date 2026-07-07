import { Pool } from 'pg';
import dotenv from 'dotenv';
import prisma from './prisma';

dotenv.config();

// PostgreSQL Configuration
const PG_CONFIG = {
  user: process.env.PG_USER || 'postgres',
  host: process.env.PG_HOST || 'localhost',
  database: process.env.PG_DATABASE || 'citbif',
  password: process.env.PG_PASSWORD || '',
  port: parseInt(process.env.PG_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

// PostgreSQL Connection Pool (used only for ensure/create DB)
export const pgPool = new Pool(PG_CONFIG);

// Ensure target PostgreSQL database exists by connecting to 'postgres' and creating it if needed
const ensureDatabaseExists = async (): Promise<void> => {
  try {
    // Try connecting to the target DB first
    const client = await pgPool.connect();
    client.release();
    return;
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    const code = error.code || '';
    const message = String(error.message || err);
    const targetDb = PG_CONFIG.database as string;

    if (code === '3D000' || message.includes('does not exist')) {
      const adminPool = new Pool({ ...PG_CONFIG, database: 'postgres' });
      try {
        const adminClient = await adminPool.connect();
        const checkRes = await adminClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [targetDb]);
        if (checkRes.rowCount === 0) {
          await adminClient.query(`CREATE DATABASE "${targetDb}"`);
          console.log(`🆕 Created PostgreSQL database: ${targetDb}`);
        }
        adminClient.release();
      } finally {
        await adminPool.end();
      }
    } else {
      throw err;
    }
  }
};

// Connect to PostgreSQL (Prisma)
export const connectPostgreSQL = async (): Promise<void> => {
  try {
    await ensureDatabaseExists();
    await prisma.$connect();
    console.log(`🐘 PostgreSQL Connected: ${PG_CONFIG.host}:${PG_CONFIG.port}`);
    console.log(`🗄️  PostgreSQL Database: ${PG_CONFIG.database}`);
  } catch (error) {
    console.error('❌ Error connecting to PostgreSQL:', error);
    throw error;
  }
};

// Combined database connection function
export const connectDB = async (): Promise<void> => {
  try {
    console.log('🔌 Connecting to PostgreSQL...');
    await connectPostgreSQL();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Setup graceful shutdown handlers (call this once in main app)
export const setupGracefulShutdown = (): void => {
  const shutdown = async () => {
    console.log('🔌 Closing database connections...');
    try {
      await prisma.$disconnect();
      await pgPool.end();
      console.log('🔌 Database connections closed');
    } catch (error) {
      console.error('Error during shutdown:', error);
    }
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

export default connectDB;
