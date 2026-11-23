import express from 'express';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import expressLayouts from 'express-ejs-layouts';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import db from './config/db.js';
import publicRoutes from './routes/publicRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { notFoundHandler, globalErrorHandler } from './middleware/errorMiddleware.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PostgresStore = pgSession(session);

// Trust Render's reverse proxy for secure cookies in production
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security & Body Parsing
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// View Engine Setup
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.set('layout', 'layouts/main');

// Session Configuration
app.use(
  session({
    store: new PostgresStore({ pool: db.pool, tableName: 'session' }),
    secret: process.env.SESSION_SECRET || 'fallback_dev_secret_change_in_prod',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  })
);

// Global Template Variables & Flash Messages
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.success = req.session.success || null;
  res.locals.error = req.session.error || null;
  delete req.session.success;
  delete req.session.error;
  next();
});

// Routes
app.use('/', publicRoutes);
app.use('/auth', authRoutes);
app.use('/account', userRoutes);
app.use('/admin', adminRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(globalErrorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
