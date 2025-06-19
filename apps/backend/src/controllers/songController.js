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
exports.SongController = void 0;
const database_1 = require("../config/database");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
// Validation schemas
const createSongSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(200, 'Title too long'),
    number: zod_1.z.number().int().positive().optional(),
    lyrics: zod_1.z.string().min(1, 'Lyrics are required'),
    composer: zod_1.z.string().max(100).optional(),
    author: zod_1.z.string().max(100).optional(),
    category: zod_1.z.string().max(50).optional(),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
    language: zod_1.z.string().default('en'),
    isPublished: zod_1.z.boolean().default(false),
});
const updateSongSchema = createSongSchema.partial();
const songQuerySchema = zod_1.z.object({
    page: zod_1.z.string().transform(val => parseInt(val) || 1),
    limit: zod_1.z.string().transform(val => Math.min(parseInt(val) || 10, 100)),
    search: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    language: zod_1.z.string().optional(),
    tags: zod_1.z.string().optional(),
    composer: zod_1.z.string().optional(),
    author: zod_1.z.string().optional(),
    sortBy: zod_1.z.enum(['title', 'number', 'createdAt', 'updatedAt']).default('title'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('asc'),
    published: zod_1.z.string().transform(val => val === 'true' ? true : val === 'false' ? false : undefined).optional(),
});
class SongController {
    static createSong(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Only admins and moderators can create songs
                if (!req.user || ![client_1.UserRole.ADMIN, client_1.UserRole.MODERATOR].includes(req.user.role)) {
                    res.status(403).json({ error: 'Insufficient permissions' });
                    return;
                }
                const validatedData = createSongSchema.parse(req.body);
                // Check if song number already exists (if provided)
                if (validatedData.number) {
                    const existingSong = yield database_1.prisma.song.findFirst({
                        where: { number: validatedData.number },
                    });
                    if (existingSong) {
                        res.status(400).json({ error: 'Song number already exists' });
                        return;
                    }
                }
                const song = yield database_1.prisma.song.create({
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
            }
            catch (error) {
                if (error instanceof zod_1.z.ZodError) {
                    res.status(400).json({ error: 'Validation failed', details: error.errors });
                    return;
                }
                console.error('Create song error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    static getSongs(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const query = songQuerySchema.parse(req.query);
                const { page, limit, search, category, language, tags, composer, author, sortBy, sortOrder, published } = query;
                const skip = (page - 1) * limit;
                // Build where clause
                const where = {};
                // Only show published songs to regular users
                if (!req.user || req.user.role === client_1.UserRole.USER) {
                    where.isPublished = true;
                }
                else if (published !== undefined) {
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
                if (category)
                    where.category = { contains: category, mode: 'insensitive' };
                if (language)
                    where.language = language;
                if (composer)
                    where.composer = { contains: composer, mode: 'insensitive' };
                if (author)
                    where.author = { contains: author, mode: 'insensitive' };
                if (tags) {
                    const tagArray = tags.split(',').map(tag => tag.trim());
                    where.tags = { hasSome: tagArray };
                }
                // Get songs with pagination
                const [songs, total] = yield Promise.all([
                    database_1.prisma.song.findMany({
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
                    database_1.prisma.song.count({ where }),
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
            }
            catch (error) {
                if (error instanceof zod_1.z.ZodError) {
                    res.status(400).json({ error: 'Validation failed', details: error.errors });
                    return;
                }
                console.error('Get songs error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    static getSongById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const song = yield database_1.prisma.song.findUnique({
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
                if (!song.isPublished && (!req.user || req.user.role === client_1.UserRole.USER)) {
                    res.status(404).json({ error: 'Song not found' });
                    return;
                }
                // Record view history if user is authenticated
                if (req.user) {
                    yield database_1.prisma.viewHistory.create({
                        data: {
                            userId: req.user.id,
                            songId: song.id,
                        },
                    }).catch(() => {
                        // Ignore duplicate view errors
                    });
                }
                res.json({ song });
            }
            catch (error) {
                console.error('Get song by ID error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    static updateSong(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Only admins and moderators can update songs
                if (!req.user || ![client_1.UserRole.ADMIN, client_1.UserRole.MODERATOR].includes(req.user.role)) {
                    res.status(403).json({ error: 'Insufficient permissions' });
                    return;
                }
                const { id } = req.params;
                const validatedData = updateSongSchema.parse(req.body);
                // Check if song exists
                const existingSong = yield database_1.prisma.song.findUnique({
                    where: { id },
                });
                if (!existingSong) {
                    res.status(404).json({ error: 'Song not found' });
                    return;
                }
                // Check if song number already exists (if being updated)
                if (validatedData.number && validatedData.number !== existingSong.number) {
                    const songWithNumber = yield database_1.prisma.song.findFirst({
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
                const song = yield database_1.prisma.song.update({
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
            }
            catch (error) {
                if (error instanceof zod_1.z.ZodError) {
                    res.status(400).json({ error: 'Validation failed', details: error.errors });
                    return;
                }
                console.error('Update song error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    static deleteSong(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Only admins can delete songs
                if (!req.user || req.user.role !== client_1.UserRole.ADMIN) {
                    res.status(403).json({ error: 'Insufficient permissions' });
                    return;
                }
                const { id } = req.params;
                const song = yield database_1.prisma.song.findUnique({
                    where: { id },
                    include: { mediaFiles: true },
                });
                if (!song) {
                    res.status(404).json({ error: 'Song not found' });
                    return;
                }
                // Delete the song (cascade will handle related records)
                yield database_1.prisma.song.delete({
                    where: { id },
                });
                res.json({ message: 'Song deleted successfully' });
            }
            catch (error) {
                console.error('Delete song error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    static searchSongs(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { q, limit = '10' } = req.query;
                if (!q || typeof q !== 'string') {
                    res.status(400).json({ error: 'Search query required' });
                    return;
                }
                const searchLimit = Math.min(parseInt(limit) || 10, 50);
                const where = {
                    OR: [
                        { title: { contains: q, mode: 'insensitive' } },
                        { lyrics: { contains: q, mode: 'insensitive' } },
                        { composer: { contains: q, mode: 'insensitive' } },
                        { author: { contains: q, mode: 'insensitive' } },
                        { category: { contains: q, mode: 'insensitive' } },
                    ],
                };
                // Only show published songs to regular users
                if (!req.user || req.user.role === client_1.UserRole.USER) {
                    where.isPublished = true;
                }
                const songs = yield database_1.prisma.song.findMany({
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
            }
            catch (error) {
                console.error('Search songs error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    static getSongCategories(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const where = {};
                // Only show published songs to regular users
                if (!req.user || req.user.role === client_1.UserRole.USER) {
                    where.isPublished = true;
                }
                const categories = yield database_1.prisma.song.findMany({
                    where: Object.assign(Object.assign({}, where), { category: { not: null } }),
                    select: { category: true },
                    distinct: ['category'],
                    orderBy: { category: 'asc' },
                });
                const categoryList = categories
                    .map(song => song.category)
                    .filter(Boolean)
                    .sort();
                res.json({ categories: categoryList });
            }
            catch (error) {
                console.error('Get categories error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
}
exports.SongController = SongController;
