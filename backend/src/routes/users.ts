import express, { Request, Response } from 'express';
import prisma from '../config/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const updateUserSchema = Joi.object({
  fullName: Joi.string().min(2).max(100),
  email: Joi.string().email(),
  username: Joi.string().alphanum().min(3).max(30),
  profileComplete: Joi.boolean(),
});

const getUsersQuerySchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10),
  role: Joi.string().valid('individual', 'enterprise', 'admin'),
  search: Joi.string().max(100),
  sortBy: Joi.string().valid('createdAt', 'fullName', 'email', 'lastLogin').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/', authenticate, requireAdmin(), validateQuery(getUsersQuerySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit, role, search, sortBy, sortOrder } = req.query as any;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (role) where.role = String(role).toUpperCase();
  if (search) {
    where.OR = [
      { fullName: { contains: String(search), mode: 'insensitive' } },
      { email: { contains: String(search), mode: 'insensitive' } },
      { username: { contains: String(search), mode: 'insensitive' } },
    ];
  }

  const orderBy: any = [{ [String(sortBy)]: String(sortOrder) }];

  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, orderBy, skip, take: Number(limit), select: { id: true, fullName: true, email: true, username: true, role: true, profileComplete: true, lastLogin: true, createdAt: true } }),
    prisma.user.count({ where }),
  ]);

  res.json({ success: true, data: { users, pagination: { currentPage: Number(page), totalPages: Math.ceil(total / Number(limit)), totalUsers: total, hasNext: Number(page) < Math.ceil(total / Number(limit)), hasPrev: Number(page) > 1 } } });
}));

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true, fullName: true, email: true, username: true, role: true, profileComplete: true, lastLogin: true, createdAt: true } });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Check if user can access this profile
  if (req.user!.role !== 'ADMIN' && req.user!.id !== user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  }

  return res.json({
    success: true,
    data: {
      user,
    },
  });
}));

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Private
router.put('/:id', authenticate, validate(updateUserSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.params.id;

  if (req.user!.role !== 'ADMIN' && req.user!.id !== userId) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Check if email or username is being changed and if it's already taken
  if (req.body.email && req.body.email !== user.email) {
    const existingUser = await prisma.user.findFirst({ where: { email: req.body.email } });
    if (existingUser) return res.status(400).json({ success: false, message: 'Email already exists' });
  }
  if (req.body.username && req.body.username !== user.username) {
    const existingUser = await prisma.user.findFirst({ where: { username: req.body.username } });
    if (existingUser) return res.status(400).json({ success: false, message: 'Username already exists' });
  }

  const updated = await prisma.user.update({ where: { id: userId }, data: req.body });
  return res.json({ success: true, message: 'User updated successfully', data: { user: { ...updated, passwordHash: undefined } } });
}));

// @route   DELETE /api/users/:id
// @desc    Delete user (admin only)
// @access  Private/Admin
router.delete('/:id', authenticate, requireAdmin(), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Prevent admin from deleting themselves
  if (req.user!.id === user.id) {
    return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
  }

  await prisma.user.delete({ where: { id: req.params.id } });
  return res.json({ success: true, message: 'User deleted successfully' });
}));

// @route   GET /api/users/:id/profile
// @desc    Get user profile
// @access  Private
router.get('/:id/profile', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.params.id;
  if (req.user!.role !== 'ADMIN' && req.user!.id !== userId) return res.status(403).json({ success: false, message: 'Access denied' });
  // No separate Profile table (Postgres-only); return minimal info and any startup attached
  const [user, startup] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, fullName: true, email: true, username: true, role: true, profileComplete: true } }),
    prisma.startup.findFirst({ where: { userId } }),
  ]);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  return res.json({ success: true, data: { profile: { user, startup } } });
}));

// @route   GET /api/users/stats/overview
// @desc    Get user statistics overview (admin only)
// @access  Private/Admin
router.get('/stats/overview', authenticate, requireAdmin(), asyncHandler(async (_req: AuthRequest, res: Response) => {
  const [totalUsers, individualUsers, enterpriseUsers, adminUsers, verifiedUsers, completeProfiles] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'INDIVIDUAL' } }),
    prisma.user.count({ where: { role: 'ENTERPRISE' } }),
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.user.count({ where: { isEmailVerified: true } }),
    prisma.user.count({ where: { profileComplete: true } }),
  ]);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentUsers = await prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } });

  res.json({ success: true, data: { totalUsers, individualUsers, enterpriseUsers, adminUsers, verifiedUsers, completeProfiles, recentUsers, profileCompletionRate: totalUsers > 0 ? Math.round((completeProfiles / totalUsers) * 100) : 0, verificationRate: totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0 } });
}));

export default router;
