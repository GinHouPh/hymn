"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const songController_1 = require("../controllers/songController");
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
const searchLimiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // Limit each IP to 30 search requests per minute
    message: {
        error: 'Too many search requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Public routes (with optional authentication)
router.get('/', generalLimiter, auth_1.optionalAuth, songController_1.SongController.getSongs);
router.get('/search', searchLimiter, auth_1.optionalAuth, songController_1.SongController.searchSongs);
router.get('/categories', generalLimiter, auth_1.optionalAuth, songController_1.SongController.getSongCategories);
router.get('/:id', generalLimiter, auth_1.optionalAuth, songController_1.SongController.getSongById);
// Protected routes - Moderator and Admin only
router.post('/', generalLimiter, auth_1.authenticateToken, auth_1.requireModerator, songController_1.SongController.createSong);
router.put('/:id', generalLimiter, auth_1.authenticateToken, auth_1.requireModerator, songController_1.SongController.updateSong);
// Admin only routes
router.delete('/:id', generalLimiter, auth_1.authenticateToken, auth_1.requireAdmin, songController_1.SongController.deleteSong);
exports.default = router;
