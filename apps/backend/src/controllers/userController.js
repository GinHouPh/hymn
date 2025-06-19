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
exports.UserController = void 0;
const database_1 = require("../config/database");
const zod_1 = require("zod");
// Validation schemas
const updatePreferencesSchema = zod_1.z.object({
    theme: zod_1.z.enum(['light', 'dark', 'auto']).optional(),
    fontSize: zod_1.z.number().int().min(12).max(24).optional(),
    language: zod_1.z.string().min(2).max(5).optional(),
    autoplay: zod_1.z.boolean().optional(),
    notifications: zod_1.z.boolean().optional(),
    preferences: zod_1.z.record(zod_1.z.any()).optional(), // Additional preferences as JSON
});
const favoritesQuerySchema = zod_1.z.object({
    page: zod_1.z.string().transform(val => parseInt(val) || 1),
    limit: zod_1.z.string().transform(val => Math.min(parseInt(val) || 10, 100)),
    sortBy: zod_1.z.enum(['title', 'createdAt']).default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
    search: zod_1.z.string().optional(),
});
class UserController {
    static getUserPreferences(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.user) {
                    res.status(401).json({ error: 'Authentication required' });
                    return;
                }
                let preferences = yield database_1.prisma.userPreferences.findUnique({
                    where: { userId: req.user.id },
                });
                // Create default preferences if they don't exist
                if (!preferences) {
                    preferences = yield database_1.prisma.userPreferences.create({
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
            }
            catch (error) {
                console.error('Get user preferences error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    static updateUserPreferences(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.user) {
                    res.status(401).json({ error: 'Authentication required' });
                    return;
                }
                const validatedData = updatePreferencesSchema.parse(req.body);
                const preferences = yield database_1.prisma.userPreferences.upsert({
                    where: { userId: req.user.id },
                    update: validatedData,
                    create: Object.assign({ userId: req.user.id, theme: 'light', fontSize: 16, language: 'en', autoplay: false, notifications: true }, validatedData),
                });
                res.json({ preferences });
            }
            catch (error) {
                if (error instanceof zod_1.z.ZodError) {
                    res.status(400).json({ error: 'Validation failed', details: error.errors });
                    return;
                }
                console.error('Update user preferences error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    static addToFavorites(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.user) {
                    res.status(401).json({ error: 'Authentication required' });
                    return;
                }
                const { songId } = req.params;
                // Check if song exists and is published
                const song = yield database_1.prisma.song.findUnique({
                    where: { id: songId },
                    select: { id: true, isPublished: true },
                });
                if (!song || !song.isPublished) {
                    res.status(404).json({ error: 'Song not found' });
                    return;
                }
                // Check if already in favorites
                const existingFavorite = yield database_1.prisma.songFavorite.findUnique({
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
                const favorite = yield database_1.prisma.songFavorite.create({
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
            }
            catch (error) {
                console.error('Add to favorites error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    static removeFromFavorites(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.user) {
                    res.status(401).json({ error: 'Authentication required' });
                    return;
                }
                const { songId } = req.params;
                const favorite = yield database_1.prisma.songFavorite.findUnique({
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
                yield database_1.prisma.songFavorite.delete({
                    where: {
                        userId_songId: {
                            userId: req.user.id,
                            songId,
                        },
                    },
                });
                res.json({ message: 'Song removed from favorites' });
            }
            catch (error) {
                console.error('Remove from favorites error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    static getFavorites(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.user) {
                    res.status(401).json({ error: 'Authentication required' });
                    return;
                }
                const query = favoritesQuerySchema.parse(req.query);
                const { page, limit, sortBy, sortOrder, search } = query;
                const skip = (page - 1) * limit;
                // Build where clause for search
                const songWhere = { isPublished: true };
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
                let orderBy;
                if (sortBy === 'title') {
                    orderBy = { song: { title: sortOrder } };
                }
                else {
                    orderBy = { createdAt: sortOrder };
                }
                const [favorites, total] = yield Promise.all([
                    database_1.prisma.songFavorite.findMany({
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
                    database_1.prisma.songFavorite.count({ where }),
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
            }
            catch (error) {
                if (error instanceof zod_1.z.ZodError) {
                    res.status(400).json({ error: 'Validation failed', details: error.errors });
                    return;
                }
                console.error('Get favorites error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    static checkFavoriteStatus(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.user) {
                    res.status(401).json({ error: 'Authentication required' });
                    return;
                }
                const { songId } = req.params;
                const favorite = yield database_1.prisma.songFavorite.findUnique({
                    where: {
                        userId_songId: {
                            userId: req.user.id,
                            songId,
                        },
                    },
                });
                res.json({ isFavorite: !!favorite });
            }
            catch (error) {
                console.error('Check favorite status error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    static getViewHistory(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.user) {
                    res.status(401).json({ error: 'Authentication required' });
                    return;
                }
                const { page = '1', limit = '10' } = req.query;
                const pageNum = parseInt(page) || 1;
                const limitNum = Math.min(parseInt(limit) || 10, 100);
                const skip = (pageNum - 1) * limitNum;
                const [viewHistory, total] = yield Promise.all([
                    database_1.prisma.viewHistory.findMany({
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
                    database_1.prisma.viewHistory.count({
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
            }
            catch (error) {
                console.error('Get view history error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    static clearViewHistory(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.user) {
                    res.status(401).json({ error: 'Authentication required' });
                    return;
                }
                yield database_1.prisma.viewHistory.deleteMany({
                    where: { userId: req.user.id },
                });
                res.json({ message: 'View history cleared successfully' });
            }
            catch (error) {
                console.error('Clear view history error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    static getUserStats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.user) {
                    res.status(401).json({ error: 'Authentication required' });
                    return;
                }
                const [favoritesCount, viewHistoryCount, playlistsCount] = yield Promise.all([
                    database_1.prisma.songFavorite.count({
                        where: { userId: req.user.id },
                    }),
                    database_1.prisma.viewHistory.count({
                        where: { userId: req.user.id },
                    }),
                    database_1.prisma.playlist.count({
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
            }
            catch (error) {
                console.error('Get user stats error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
}
exports.UserController = UserController;
