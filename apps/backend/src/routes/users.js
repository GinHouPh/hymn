"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = (0, express_1.Router)();
// Rate limiting
const generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
const favoritesLimiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20, // Limit each IP to 20 favorites operations per minute
    message: {
        error: 'Too many favorites requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// All routes require authentication and email verification
router.use(auth_1.authenticateToken);
router.use(auth_1.requireVerification);
// User preferences routes
router.get('/preferences', generalLimiter, userController_1.UserController.getUserPreferences);
router.put('/preferences', generalLimiter, userController_1.UserController.updateUserPreferences);
// Favorites routes
router.get('/favorites', generalLimiter, userController_1.UserController.getFavorites);
router.post('/favorites/:songId', favoritesLimiter, userController_1.UserController.addToFavorites);
router.delete('/favorites/:songId', favoritesLimiter, userController_1.UserController.removeFromFavorites);
router.get('/favorites/:songId/status', generalLimiter, userController_1.UserController.checkFavoriteStatus);
// View history routes
router.get('/history', generalLimiter, userController_1.UserController.getViewHistory);
router.delete('/history', generalLimiter, userController_1.UserController.clearViewHistory);
// User stats
router.get('/stats', generalLimiter, userController_1.UserController.getUserStats);
exports.default = router;
