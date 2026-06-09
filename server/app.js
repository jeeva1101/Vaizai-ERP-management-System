const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const { globalErrorHandler, AppError } = require('./middleware/error');

const app = express();

// 1) Global Middlewares
// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// CORS setup
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-branch-id']
}));

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Test Middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 2) Routes API Scaffolding
const authRouter = require('./routes/authRoutes');
const branchRouter = require('./routes/branchRoutes');
const crmRouter = require('./routes/crmRoutes');
const studentRouter = require('./routes/studentRoutes');
const employeeRouter = require('./routes/employeeRoutes');
const academicRouter = require('./routes/academicRoutes');
const financeRouter = require('./routes/financeRoutes');

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/branches', branchRouter);
app.use('/api/v1/crm', crmRouter);
app.use('/api/v1/students', studentRouter);
app.use('/api/v1/employees', employeeRouter);
app.use('/api/v1/academics', academicRouter);
app.use('/api/v1/finance', financeRouter);

// 3) Handling Unhandled Routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 4) Global Error Handling Middleware
app.use(globalErrorHandler);

module.exports = app;
