"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = (0, express_1.Router)();
// Rate limiting for auth endpoints
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
        error: 'Too many authentication attempts, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
const generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Public routes
router.post('/register', authLimiter, authController_1.AuthController.register);
router.post('/login', authLimiter, authController_1.AuthController.login);
router.post('/refresh-token', authLimiter, authController_1.AuthController.refreshToken);
router.get('/verify-email', generalLimiter, authController_1.AuthController.verifyEmail);
router.post('/forgot-password', authLimiter, authController_1.AuthController.forgotPassword);
router.post('/reset-password', authLimiter, authController_1.AuthController.resetPassword);
// Protected routes
router.get('/profile', generalLimiter, auth_1.authenticateToken, auth_1.requireVerification, authController_1.AuthController.getProfile);
exports.default = router;
