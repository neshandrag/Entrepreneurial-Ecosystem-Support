import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import Joi from 'joi';

import prisma from '../config/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validation';
import { generateTokenPair, revokeAllUserTokens, revokeRefreshToken, validateRefreshToken } from '../utils/jwt';
import { ApiResponse, UserRole } from '../types';

const router = express.Router();

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

const sanitizeUser = <T extends { passwordHash?: string }>(user: T): Omit<T, 'passwordHash'> => {
  const { passwordHash, ...rest } = user;
  return rest;
};

router.post('/admin/login', validate(loginSchema), asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findFirst({ where: { email, role: 'ADMIN' } });
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

  const tokens = await generateTokenPair({ id: user.id, email: user.email, role: user.role as UserRole });

  const response: ApiResponse = {
    success: true,
    message: 'Admin login successful',
    data: {
      user: sanitizeUser(user),
      ...tokens,
      redirectUrl: '/admin/dashboard',
      role: user.role,
    },
  };

  res.json(response);
}));

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

  const response: ApiResponse = {
    success: true,
    message: 'Login successful',
    data: {
      user: sanitizeUser(user),
      ...tokens,
      redirectUrl: '/startup/dashboard',
      role: user.role,
    },
  };

  res.json(response);
}));

router.post('/signup', validate(signupSchema), asyncHandler(async (req: Request, res: Response) => {
  const { fullName, email, username, password, role } = req.body as { fullName: string; email: string; username: string; password: string; role: 'individual' | 'enterprise' };

  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
  if (existing) {
    return res.status(400).json({ success: false, message: existing.email === email ? 'Email already exists' : 'Username already exists' });
  }

  const passwordHash = await bcrypt.genSalt(12).then((salt) => bcrypt.hash(password, salt));
  const mappedRole = (role === 'enterprise' ? 'ENTERPRISE' : 'INDIVIDUAL') as UserRole;

  const user = await prisma.user.create({
    data: { fullName, email, username, passwordHash, role: mappedRole },
  });

  const tokens = await generateTokenPair({ id: user.id, email: user.email, role: user.role as UserRole });

  const response: ApiResponse = {
    success: true,
    message: 'User registered successfully',
    data: {
      user: sanitizeUser(user),
      ...tokens,
      redirectUrl: '/startup/dashboard',
      role: user.role,
    },
  };

  res.status(201).json(response);
}));

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

  if (validation.tokenId) {
    await revokeRefreshToken(validation.tokenId);
  }

  const tokens = await generateTokenPair({ id: user.id, email: user.email, role: user.role as UserRole });
  const response: ApiResponse = { success: true, message: 'Token refreshed successfully', data: tokens };

  res.json(response);
}));

router.get('/me', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json({ success: true, data: { user: req.user } });
}));

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

router.post('/logout-all', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id as string;
  const revoked = await revokeAllUserTokens(userId);
  const response: ApiResponse = { success: true, message: `Logout successful from all devices${revoked ? '. All sessions revoked.' : ''}`, data: { sessionsRevoked: revoked } };
  res.json(response);
}));

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

  res.json({ success: true, message: 'Password changed successfully' });
}));

export default router;
