import { Router } from 'express';
import { SongController } from '../controllers/songController';
import { authenticateToken, requireModerator, requireAdmin, optionalAuth } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 search requests per minute
  message: {
    error: 'Too many search requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes (with optional authentication)
router.get('/', generalLimiter, optionalAuth, SongController.getSongs);
router.get('/search', searchLimiter, optionalAuth, SongController.searchSongs);
router.get('/categories', generalLimiter, optionalAuth, SongController.getSongCategories);
router.get('/:id', generalLimiter, optionalAuth, SongController.getSongById);

// Protected routes - Moderator and Admin only
router.post('/', generalLimiter, authenticateToken, requireModerator, SongController.createSong);
router.put('/:id', generalLimiter, authenticateToken, requireModerator, SongController.updateSong);

// Admin only routes
router.delete('/:id', generalLimiter, authenticateToken, requireAdmin, SongController.deleteSong);

export default router;