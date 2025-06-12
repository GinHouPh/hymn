import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { z } from 'zod';
import { UserRole } from '@prisma/client';

// Validation schemas
const createSongSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  number: z.number().int().positive().optional(),
  lyrics: z.string().min(1, 'Lyrics are required'),
  composer: z.string().max(100).optional(),
  author: z.string().max(100).optional(),
  category: z.string().max(50).optional(),
  tags: z.array(z.string()).default([]),
  language: z.string().default('en'),
  isPublished: z.boolean().default(false),
});

const updateSongSchema = createSongSchema.partial();

const songQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1),
  limit: z.string().transform(val => Math.min(parseInt(val) || 10, 100)),
  search: z.string().optional(),
  category: z.string().optional(),
  language: z.string().optional(),
  tags: z.string().optional(),
  composer: z.string().optional(),
  author: z.string().optional(),
  sortBy: z.enum(['title', 'number', 'createdAt', 'updatedAt']).default('title'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  published: z.string().transform(val => val === 'true' ? true : val === 'false' ? false : undefined).optional(),
});

export class SongController {
  static async createSong(req: Request, res: Response): Promise<void> {
    try {
      // Only admins and moderators can create songs
      if (!req.user || ![UserRole.ADMIN, UserRole.MODERATOR].includes(req.user.role)) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }

      const validatedData = createSongSchema.parse(req.body);

      // Check if song number already exists (if provided)
      if (validatedData.number) {
        const existingSong = await prisma.song.findFirst({
          where: { number: validatedData.number },
        });

        if (existingSong) {
          res.status(400).json({ error: 'Song number already exists' });
          return;
        }
      }

      const song = await prisma.song.create({
        data: validatedData,
        include: {
          mediaFiles: true,
          _count: {
            select: {
              favorites: true,
              viewHistory: true,
            },
          },
        },
      });

      res.status(201).json({ song });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      console.error('Create song error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getSongs(req: Request, res: Response): Promise<void> {
    try {
      const query = songQuerySchema.parse(req.query);
      const { page, limit, search, category, language, tags, composer, author, sortBy, sortOrder, published } = query;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      // Only show published songs to regular users
      if (!req.user || req.user.role === UserRole.USER) {
        where.isPublished = true;
      } else if (published !== undefined) {
        where.isPublished = published;
      }

      // Search functionality
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { lyrics: { contains: search, mode: 'insensitive' } },
          { composer: { contains: search, mode: 'insensitive' } },
          { author: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Filters
      if (category) where.category = { contains: category, mode: 'insensitive' };
      if (language) where.language = language;
      if (composer) where.composer = { contains: composer, mode: 'insensitive' };
      if (author) where.author = { contains: author, mode: 'insensitive' };
      if (tags) {
        const tagArray = tags.split(',').map(tag => tag.trim());
        where.tags = { hasSome: tagArray };
      }

      // Get songs with pagination
      const [songs, total] = await Promise.all([
        prisma.song.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            mediaFiles: {
              select: {
                id: true,
                type: true,
                filename: true,
                url: true,
              },
            },
            _count: {
              select: {
                favorites: true,
                viewHistory: true,
              },
            },
          },
        }),
        prisma.song.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
        songs,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      console.error('Get songs error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getSongById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const song = await prisma.song.findUnique({
        where: { id },
        include: {
          mediaFiles: true,
          _count: {
            select: {
              favorites: true,
              viewHistory: true,
            },
          },
        },
      });

      if (!song) {
        res.status(404).json({ error: 'Song not found' });
        return;
      }

      // Check if user can view unpublished songs
      if (!song.isPublished && (!req.user || req.user.role === UserRole.USER)) {
        res.status(404).json({ error: 'Song not found' });
        return;
      }

      // Record view history if user is authenticated
      if (req.user) {
        await prisma.viewHistory.create({
          data: {
            userId: req.user.id,
            songId: song.id,
          },
        }).catch(() => {
          // Ignore duplicate view errors
        });
      }

      res.json({ song });
    } catch (error) {
      console.error('Get song by ID error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateSong(req: Request, res: Response): Promise<void> {
    try {
      // Only admins and moderators can update songs
      if (!req.user || ![UserRole.ADMIN, UserRole.MODERATOR].includes(req.user.role)) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }

      const { id } = req.params;
      const validatedData = updateSongSchema.parse(req.body);

      // Check if song exists
      const existingSong = await prisma.song.findUnique({
        where: { id },
      });

      if (!existingSong) {
        res.status(404).json({ error: 'Song not found' });
        return;
      }

      // Check if song number already exists (if being updated)
      if (validatedData.number && validatedData.number !== existingSong.number) {
        const songWithNumber = await prisma.song.findFirst({
          where: { 
            number: validatedData.number,
            id: { not: id },
          },
        });

        if (songWithNumber) {
          res.status(400).json({ error: 'Song number already exists' });
          return;
        }
      }

      const song = await prisma.song.update({
        where: { id },
        data: validatedData,
        include: {
          mediaFiles: true,
          _count: {
            select: {
              favorites: true,
              viewHistory: true,
            },
          },
        },
      });

      res.json({ song });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      console.error('Update song error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async deleteSong(req: Request, res: Response): Promise<void> {
    try {
      // Only admins can delete songs
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }

      const { id } = req.params;

      const song = await prisma.song.findUnique({
        where: { id },
        include: { mediaFiles: true },
      });

      if (!song) {
        res.status(404).json({ error: 'Song not found' });
        return;
      }

      // Delete the song (cascade will handle related records)
      await prisma.song.delete({
        where: { id },
      });

      res.json({ message: 'Song deleted successfully' });
    } catch (error) {
      console.error('Delete song error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async searchSongs(req: Request, res: Response): Promise<void> {
    try {
      const { q, limit = '10' } = req.query;

      if (!q || typeof q !== 'string') {
        res.status(400).json({ error: 'Search query required' });
        return;
      }

      const searchLimit = Math.min(parseInt(limit as string) || 10, 50);

      const where: any = {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { lyrics: { contains: q, mode: 'insensitive' } },
          { composer: { contains: q, mode: 'insensitive' } },
          { author: { contains: q, mode: 'insensitive' } },
          { category: { contains: q, mode: 'insensitive' } },
        ],
      };

      // Only show published songs to regular users
      if (!req.user || req.user.role === UserRole.USER) {
        where.isPublished = true;
      }

      const songs = await prisma.song.findMany({
        where,
        take: searchLimit,
        orderBy: [
          { title: 'asc' },
          { number: 'asc' },
        ],
        select: {
          id: true,
          title: true,
          number: true,
          composer: true,
          author: true,
          category: true,
          language: true,
          isPublished: true,
        },
      });

      res.json({ songs, query: q });
    } catch (error) {
      console.error('Search songs error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getSongCategories(req: Request, res: Response): Promise<void> {
    try {
      const where: any = {};
      
      // Only show published songs to regular users
      if (!req.user || req.user.role === UserRole.USER) {
        where.isPublished = true;
      }

      const categories = await prisma.song.findMany({
        where: {
          ...where,
          category: { not: null },
        },
        select: { category: true },
        distinct: ['category'],
        orderBy: { category: 'asc' },
      });

      const categoryList = categories
        .map(song => song.category)
        .filter(Boolean)
        .sort();

      res.json({ categories: categoryList });
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}