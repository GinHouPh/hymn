"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mediaController_1 = require("../controllers/mediaController");
const auth_1 = require("../middleware/auth");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = (0, express_1.Router)();
// Rate limiting
const uploadLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 upload requests per windowMs
    message: {
        error: 'Too many upload requests, please try again later.',
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
// Upload routes - Moderator and Admin only
router.post('/upload', uploadLimiter, auth_1.authenticateToken, auth_1.requireModerator, mediaController_1.MediaController.upload.single('file'), mediaController_1.handleMulterError, mediaController_1.MediaController.uploadMediaFile);
router.post('/upload-multiple', uploadLimiter, auth_1.authenticateToken, auth_1.requireModerator, mediaController_1.MediaController.upload.array('files', 10), // Max 10 files
mediaController_1.handleMulterError, mediaController_1.MediaController.uploadMultipleMediaFiles);
// Generate upload URL for direct client uploads
router.post('/generate-upload-url', uploadLimiter, auth_1.authenticateToken, auth_1.requireModerator, mediaController_1.MediaController.generateUploadUrl);
// Public routes (with optional authentication)
router.get('/:id', generalLimiter, auth_1.optionalAuth, mediaController_1.MediaController.getMediaFile);
router.get('/:id/signed-url', generalLimiter, auth_1.optionalAuth, mediaController_1.MediaController.getSignedUrl);
router.get('/song/:songId', generalLimiter, auth_1.optionalAuth, mediaController_1.MediaController.getSongMediaFiles);
// Protected routes - Moderator and Admin only
router.delete('/:id', generalLimiter, auth_1.authenticateToken, auth_1.requireModerator, mediaController_1.MediaController.deleteMediaFile);
exports.default = router;
