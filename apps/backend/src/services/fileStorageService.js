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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMulterError = exports.FileStorageService = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default
const ALLOWED_FILE_TYPES = ((_a = process.env.ALLOWED_FILE_TYPES) === null || _a === void 0 ? void 0 : _a.split(',')) || [
    'audio/mpeg',
    'audio/wav',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
];
if (!S3_BUCKET_NAME) {
    throw new Error('S3_BUCKET_NAME must be defined in environment variables');
}
// Initialize S3 client
const s3Client = new client_s3_1.S3Client({
    region: AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
class FileStorageService {
    // Configure multer for memory storage
    static getMulterConfig() {
        const storage = multer_1.default.memoryStorage();
        const fileFilter = (req, file, cb) => {
            if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
                cb(null, true);
            }
            else {
                cb(new Error(`File type ${file.mimetype} not allowed`));
            }
        };
        return (0, multer_1.default)({
            storage,
            fileFilter,
            limits: {
                fileSize: MAX_FILE_SIZE,
            },
        });
    }
    // Upload file to S3
    static uploadFile(file_1) {
        return __awaiter(this, arguments, void 0, function* (file, folder = 'uploads') {
            try {
                const fileId = (0, uuid_1.v4)();
                const fileExtension = path_1.default.extname(file.originalname);
                const filename = `${fileId}${fileExtension}`;
                const s3Key = `${folder}/${filename}`;
                const uploadCommand = new client_s3_1.PutObjectCommand({
                    Bucket: S3_BUCKET_NAME,
                    Key: s3Key,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                    ContentDisposition: 'inline',
                    Metadata: {
                        originalName: file.originalname,
                        uploadedAt: new Date().toISOString(),
                    },
                });
                yield s3Client.send(uploadCommand);
                const url = `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`;
                return {
                    id: fileId,
                    originalName: file.originalname,
                    filename,
                    mimeType: file.mimetype,
                    size: file.size,
                    url,
                    s3Key,
                };
            }
            catch (error) {
                console.error('File upload error:', error);
                throw new Error('Failed to upload file');
            }
        });
    }
    // Upload multiple files
    static uploadFiles(files_1) {
        return __awaiter(this, arguments, void 0, function* (files, folder = 'uploads') {
            const uploadPromises = files.map(file => this.uploadFile(file, folder));
            return Promise.all(uploadPromises);
        });
    }
    // Delete file from S3
    static deleteFile(s3Key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const deleteCommand = new client_s3_1.DeleteObjectCommand({
                    Bucket: S3_BUCKET_NAME,
                    Key: s3Key,
                });
                yield s3Client.send(deleteCommand);
            }
            catch (error) {
                console.error('File deletion error:', error);
                throw new Error('Failed to delete file');
            }
        });
    }
    // Delete multiple files
    static deleteFiles(s3Keys) {
        return __awaiter(this, void 0, void 0, function* () {
            const deletePromises = s3Keys.map(key => this.deleteFile(key));
            yield Promise.all(deletePromises);
        });
    }
    // Generate signed URL for secure access
    static getSignedUrl(s3Key_1) {
        return __awaiter(this, arguments, void 0, function* (s3Key, expiresIn = 3600 // 1 hour default
        ) {
            try {
                const command = new client_s3_1.GetObjectCommand({
                    Bucket: S3_BUCKET_NAME,
                    Key: s3Key,
                });
                return yield (0, s3_request_presigner_1.getSignedUrl)(s3Client, command, { expiresIn });
            }
            catch (error) {
                console.error('Signed URL generation error:', error);
                throw new Error('Failed to generate signed URL');
            }
        });
    }
    // Get file type category
    static getFileTypeCategory(mimeType) {
        if (mimeType.startsWith('audio/'))
            return 'AUDIO';
        if (mimeType.startsWith('image/'))
            return 'IMAGE';
        if (mimeType.startsWith('video/'))
            return 'VIDEO';
        if (mimeType === 'application/pdf')
            return 'NOTATION';
        return 'NOTATION'; // Default fallback
    }
    // Validate file before upload
    static validateFile(file) {
        if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
            return {
                valid: false,
                error: `File type ${file.mimetype} not allowed. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`,
            };
        }
        if (file.size > MAX_FILE_SIZE) {
            return {
                valid: false,
                error: `File size ${file.size} exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes`,
            };
        }
        return { valid: true };
    }
    // Get file info without downloading
    static getFileInfo(s3Key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const command = new client_s3_1.GetObjectCommand({
                    Bucket: S3_BUCKET_NAME,
                    Key: s3Key,
                });
                const response = yield s3Client.send(command);
                return {
                    contentType: response.ContentType,
                    contentLength: response.ContentLength,
                    lastModified: response.LastModified,
                    metadata: response.Metadata,
                };
            }
            catch (error) {
                console.error('Get file info error:', error);
                throw new Error('Failed to get file info');
            }
        });
    }
    // Generate upload URL for direct client uploads
    static generateUploadUrl(filename_1, contentType_1) {
        return __awaiter(this, arguments, void 0, function* (filename, contentType, folder = 'uploads') {
            try {
                const fileId = (0, uuid_1.v4)();
                const fileExtension = path_1.default.extname(filename);
                const newFilename = `${fileId}${fileExtension}`;
                const s3Key = `${folder}/${newFilename}`;
                const command = new client_s3_1.PutObjectCommand({
                    Bucket: S3_BUCKET_NAME,
                    Key: s3Key,
                    ContentType: contentType,
                });
                const uploadUrl = yield (0, s3_request_presigner_1.getSignedUrl)(s3Client, command, { expiresIn: 3600 });
                return { uploadUrl, s3Key };
            }
            catch (error) {
                console.error('Generate upload URL error:', error);
                throw new Error('Failed to generate upload URL');
            }
        });
    }
}
exports.FileStorageService = FileStorageService;
// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
    if (error instanceof multer_1.default.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'File too large',
                maxSize: MAX_FILE_SIZE,
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                error: 'Too many files',
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                error: 'Unexpected file field',
            });
        }
    }
    if (error.message.includes('File type') && error.message.includes('not allowed')) {
        return res.status(400).json({
            error: error.message,
            allowedTypes: ALLOWED_FILE_TYPES,
        });
    }
    next(error);
};
exports.handleMulterError = handleMulterError;
