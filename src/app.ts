import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env';
import { connectDB } from './config/db';
import { errorMiddleware } from './middleware/error.middleware';

// Import routes
import authRoutes from './routes/auth.routes';
import recordingRoutes from './routes/recording.routes';
import taskRoutes from './routes/task.routes';
import noteRoutes from './routes/note.routes';
import reminderRoutes from './routes/reminder.routes';

const app = express();

// Security middleware
app.use(helmet());

// CORS - allow all origins in development
app.use(
  cors({
    origin: config.nodeEnv === 'production' ? process.env.FRONTEND_URL : '*',
    credentials: true,
  })
);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/recordings', recordingRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/reminders', reminderRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use(errorMiddleware);

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    app.listen(config.port, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║                    MemoTap Backend                         ║
╠════════════════════════════════════════════════════════════╣
║  Server running on: http://localhost:${config.port}                  ║
║  Environment: ${config.nodeEnv.padEnd(43)}  ║
║                                                            ║
║  Endpoints:                                                ║
║  • POST   /api/auth/register     - Register                ║
║  • POST   /api/auth/login        - Login                   ║
║  • GET    /api/auth/me           - Current user            ║
║                                                            ║
║  • POST   /api/recordings/process - Process audio          ║
║  • GET    /api/recordings        - List recordings         ║
║  • GET    /api/recordings/:id    - Get recording           ║
║                                                            ║
║  • CRUD   /api/tasks             - Tasks                   ║
║  • CRUD   /api/notes             - Notes                   ║
║  • CRUD   /api/reminders         - Reminders               ║
╚════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
