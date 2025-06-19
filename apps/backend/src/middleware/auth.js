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
exports.optionalAuth = exports.requireModerator = exports.requireAdmin = exports.requireRole = exports.requireVerification = exports.authenticateToken = void 0;
const auth_1 = require("../utils/auth");
const database_1 = require("../config/database");
const client_1 = require("@prisma/client");
const authenticateToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        if (!token) {
            res.status(401).json({ error: 'Access token required' });
            return;
        }
        const decoded = (0, auth_1.verifyAccessToken)(token);
        // Fetch user from database to ensure they still exist and get current data
        const user = yield database_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                role: true,
                isVerified: true,
            },
        });
        if (!user) {
            res.status(401).json({ error: 'User not found' });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        res.status(403).json({ error: 'Invalid or expired token' });
    }
});
exports.authenticateToken = authenticateToken;
const requireVerification = (req, res, next) => {
    var _a;
    if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.isVerified)) {
        res.status(403).json({ error: 'Email verification required' });
        return;
    }
    next();
};
exports.requireVerification = requireVerification;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({ error: 'Insufficient permissions' });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
exports.requireAdmin = (0, exports.requireRole)([client_1.UserRole.ADMIN]);
exports.requireModerator = (0, exports.requireRole)([client_1.UserRole.ADMIN, client_1.UserRole.MODERATOR]);
// Optional authentication - doesn't fail if no token provided
const optionalAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
            const decoded = (0, auth_1.verifyAccessToken)(token);
            const user = yield database_1.prisma.user.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    isVerified: true,
                },
            });
            if (user) {
                req.user = user;
            }
        }
    }
    catch (error) {
        // Ignore token errors for optional auth
    }
    next();
});
exports.optionalAuth = optionalAuth;
