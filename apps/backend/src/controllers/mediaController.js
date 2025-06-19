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
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMulterError = exports.MediaController = void 0;
const database_1 = require("../config/database");
const fileStorageService_1 = require("../services/fileStorageService");
Object.defineProperty(exports, "handleMulterError", { enumerable: true, get: function () { return fileStorageService_1.handleMulterError; } });
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const uploadSchema = zod_1.z.object({
    songId: zod_1.z.string().cuid('Invalid song ID'),
});
class MediaController {
    static uploadMediaFile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Only admins and moderators can upload media files
                if (!req.user || ![client_1.UserRole.ADMIN, client_1.UserRole.MODERATOR].includes(req.user.role)) {
                    res.status(403).json({ error: 'Insufficient permissions' });
                    return;
                }
                const { songId } = uploadSchema.parse(req.body);
                const file = req.file;
                if (!file) {
                    res.status(400).json({ error: 'No file provided' });
                    return;
                }
                // Validate file
                const validation = fileStorageService_1.FileStorageService.validateFile(file);
                if (!validation.valid) {
                    res.status(400).json({ error: validation.error });
                    return;
                }
                // Check if song exists
                const song = yield database_1.prisma.song.findUnique({
                    where: { id: songId },
                });
                if (!song) {
                    res.status(404).json({ error: 'Song not found' });
                    return;
                }
                // Upload file to S3
                const uploadedFile = yield fileStorageService_1.FileStorageService.uploadFile(file, 'media');
                const fileType = fileStorageService_1.FileStorageService.getFileTypeCategory(file.mimetype);
                // Save media file record to database
                const mediaFile = yield database_1.prisma.mediaFile.create({
                    data: {
                        songId,
                        type: fileType,
                        filename: uploadedFile.filename,
                        originalName: uploadedFile.originalName,
                        mimeType: uploadedFile.mimeType,
                        size: uploadedFile.size,
                        url: uploadedFile.url,
                        s3Key: uploadedFile.s3Key,
                    },
                });
                res.status(201).json({ mediaFile });
            }
            catch (error) {
                if (error instanceof zod_1.z.ZodError) {
                    res.status(400).json({ error: 'Validation failed', details: error.errors });
                    return;
                }
                console.error('Upload media file error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    static uploadMultipleMediaFiles(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Only admins and moderators can upload media files
                if (!req.user || ![client_1.UserRole.ADMIN, client_1.UserRole.MODERATOR].includes(req.user.role)) {
                    res.status(403).json({ error: 'Insufficient permissions' });
                    return;
                }
                const { songId } = uploadSchema.parse(req.body);
                const files = req.files;
                if (!files || files.length === 0) {
                    res.status(400).json({ error: 'No files provided' });
                    return;
                }
                // Check if song exists
                const song = yield database_1.prisma.song.findUnique({
                    where: { id: songId },
                });
                if (!song) {
                    res.status(404).json({ error: 'Song not found' });
                    return;
                }
                // Validate all files first
                for (const file of files) {
                    const validation = fileStorageService_1.FileStorageService.validateFile(file);
                    if (!validation.valid) {
                        res.status(400).json({
                            error: `File ${file.originalname}: ${validation.error}`
                        });
                        return;
                    }
                }
                // Upload all files
                const uploadedFiles = yield fileStorageService_1.FileStorageService.uploadFiles(files, 'media');
                // Create database records
                const mediaFiles = yield Promise.all(uploadedFiles.map((uploadedFile, index) => {
                    const file = files[index];
                    const fileType = fileStorageService_1.FileStorageService.getFileTypeCategory(file.mimetype);
                    return database_1.prisma.mediaFile.create({
                        data: {
                            songId,
                            type: fileType,
                            filename: uploadedFile.filename,
                            originalName: uploadedFile.originalName,
                            mimeType: uploadedFile.mimeType,
                            size: uploadedFile.size,
                            url: uploadedFile.url,
                            s3Key: uploadedFile.s3Key,
                        },
                    });
                }));
                res.status(201).json({ mediaFiles });
            }
            catch (error) {
                if (error instanceof zod_1.z.ZodError) {
                    res.status(400).json({ error: 'Validation failed', details: error.errors });
                    return;
                }
                console.error('Upload multiple media files error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    static getMediaFile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const mediaFile = yield database_1.prisma.mediaFile.findUnique({
                    where: { id },
                    include: {
                        song: {
                            select: {
                                id: true,
                                title: true,
                                isPublished: true,
                            },
                        },
                    },
                });
                if (!mediaFile) {
                    res.status(404).json({ error: 'Media file not found' });
                    return;
                }
                // Check if user can access unpublished content
                if (!mediaFile.song.isPublished && (!req.user || req.user.role === client_1.UserRole.USER)) {
                    res.status(404).json({ error: 'Media file not found' });
                    return;
                }
                res.json({ mediaFile });
            }
            catch (error) {
                console.error('Get media file error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    static getSignedUrl(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const { expiresIn = '3600' } = req.query;
                const mediaFile = yield database_1.prisma.mediaFile.findUnique({
                    where: { id },
                    include: {
                        song: {
                            select: {
                                isPublished: true,
                            },
                        },
                    },
                });
                if (!mediaFile) {
                    res.status(404).json({ error: 'Media file not found' });
                    return;
                }
                // Check if user can access unpublished content
                if (!mediaFile.song.isPublished && (!req.user || req.user.role === client_1.UserRole.USER)) {
                    res.status(404).json({ error: 'Media file not found' });
                    return;
                }
                const signedUrl = yield fileStorageService_1.FileStorageService.getSignedUrl(mediaFile.s3Key, parseInt(expiresIn));
                res.json({ signedUrl, expiresIn: parseInt(expiresIn) });
            }
            catch (error) {
                console.error('Get signed URL error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    static deleteMediaFile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Only admins and moderators can delete media files
                if (!req.user || ![client_1.UserRole.ADMIN, client_1.UserRole.MODERATOR].includes(req.user.role)) {
                    res.status(403).json({ error: 'Insufficient permissions' });
                    return;
                }
                const { id } = req.params;
                const mediaFile = yield database_1.prisma.mediaFile.findUnique({
                    where: { id },
                });
                if (!mediaFile) {
                    res.status(404).json({ error: 'Media file not found' });
                    return;
                }
                // Delete from S3 if s3Key exists
                if (mediaFile.s3Key) {
                    try {
                        yield fileStorageService_1.FileStorageService.deleteFile(mediaFile.s3Key);
                    }
                    catch (s3Error) {
                        console.error('S3 deletion error:', s3Error);
                        // Continue with database deletion even if S3 deletion fails
                    }
                }
                // Delete from database
                yield database_1.prisma.mediaFile.delete({
                    where: { id },
                });
                res.json({ message: 'Media file deleted successfully' });
            }
            catch (error) {
                console.error('Delete media file error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    static getSongMediaFiles(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { songId } = req.params;
                const { type } = req.query;
                // Check if song exists and user can access it
                const song = yield database_1.prisma.song.findUnique({
                    where: { id: songId },
                    select: { isPublished: true },
                });
                if (!song) {
                    res.status(404).json({ error: 'Song not found' });
                    return;
                }
                if (!song.isPublished && (!req.user || req.user.role === client_1.UserRole.USER)) {
                    res.status(404).json({ error: 'Song not found' });
                    return;
                }
                const where = { songId };
                if (type && ['AUDIO', 'IMAGE', 'VIDEO', 'NOTATION'].includes(type)) {
                    where.type = type;
                }
                const mediaFiles = yield database_1.prisma.mediaFile.findMany({
                    where,
                    orderBy: { createdAt: 'asc' },
                });
                res.json({ mediaFiles });
            }
            catch (error) {
                console.error('Get song media files error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    static generateUploadUrl(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Only admins and moderators can generate upload URLs
                if (!req.user || ![client_1.UserRole.ADMIN, client_1.UserRole.MODERATOR].includes(req.user.role)) {
                    res.status(403).json({ error: 'Insufficient permissions' });
                    return;
                }
                const { filename, contentType, folder = 'media' } = req.body;
                if (!filename || !contentType) {
                    res.status(400).json({ error: 'Filename and content type are required' });
                    return;
                }
                const { uploadUrl, s3Key } = yield fileStorageService_1.FileStorageService.generateUploadUrl(filename, contentType, folder);
                res.json({ uploadUrl, s3Key, expiresIn: 3600 });
            }
            catch (error) {
                console.error('Generate upload URL error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
}
exports.MediaController = MediaController;
// Configure multer middleware
MediaController.upload = fileStorageService_1.FileStorageService.getMulterConfig();
