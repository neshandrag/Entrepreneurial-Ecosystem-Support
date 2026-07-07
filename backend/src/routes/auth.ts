import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { generateTokenPair, validateRefreshToken, revokeRefreshToken, revokeAllUserTokens } from '../utils/jwt';
import { ApiResponse, UserRole } from '../types';
import prisma from '../config/prisma';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const signupSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('individual', 'enterprise').required(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

// Generate JWT token
const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

// Generate refresh token
const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId, type: 'refresh' }, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
};

// @route   POST /api/auth/login
// @desc    Login user (startup/individual)
// @access  Public
router.post('/login', validate(loginSchema), asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  if (user.role === 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Admin users must login through the admin portal' });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

  const tokens = await generateTokenPair({ id: user.id, email: user.email, role: user.role as UserRole });

  return res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: { ...user, passwordHash: undefined },
      ...tokens,
      redirectUrl,
      role: user.role,
    },
  };

  return res.json(response);
}));

// @route   POST /api/auth/signup
// @desc    Register user
// @access  Public
router.post('/signup', validate(signupSchema), asyncHandler(async (req: Request, res: Response) => {
  const { fullName, email, username, password, role } = req.body as { fullName: string; email: string; username: string; password: string; role: 'individual' | 'enterprise' };

  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
  if (existing) {
    return res.status(400).json({ success: false, message: existing.email === email ? 'Email already exists' : 'Username already exists' });
  }

  const passwordHash = await bcrypt.genSalt(12).then((salt) => bcrypt.hash(password, salt));
  const mappedRole: UserRole = role === 'enterprise' ? 'enterprise' : 'individual';

  const user = await prisma.user.create({
    data: { fullName, email, username, passwordHash, role: mappedRole },
  });

  const tokens = await generateTokenPair({ id: user.id, email: user.email, role: user.role as UserRole });

  return res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: { ...user, passwordHash: undefined },
      ...tokens,
      redirectUrl: '/startup/dashboard',
      role: user.role,
    },
  };

  return res.status(201).json(response);
}));

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', validate(refreshTokenSchema), asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  const validation = await validateRefreshToken(refreshToken);
  if (!validation.valid) {
    return res.status(401).json({ success: false, message: validation.error || 'Invalid refresh token', expired: validation.expired });
  }

  const user = await prisma.user.findUnique({ where: { id: validation.payload!.userId } });
  if (!user) {
    return res.status(401).json({ success: false, message: 'User not found' });
  }

    // Generate new tokens
    const newToken = generateToken((user._id as any).toString());
    const newRefreshToken = generateRefreshToken((user._id as any).toString());

    return res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
    });
  }

  const tokens = await generateTokenPair({ id: user.id, email: user.email, role: user.role as UserRole });

  const response: ApiResponse = { success: true, message: 'Token refreshed successfully', data: tokens };
  return res.json(response);
}));

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  return res.json({ success: true, data: { user: req.user } });
}));

// @route   POST /api/auth/logout
// @desc    Logout user (revoke current session)
// @access  Private
router.post('/logout', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const refreshToken = req.body.refreshToken;
  if (refreshToken) {
    const validation = await validateRefreshToken(refreshToken);
    if (validation.valid && validation.tokenId) {
      await revokeRefreshToken(validation.tokenId);
    }
  }
  const response: ApiResponse = { success: true, message: 'Logout successful' };
  res.json(response);
}));

// @route   POST /api/auth/logout-all
// @desc    Logout from all devices (revoke all user sessions)
// @access  Private
router.post('/logout-all', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id as string;
  const revoked = await revokeAllUserTokens(userId);
  const response: ApiResponse = { success: true, message: `Logout successful from all devices${revoked ? '. All sessions revoked.' : ''}`, data: { sessionsRevoked: revoked } };
  res.json(response);
}));

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current password and new password are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user!.id as string } });
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect' });
  }

  const newHash = await bcrypt.genSalt(12).then((salt) => bcrypt.hash(newPassword, salt));
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });

  return res.json({
    success: true,
    message: 'Password changed successfully',
  });
}));

export default router;
