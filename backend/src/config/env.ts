import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server Configuration
  port: parseInt(process.env.PORT || '5000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/CITBIF',
    testUri: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/CITBIF_test',
  },
  
  // PostgreSQL Configuration
  postgresql: {
    user: process.env.PG_USER || 'postgres',
    host: process.env.PG_HOST || 'localhost',
    database: process.env.PG_DATABASE || 'citbif',
    password: process.env.PG_PASSWORD || '',
    port: parseInt(process.env.PG_PORT || '5432'),
    ssl: process.env.NODE_ENV === 'production',
  },
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here',
    refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'your-super-secret-refresh-key-here',
    expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '86400'), // 24 hours in seconds
    refreshExpiresIn: parseInt(process.env.JWT_REFRESH_EXPIRES_IN || '2592000000'), // 30 days in milliseconds
  },
  
  // Email Configuration
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
    from: {
      email: process.env.FROM_EMAIL || 'noreply@citbif.com',
      name: process.env.FROM_NAME || 'CITBIF Platform',
    },
  },
  
  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,jpg,jpeg,png').split(','),
  },
  
  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: process.env.CORS_CREDENTIALS === 'true' || true,
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
  
  // Admin Configuration
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@citbif.com',
    password: process.env.ADMIN_PASSWORD || 'admin123',
  },
  
  // Application URLs
  urls: {
    frontend: process.env.FRONTEND_URL || 'http://localhost:5173',
    backend: process.env.BACKEND_URL || 'http://localhost:5000',
  },
};

export default config;
