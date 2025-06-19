"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityHeaders = exports.notFoundHandler = exports.errorHandler = exports.requestLogger = exports.helmetOptions = exports.corsOptions = void 0;
// CORS configuration
exports.corsOptions = {
    origin: function (origin, callback) {
        var _a;
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        const allowedOrigins = ((_a = process.env.CORS_ORIGIN) === null || _a === void 0 ? void 0 : _a.split(',')) || ['http://localhost:3000', 'http://localhost:5173'];
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
// Helmet configuration for security headers
exports.helmetOptions = {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'", 'https:'],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false,
};
// Request logging middleware
const requestLogger = (req, res, next) => {
    const start = Date.now();
    const { method, url, ip } = req;
    res.on('finish', () => {
        const duration = Date.now() - start;
        const { statusCode } = res;
        console.log(`${new Date().toISOString()} - ${method} ${url} - ${statusCode} - ${duration}ms - ${ip}`);
    });
    next();
};
exports.requestLogger = requestLogger;
// Error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    // Handle specific error types
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            message: err.message,
            details: err.details || null,
        });
    }
    if (err.name === 'UnauthorizedError' || err.message === 'jwt malformed') {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or expired token',
        });
    }
    if (err.code === 'P2002') { // Prisma unique constraint error
        return res.status(409).json({
            error: 'Conflict',
            message: 'Resource already exists',
        });
    }
    if (err.code === 'P2025') { // Prisma record not found error
        return res.status(404).json({
            error: 'Not Found',
            message: 'Resource not found',
        });
    }
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'CORS policy violation',
        });
    }
    // Default error response
    const statusCode = err.statusCode || err.status || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Internal Server Error'
        : err.message || 'Something went wrong';
    res.status(statusCode).json(Object.assign({ error: 'Server Error', message }, (process.env.NODE_ENV === 'development' && { stack: err.stack })));
};
exports.errorHandler = errorHandler;
// 404 handler
const notFoundHandler = (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.url} not found`,
    });
};
exports.notFoundHandler = notFoundHandler;
// Security headers middleware
const securityHeaders = (req, res, next) => {
    // Remove X-Powered-By header
    res.removeHeader('X-Powered-By');
    // Add custom security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
};
exports.securityHeaders = securityHeaders;
