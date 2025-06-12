import { Router } from 'express';
import { MediaController, handleMulterError } from '../controllers/mediaController';
import { authenticateToken, requireModerator, optionalAuth } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 upload requests per windowMs
  message: {
    error: 'Too many upload requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Upload routes - Moderator and Admin only
router.post(
  '/upload',
  uploadLimiter,
  authenticateToken,
  requireModerator,
  MediaController.upload.single('file'),
  handleMulterError,
  MediaController.uploadMediaFile
);

router.post(
  '/upload-multiple',
  uploadLimiter,
  authenticateToken,
  requireModerator,
  MediaController.upload.array('files', 10), // Max 10 files
  handleMulterError,
  MediaController.uploadMultipleMediaFiles
);

// Generate upload URL for direct client uploads
router.post(
  '/generate-upload-url',
  uploadLimiter,
  authenticateToken,
  requireModerator,
  MediaController.generateUploadUrl
);

// Public routes (with optional authentication)
router.get('/:id', generalLimiter, optionalAuth, MediaController.getMediaFile);
router.get('/:id/signed-url', generalLimiter, optionalAuth, MediaController.getSignedUrl);
router.get('/song/:songId', generalLimiter, optionalAuth, MediaController.getSongMediaFiles);

// Protected routes - Moderator and Admin only
router.delete('/:id', generalLimiter, authenticateToken, requireModerator, MediaController.deleteMediaFile);

export default router;