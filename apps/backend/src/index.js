"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const database_1 = require("./config/database");
const routes_1 = __importDefault(require("./routes"));
const security_1 = require("./middleware/security");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);
// Security middleware
app.use((0, helmet_1.default)(security_1.helmetOptions));
app.use((0, cors_1.default)(security_1.corsOptions));
app.use(security_1.securityHeaders);
// Request parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Request logging
if (process.env.NODE_ENV !== 'test') {
    app.use(security_1.requestLogger);
}
// Routes
app.use('/', routes_1.default);
// Error handling
app.use(security_1.notFoundHandler);
app.use(security_1.errorHandler);
// Graceful shutdown
process.on('SIGTERM', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('SIGTERM received, shutting down gracefully');
    yield (0, database_1.disconnectDatabase)();
    process.exit(0);
}));
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('SIGINT received, shutting down gracefully');
    yield (0, database_1.disconnectDatabase)();
    process.exit(0);
}));
// Start server
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Connect to database
        yield (0, database_1.connectDatabase)();
        console.log('Database connected successfully');
        // Start HTTP server
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
            console.log(`📚 API Documentation: http://localhost:${PORT}/api/v1`);
            console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
});
startServer();
exports.default = app;
