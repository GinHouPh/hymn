import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { z } from 'zod';

// Validation schemas
const updatePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  fontSize: z.number().int().min(12).max(24).optional(),
  language: z.string().min(2).max(5).optional(),
  autoplay: z.boolean().optional(),
  notifications: z.boolean().optional(),
  preferences: z.record(z.any()).optional(), // Additional preferences as JSON
});

const favoritesQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1),
  limit: z.string().transform(val => Math.min(parseInt(val) || 10, 100)),
  sortBy: z.enum(['title', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
});

export class UserController {
  static async getUserPreferences(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      let preferences = await prisma.userPreferences.findUnique({
        where: { userId: req.user.id },
      });

      // Create default preferences if they don't exist
      if (!preferences) {
        preferences = await prisma.userPreferences.create({
          data: {
            userId: req.user.id,
            theme: 'light',
            fontSize: 16,
            language: 'en',
            autoplay: false,
            notifications: true,
          },
        });
      }

      res.json({ preferences });
    } catch (error) {
      console.error('Get user preferences error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateUserPreferences(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const validatedData = updatePreferencesSchema.parse(req.body);

      const preferences = await prisma.userPreferences.upsert({
        where: { userId: req.user.id },
        update: validatedData,
        create: {
          userId: req.user.id,
          theme: 'light',
          fontSize: 16,
          language: 'en',
          autoplay: false,
          notifications: true,
          ...validatedData,
        },
      });

      res.json({ preferences });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
        return;
      }
      console.error('Update user preferences error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async addToFavorites(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { songId } = req.params;

      // Check if song exists and is published
      const song = await prisma.song.findUnique({
        where: { id: songId },
        select: { id: true, isPublished: true },
      });

      if (!song || !song.isPublished) {
        res.status(404).json({ error: 'Song not found' });
        return;
      }

      // Check if already in favorites
      const existingFavorite = await prisma.songFavorite.findUnique({
        where: {
          userId_songId: {
            userId: req.user.id,
            songId,
          },
        },
      });

      if (existingFavorite) {
        res.status(400).json({ error: 'Song already in favorites' });
        return;
      }

      // Add to favorites
      const favorite = await prisma.songFavorite.create({
        data: {
          userId: req.user.id,
          songId,
        },
        include: {
          song: {
            select: {
              id: true,
              title: true,
              number: true,
              composer: true,
              author: true,
              category: true,
            },
          },
        },
      });

      res.status(201).json({ favorite });
    } catch (error) {
      console.error('Add to favorites error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async removeFromFavorites(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { songId } = req.params;

      const favorite = await prisma.songFavorite.findUnique({
        where: {
          userId_songId: {
            userId: req.user.id,
            songId,
          },
        },
      });

      if (!favorite) {
        res.status(404).json({ error: 'Song not in favorites' });
        return;
      }

      await prisma.songFavorite.delete({
        where: {
          userId_songId: {
            userId: req.user.id,
            songId,
          },
        },
      });

      res.json({ message: 'Song removed from favorites' });
    } catch (error) {
      console.error('Remove from favorites error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getFavorites(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const query = favoritesQuerySchema.parse(req.query);
      const { page, limit, sortBy, sortOrder, search } = query;

      const skip = (page - 1) * limit;

      // Build where clause for search
      const songWhere: any = { isPublished: true };
      if (search) {
        songWhere.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { composer: { contains: search, mode: 'insensitive' } },
          { author: { contains: search, mode: 'insensitive' } },
        ];
      }

      const where = {
        userId: req.user.id,
        song: songWhere,
      };

      // Determine order by clause
      let orderBy: any;
      if (sortBy === 'title') {
        orderBy = { song: { title: sortOrder } };
      } else {
        orderBy = { createdAt: sortOrder };
      }

      const [favorites, total] = await Promise.all([
        prisma.songFavorite.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            song: {
              select: {
                id: true,
                title: true,
                number: true,
                composer: true,
                author: true,
                category: true,
                language: true,
                _count: {
                  select: {
                    favorites: true,
                    viewHistory: true,
                  },
                },
              },
            },
          },
        }),
        prisma.songFavorite.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
        favorites,
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
      console.error('Get favorites error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async checkFavoriteStatus(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { songId } = req.params;

      const favorite = await prisma.songFavorite.findUnique({
        where: {
          userId_songId: {
            userId: req.user.id,
            songId,
          },
        },
      });

      res.json({ isFavorite: !!favorite });
    } catch (error) {
      console.error('Check favorite status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getViewHistory(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { page = '1', limit = '10' } = req.query;
      const pageNum = parseInt(page as string) || 1;
      const limitNum = Math.min(parseInt(limit as string) || 10, 100);
      const skip = (pageNum - 1) * limitNum;

      const [viewHistory, total] = await Promise.all([
        prisma.viewHistory.findMany({
          where: {
            userId: req.user.id,
            song: { isPublished: true },
          },
          skip,
          take: limitNum,
          orderBy: { viewedAt: 'desc' },
          include: {
            song: {
              select: {
                id: true,
                title: true,
                number: true,
                composer: true,
                author: true,
                category: true,
              },
            },
          },
        }),
        prisma.viewHistory.count({
          where: {
            userId: req.user.id,
            song: { isPublished: true },
          },
        }),
      ]);

      const totalPages = Math.ceil(total / limitNum);

      res.json({
        viewHistory,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
      });
    } catch (error) {
      console.error('Get view history error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async clearViewHistory(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      await prisma.viewHistory.deleteMany({
        where: { userId: req.user.id },
      });

      res.json({ message: 'View history cleared successfully' });
    } catch (error) {
      console.error('Clear view history error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getUserStats(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const [favoritesCount, viewHistoryCount, playlistsCount] = await Promise.all([
        prisma.songFavorite.count({
          where: { userId: req.user.id },
        }),
        prisma.viewHistory.count({
          where: { userId: req.user.id },
        }),
        prisma.playlist.count({
          where: { userId: req.user.id },
        }),
      ]);

      res.json({
        stats: {
          favoritesCount,
          viewHistoryCount,
          playlistsCount,
        },
      });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}