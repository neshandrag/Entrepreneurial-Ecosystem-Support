import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDB, setupGracefulShutdown } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// Import routes
import authRoutes from './routes/auth';
import eventRoutes from './routes/events';
import documentRoutes from './routes/documents';
import userRoutes from './routes/users';
import startupRoutes from './routes/startups';
import mentorRoutes from './routes/mentors';
import investorRoutes from './routes/investors';
import reportRoutes from './routes/reports';
import adminRoutes from './routes/admin';
// import profileRoutes from './routes/profile'; // TODO: Decide if needed or merge with startup routes

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to PostgreSQL only
connectDB();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: process.env.CORS_CREDENTIALS === 'true' || true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// API routes (all migrated to Prisma)
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/startups', startupRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/investors', investorRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
// app.use('/api/profile', profileRoutes); // TODO: Decide if needed or merge with startup routes

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'CITBIF Backend API (PostgreSQL only)',
    version: '1.0.0',
    health: '/health',
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Setup graceful shutdown
setupGracefulShutdown();

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN}`);
});

export default app;
