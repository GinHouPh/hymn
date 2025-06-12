import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { FileStorageService, handleMulterError } from '../services/fileStorageService';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const uploadSchema = z.object({
  songId: z.string().cuid('Invalid song ID'),
});

export class MediaController {
  // Configure multer middleware
  static upload = FileStorageService.getMulterConfig();

  static async uploadMediaFile(req: Request, res: Response): Promise<void> {
    try {
      // Only admins and moderators can upload media files
      if (!req.user || ![UserRole.ADMIN, UserRole.MODERATOR].includes(req.user.role)) {
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
      const validation = FileStorageService.validateFile(file);
      if (!validation.valid) {
        res.status(400).json({ error: validation.error });
        return;
      }

      // Check if song exists
      const song = await prisma.song.findUnique({
        where: { id: songId },
      });

      if (!song) {
        res.status(404).json({ error: 'Song not found' });
        return;
      }

      // Upload file to S3
      const uploadedFile = await FileStorageService.uploadFile(file, 'media');
      const fileType = FileStorageService.getFileTypeCategory(file.mimetype);

      // Save media file record to database
      const mediaFile = await prisma.mediaFile.create({
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
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      console.error('Upload media file error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async uploadMultipleMediaFiles(req: Request, res: Response): Promise<void> {
    try {
      // Only admins and moderators can upload media files
      if (!req.user || ![UserRole.ADMIN, UserRole.MODERATOR].includes(req.user.role)) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }

      const { songId } = uploadSchema.parse(req.body);
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res.status(400).json({ error: 'No files provided' });
        return;
      }

      // Check if song exists
      const song = await prisma.song.findUnique({
        where: { id: songId },
      });

      if (!song) {
        res.status(404).json({ error: 'Song not found' });
        return;
      }

      // Validate all files first
      for (const file of files) {
        const validation = FileStorageService.validateFile(file);
        if (!validation.valid) {
          res.status(400).json({ 
            error: `File ${file.originalname}: ${validation.error}` 
          });
          return;
        }
      }

      // Upload all files
      const uploadedFiles = await FileStorageService.uploadFiles(files, 'media');

      // Create database records
      const mediaFiles = await Promise.all(
        uploadedFiles.map((uploadedFile, index) => {
          const file = files[index];
          const fileType = FileStorageService.getFileTypeCategory(file.mimetype);

          return prisma.mediaFile.create({
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
        })
      );

      res.status(201).json({ mediaFiles });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      console.error('Upload multiple media files error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getMediaFile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const mediaFile = await prisma.mediaFile.findUnique({
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
      if (!mediaFile.song.isPublished && (!req.user || req.user.role === UserRole.USER)) {
        res.status(404).json({ error: 'Media file not found' });
        return;
      }

      res.json({ mediaFile });
    } catch (error) {
      console.error('Get media file error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getSignedUrl(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { expiresIn = '3600' } = req.query;

      const mediaFile = await prisma.mediaFile.findUnique({
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
      if (!mediaFile.song.isPublished && (!req.user || req.user.role === UserRole.USER)) {
        res.status(404).json({ error: 'Media file not found' });
        return;
      }

      const signedUrl = await FileStorageService.getSignedUrl(
        mediaFile.s3Key!,
        parseInt(expiresIn as string)
      );

      res.json({ signedUrl, expiresIn: parseInt(expiresIn as string) });
    } catch (error) {
      console.error('Get signed URL error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async deleteMediaFile(req: Request, res: Response): Promise<void> {
    try {
      // Only admins and moderators can delete media files
      if (!req.user || ![UserRole.ADMIN, UserRole.MODERATOR].includes(req.user.role)) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }

      const { id } = req.params;

      const mediaFile = await prisma.mediaFile.findUnique({
        where: { id },
      });

      if (!mediaFile) {
        res.status(404).json({ error: 'Media file not found' });
        return;
      }

      // Delete from S3 if s3Key exists
      if (mediaFile.s3Key) {
        try {
          await FileStorageService.deleteFile(mediaFile.s3Key);
        } catch (s3Error) {
          console.error('S3 deletion error:', s3Error);
          // Continue with database deletion even if S3 deletion fails
        }
      }

      // Delete from database
      await prisma.mediaFile.delete({
        where: { id },
      });

      res.json({ message: 'Media file deleted successfully' });
    } catch (error) {
      console.error('Delete media file error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getSongMediaFiles(req: Request, res: Response): Promise<void> {
    try {
      const { songId } = req.params;
      const { type } = req.query;

      // Check if song exists and user can access it
      const song = await prisma.song.findUnique({
        where: { id: songId },
        select: { isPublished: true },
      });

      if (!song) {
        res.status(404).json({ error: 'Song not found' });
        return;
      }

      if (!song.isPublished && (!req.user || req.user.role === UserRole.USER)) {
        res.status(404).json({ error: 'Song not found' });
        return;
      }

      const where: any = { songId };
      if (type && ['AUDIO', 'IMAGE', 'VIDEO', 'NOTATION'].includes(type as string)) {
        where.type = type;
      }

      const mediaFiles = await prisma.mediaFile.findMany({
        where,
        orderBy: { createdAt: 'asc' },
      });

      res.json({ mediaFiles });
    } catch (error) {
      console.error('Get song media files error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async generateUploadUrl(req: Request, res: Response): Promise<void> {
    try {
      // Only admins and moderators can generate upload URLs
      if (!req.user || ![UserRole.ADMIN, UserRole.MODERATOR].includes(req.user.role)) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }

      const { filename, contentType, folder = 'media' } = req.body;

      if (!filename || !contentType) {
        res.status(400).json({ error: 'Filename and content type are required' });
        return;
      }

      const { uploadUrl, s3Key } = await FileStorageService.generateUploadUrl(
        filename,
        contentType,
        folder
      );

      res.json({ uploadUrl, s3Key, expiresIn: 3600 });
    } catch (error) {
      console.error('Generate upload URL error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

// Export multer error handler
export { handleMulterError };