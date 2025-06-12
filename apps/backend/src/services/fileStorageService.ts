import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import multer from 'multer';
import { Request } from 'express';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME!;
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default
const ALLOWED_FILE_TYPES = process.env.ALLOWED_FILE_TYPES?.split(',') || [
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
const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export interface UploadedFile {
  id: string;
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  s3Key: string;
}

export class FileStorageService {
  // Configure multer for memory storage
  static getMulterConfig() {
    const storage = multer.memoryStorage();

    const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`File type ${file.mimetype} not allowed`));
      }
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: MAX_FILE_SIZE,
      },
    });
  }

  // Upload file to S3
  static async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads'
  ): Promise<UploadedFile> {
    try {
      const fileId = uuidv4();
      const fileExtension = path.extname(file.originalname);
      const filename = `${fileId}${fileExtension}`;
      const s3Key = `${folder}/${filename}`;

      const uploadCommand = new PutObjectCommand({
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

      await s3Client.send(uploadCommand);

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
    } catch (error) {
      console.error('File upload error:', error);
      throw new Error('Failed to upload file');
    }
  }

  // Upload multiple files
  static async uploadFiles(
    files: Express.Multer.File[],
    folder: string = 'uploads'
  ): Promise<UploadedFile[]> {
    const uploadPromises = files.map(file => this.uploadFile(file, folder));
    return Promise.all(uploadPromises);
  }

  // Delete file from S3
  static async deleteFile(s3Key: string): Promise<void> {
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: s3Key,
      });

      await s3Client.send(deleteCommand);
    } catch (error) {
      console.error('File deletion error:', error);
      throw new Error('Failed to delete file');
    }
  }

  // Delete multiple files
  static async deleteFiles(s3Keys: string[]): Promise<void> {
    const deletePromises = s3Keys.map(key => this.deleteFile(key));
    await Promise.all(deletePromises);
  }

  // Generate signed URL for secure access
  static async getSignedUrl(
    s3Key: string,
    expiresIn: number = 3600 // 1 hour default
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: s3Key,
      });

      return await getSignedUrl(s3Client, command, { expiresIn });
    } catch (error) {
      console.error('Signed URL generation error:', error);
      throw new Error('Failed to generate signed URL');
    }
  }

  // Get file type category
  static getFileTypeCategory(mimeType: string): 'AUDIO' | 'IMAGE' | 'VIDEO' | 'NOTATION' {
    if (mimeType.startsWith('audio/')) return 'AUDIO';
    if (mimeType.startsWith('image/')) return 'IMAGE';
    if (mimeType.startsWith('video/')) return 'VIDEO';
    if (mimeType === 'application/pdf') return 'NOTATION';
    return 'NOTATION'; // Default fallback
  }

  // Validate file before upload
  static validateFile(file: Express.Multer.File): { valid: boolean; error?: string } {
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
  static async getFileInfo(s3Key: string): Promise<any> {
    try {
      const command = new GetObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: s3Key,
      });

      const response = await s3Client.send(command);
      return {
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
        metadata: response.Metadata,
      };
    } catch (error) {
      console.error('Get file info error:', error);
      throw new Error('Failed to get file info');
    }
  }

  // Generate upload URL for direct client uploads
  static async generateUploadUrl(
    filename: string,
    contentType: string,
    folder: string = 'uploads'
  ): Promise<{ uploadUrl: string; s3Key: string }> {
    try {
      const fileId = uuidv4();
      const fileExtension = path.extname(filename);
      const newFilename = `${fileId}${fileExtension}`;
      const s3Key = `${folder}/${newFilename}`;

      const command = new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: s3Key,
        ContentType: contentType,
      });

      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

      return { uploadUrl, s3Key };
    } catch (error) {
      console.error('Generate upload URL error:', error);
      throw new Error('Failed to generate upload URL');
    }
  }
}

// Error handling middleware for multer
export const handleMulterError = (error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
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