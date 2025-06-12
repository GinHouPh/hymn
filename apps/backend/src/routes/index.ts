import { Router } from 'express';
import authRoutes from './auth';
import songRoutes from './songs';
import mediaRoutes from './media';
import userRoutes from './users';

const router = Router();

// API version prefix
const API_VERSION = '/api/v1';

// Mount routes
router.use(`${API_VERSION}/auth`, authRoutes);
router.use(`${API_VERSION}/songs`, songRoutes);
router.use(`${API_VERSION}/media`, mediaRoutes);
router.use(`${API_VERSION}/users`, userRoutes);

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

export default router;