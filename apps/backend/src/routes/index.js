"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("./auth"));
const songs_1 = __importDefault(require("./songs"));
const media_1 = __importDefault(require("./media"));
const users_1 = __importDefault(require("./users"));
const router = (0, express_1.Router)();
// API version prefix
const API_VERSION = '/api/v1';
// Mount routes
router.use(`${API_VERSION}/auth`, auth_1.default);
router.use(`${API_VERSION}/songs`, songs_1.default);
router.use(`${API_VERSION}/media`, media_1.default);
router.use(`${API_VERSION}/users`, users_1.default);
// Health check route
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
    });
});
// API documentation route
router.get(`${API_VERSION}`, (req, res) => {
    res.json({
        message: 'Hymnal App API v1',
        version: '1.0.0',
        documentation: {
            auth: `${API_VERSION}/auth`,
            songs: `${API_VERSION}/songs`,
            media: `${API_VERSION}/media`,
            users: `${API_VERSION}/users`,
        },
        endpoints: {
            auth: {
                'POST /auth/register': 'Register a new user',
                'POST /auth/login': 'Login user',
                'POST /auth/refresh-token': 'Refresh access token',
                'GET /auth/verify-email': 'Verify email address',
                'POST /auth/forgot-password': 'Request password reset',
                'POST /auth/reset-password': 'Reset password',
                'GET /auth/profile': 'Get user profile (authenticated)',
            },
            songs: {
                'GET /songs': 'Get songs with filtering and pagination',
                'GET /songs/search': 'Search songs',
                'GET /songs/categories': 'Get song categories',
                'GET /songs/:id': 'Get song by ID',
                'POST /songs': 'Create song (moderator+)',
                'PUT /songs/:id': 'Update song (moderator+)',
                'DELETE /songs/:id': 'Delete song (admin only)',
            },
            media: {
                'POST /media/upload': 'Upload media file (moderator+)',
                'POST /media/upload-multiple': 'Upload multiple media files (moderator+)',
                'POST /media/generate-upload-url': 'Generate upload URL (moderator+)',
                'GET /media/:id': 'Get media file info',
                'GET /media/:id/signed-url': 'Get signed URL for media file',
                'GET /media/song/:songId': 'Get media files for song',
                'DELETE /media/:id': 'Delete media file (moderator+)',
            },
            users: {
                'GET /users/preferences': 'Get user preferences (authenticated)',
                'PUT /users/preferences': 'Update user preferences (authenticated)',
                'GET /users/favorites': 'Get user favorites (authenticated)',
                'POST /users/favorites/:songId': 'Add song to favorites (authenticated)',
                'DELETE /users/favorites/:songId': 'Remove song from favorites (authenticated)',
                'GET /users/favorites/:songId/status': 'Check if song is favorited (authenticated)',
                'GET /users/history': 'Get view history (authenticated)',
                'DELETE /users/history': 'Clear view history (authenticated)',
                'GET /users/stats': 'Get user statistics (authenticated)',
            },
        },
    });
});
exports.default = router;
