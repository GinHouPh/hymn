import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticateToken, requireVerification } from '../middleware/auth';
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

const favoritesLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 favorites operations per minute
  message: {
    error: 'Too many favorites requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// All routes require authentication and email verification
router.use(authenticateToken);
router.use(requireVerification);

// User preferences routes
router.get('/preferences', generalLimiter, UserController.getUserPreferences);
router.put('/preferences', generalLimiter, UserController.updateUserPreferences);

// Favorites routes
router.get('/favorites', generalLimiter, UserController.getFavorites);
router.post('/favorites/:songId', favoritesLimiter, UserController.addToFavorites);
router.delete('/favorites/:songId', favoritesLimiter, UserController.removeFromFavorites);
router.get('/favorites/:songId/status', generalLimiter, UserController.checkFavoriteStatus);

// View history routes
router.get('/history', generalLimiter, UserController.getViewHistory);
router.delete('/history', generalLimiter, UserController.clearViewHistory);

// User stats
router.get('/stats', generalLimiter, UserController.getUserStats);

export default router;