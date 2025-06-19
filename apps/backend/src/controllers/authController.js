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
exports.AuthController = void 0;
const database_1 = require("../config/database");
const auth_1 = require("../utils/auth");
const emailService_1 = require("../services/emailService");
const zod_1 = require("zod");
class AuthController {
    static register(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validatedData = auth_1.registerSchema.parse(req.body);
                const { email, username, password, firstName, lastName } = validatedData;
                // Check if user already exists
                const existingUser = yield database_1.prisma.user.findFirst({
                    where: {
                        OR: [
                            { email },
                            { username },
                        ],
                    },
                });
                if (existingUser) {
                    if (existingUser.email === email) {
                        res.status(400).json({ error: 'Email already registered' });
                        return;
                    }
                    if (existingUser.username === username) {
                        res.status(400).json({ error: 'Username already taken' });
                        return;
                    }
                }
                // Hash password and generate verification token
                const passwordHash = yield (0, auth_1.hashPassword)(password);
                const verificationToken = (0, auth_1.generateRandomToken)();
                // Create user
                const user = yield database_1.prisma.user.create({
                    data: {
                        email,
                        username,
                        firstName,
                        lastName,
                        passwordHash,
                        verificationToken,
                    },
                    select: {
                        id: true,
                        email: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                        isVerified: true,
                        createdAt: true,
                    },
                });
                // Send verification email
                try {
                    yield emailService_1.EmailService.sendVerificationEmail(email, verificationToken);
                }
                catch (emailError) {
                    console.error('Failed to send verification email:', emailError);
                    // Don't fail registration if email fails
                }
                res.status(201).json({
                    message: 'User registered successfully. Please check your email for verification.',
                    user,
                });
            }
            catch (error) {
                if (error instanceof zod_1.z.ZodError) {
                    res.status(400).json({ error: 'Validation failed', details: error.errors });
                    return;
                }
                console.error('Registration error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    static login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validatedData = auth_1.loginSchema.parse(req.body);
                const { email, password } = validatedData;
                // Find user
                const user = yield database_1.prisma.user.findUnique({
                    where: { email },
                });
                if (!user) {
                    res.status(401).json({ error: 'Invalid credentials' });
                    return;
                }
                // Verify password
                const isValidPassword = yield (0, auth_1.comparePassword)(password, user.passwordHash);
                if (!isValidPassword) {
                    res.status(401).json({ error: 'Invalid credentials' });
                    return;
                }
                // Generate tokens
                const tokens = (0, auth_1.generateTokens)({
                    userId: user.id,
                    email: user.email,
                    role: user.role,
                });
                // Return user data and tokens
                res.json({
                    message: 'Login successful',
                    user: {
                        id: user.id,
                        email: user.email,
                        username: user.username,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        role: user.role,
                        isVerified: user.isVerified,
                    },
                    tokens,
                });
            }
            catch (error) {
                if (error instanceof zod_1.z.ZodError) {
                    res.status(400).json({ error: 'Validation failed', details: error.errors });
                    return;
                }
                console.error('Login error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    static refreshToken(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { refreshToken } = req.body;
                if (!refreshToken) {
                    res.status(400).json({ error: 'Refresh token required' });
                    return;
                }
                // Verify refresh token
                const decoded = (0, auth_1.verifyRefreshToken)(refreshToken);
                // Find user
                const user = yield database_1.prisma.user.findUnique({
                    where: { id: decoded.userId },
                });
                if (!user) {
                    res.status(401).json({ error: 'User not found' });
                    return;
                }
                // Generate new tokens
                const tokens = (0, auth_1.generateTokens)({
                    userId: user.id,
                    email: user.email,
                    role: user.role,
                });
                res.json({ tokens });
            }
            catch (error) {
                console.error('Token refresh error:', error);
                res.status(401).json({ error: 'Invalid refresh token' });
            }
        });
    }
    static verifyEmail(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { token } = req.query;
                if (!token || typeof token !== 'string') {
                    res.status(400).json({ error: 'Verification token required' });
                    return;
                }
                // Find user with verification token
                const user = yield database_1.prisma.user.findFirst({
                    where: { verificationToken: token },
                });
                if (!user) {
                    res.status(400).json({ error: 'Invalid or expired verification token' });
                    return;
                }
                // Update user as verified
                yield database_1.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        isVerified: true,
                        verificationToken: null,
                    },
                });
                res.json({ message: 'Email verified successfully' });
            }
            catch (error) {
                console.error('Email verification error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    static forgotPassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validatedData = auth_1.forgotPasswordSchema.parse(req.body);
                const { email } = validatedData;
                // Find user
                const user = yield database_1.prisma.user.findUnique({
                    where: { email },
                });
                if (!user) {
                    // Don't reveal if email exists
                    res.json({ message: 'If the email exists, a password reset link has been sent.' });
                    return;
                }
                // Generate reset token and expiry
                const resetToken = (0, auth_1.generateRandomToken)();
                const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
                // Update user with reset token
                yield database_1.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        resetPasswordToken: resetToken,
                        resetPasswordExpires: resetExpiry,
                    },
                });
                // Send reset email
                try {
                    yield emailService_1.EmailService.sendPasswordResetEmail(email, resetToken);
                }
                catch (emailError) {
                    console.error('Failed to send password reset email:', emailError);
                }
                res.json({ message: 'If the email exists, a password reset link has been sent.' });
            }
            catch (error) {
                if (error instanceof zod_1.z.ZodError) {
                    res.status(400).json({ error: 'Validation failed', details: error.errors });
                    return;
                }
                console.error('Forgot password error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    static resetPassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validatedData = auth_1.resetPasswordSchema.parse(req.body);
                const { token, password } = validatedData;
                // Find user with valid reset token
                const user = yield database_1.prisma.user.findFirst({
                    where: {
                        resetPasswordToken: token,
                        resetPasswordExpires: {
                            gt: new Date(),
                        },
                    },
                });
                if (!user) {
                    res.status(400).json({ error: 'Invalid or expired reset token' });
                    return;
                }
                // Hash new password
                const passwordHash = yield (0, auth_1.hashPassword)(password);
                // Update user password and clear reset token
                yield database_1.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        passwordHash,
                        resetPasswordToken: null,
                        resetPasswordExpires: null,
                    },
                });
                res.json({ message: 'Password reset successfully' });
            }
            catch (error) {
                if (error instanceof zod_1.z.ZodError) {
                    res.status(400).json({ error: 'Validation failed', details: error.errors });
                    return;
                }
                console.error('Reset password error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
    static getProfile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.user) {
                    res.status(401).json({ error: 'Authentication required' });
                    return;
                }
                const user = yield database_1.prisma.user.findUnique({
                    where: { id: req.user.id },
                    select: {
                        id: true,
                        email: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                        isVerified: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                });
                if (!user) {
                    res.status(404).json({ error: 'User not found' });
                    return;
                }
                res.json({ user });
            }
            catch (error) {
                console.error('Get profile error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    }
}
exports.AuthController = AuthController;
