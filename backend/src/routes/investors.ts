import express, { Request, Response } from 'express';
import prisma from '../config/prisma';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import Joi from 'joi';

type OptionalAuthRequest = Request & { user?: any };

const router = express.Router();

// Validation schemas
const createInvestorSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  firm: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phoneNumber: Joi.string().max(20).required(),
  investmentRange: Joi.string().min(5).max(100).required(),
  focusAreas: Joi.array().items(Joi.string()).min(1).required(),
  backgroundSummary: Joi.string().min(20).max(1000).required(),
  profilePicture: Joi.string().uri(),
  linkedinProfile: Joi.string().uri(),
  website: Joi.string().uri(),
  location: Joi.string().max(100),
  position: Joi.string().max(100),
  preferences: Joi.object({
    minInvestment: Joi.number().min(0),
    maxInvestment: Joi.number().min(0),
    preferredSectors: Joi.array().items(Joi.string()),
    preferredStages: Joi.array().items(Joi.string()),
    geographicFocus: Joi.array().items(Joi.string()),
    investmentCriteria: Joi.array().items(Joi.string()),
  }),
});

const updateInvestorSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  firm: Joi.string().min(2).max(100),
  email: Joi.string().email(),
  phoneNumber: Joi.string().max(20),
  investmentRange: Joi.string().min(5).max(100),
  focusAreas: Joi.array().items(Joi.string()),
  backgroundSummary: Joi.string().min(20).max(1000),
  profilePicture: Joi.string().uri(),
  linkedinProfile: Joi.string().uri(),
  website: Joi.string().uri(),
  location: Joi.string().max(100),
  position: Joi.string().max(100),
  preferences: Joi.object({
    minInvestment: Joi.number().min(0),
    maxInvestment: Joi.number().min(0),
    preferredSectors: Joi.array().items(Joi.string()),
    preferredStages: Joi.array().items(Joi.string()),
    geographicFocus: Joi.array().items(Joi.string()),
    investmentCriteria: Joi.array().items(Joi.string()),
  }),
  isActive: Joi.boolean(),
  isVerified: Joi.boolean(),
});

const getInvestorsQuerySchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10),
  focusAreas: Joi.string(),
  sectors: Joi.string(),
  location: Joi.string(),
  isActive: Joi.boolean(),
  isVerified: Joi.boolean(),
  minInvestment: Joi.number().min(0),
  maxInvestment: Joi.number().min(0),
  search: Joi.string().max(100),
  sortBy: Joi.string().valid('createdAt', 'name', 'firm', 'stats.totalInvestments').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

// @route   GET /api/investors
// @desc    Get all investors
// @access  Public
router.get('/', optionalAuth, validateQuery(getInvestorsQuerySchema), asyncHandler(async (req: OptionalAuthRequest, res: Response) => {
  // Extract query params with proper defaults
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const focusAreas = req.query.focusAreas;
  const sectors = req.query.sectors;
  const location = req.query.location;
  const isActive = req.query.isActive;
  const isVerified = req.query.isVerified;
  const minInvestment = req.query.minInvestment;
  const maxInvestment = req.query.maxInvestment;
  const search = req.query.search;
  const sortBy = String(req.query.sortBy || 'createdAt');
  const sortOrder = String(req.query.sortOrder || 'desc');
  
  const skip = (page - 1) * limit;

  const where: any = {};
  if (focusAreas) where.focusAreas = { hasSome: String(focusAreas).split(',') };
  if (sectors) where.preferences = { path: ['preferredSectors'], array_contains: String(sectors).split(',') } as any; // simplified
  if (location) where.location = { contains: String(location), mode: 'insensitive' };
  if (typeof isActive === 'boolean') where.isActive = isActive;
  if (typeof isVerified === 'boolean') where.isVerified = isVerified;
  if (minInvestment) where.preferences = { ...(where.preferences || {}), path: ['minInvestment'] } as any;
  if (maxInvestment) where.preferences = { ...(where.preferences || {}), path: ['maxInvestment'] } as any;
  if (search) {
    where.OR = [
      { name: { contains: String(search), mode: 'insensitive' } },
      { firm: { contains: String(search), mode: 'insensitive' } },
      { backgroundSummary: { contains: String(search), mode: 'insensitive' } },
      { position: { contains: String(search), mode: 'insensitive' } },
    ];
  }
  if (!req.user || req.user.role !== 'ADMIN') where.isActive = true;

  // Build orderBy with proper validation
  const validSortFields = ['createdAt', 'name', 'firm'];
  const actualSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const orderBy = [{ [actualSortBy]: sortOrder }];
  
  const [investors, total] = await Promise.all([
    prisma.investor.findMany({ where, orderBy, skip, take: limit }),
    prisma.investor.count({ where })
  ]);

  return res.json({ 
    success: true, 
    data: { 
      investors, 
      pagination: { 
        currentPage: page, 
        totalPages: Math.ceil(total / limit), 
        totalInvestors: total, 
        hasNext: page < Math.ceil(total / limit), 
        hasPrev: page > 1 
      } 
    } 
  });
}));

// @route   POST /api/investors
// @desc    Create investor profile
// @access  Private
router.post('/', authenticate, validate(createInvestorSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const existingInvestor = await prisma.investor.findFirst({ where: { email: req.body.email } });
  if (existingInvestor) {
    return res.status(400).json({
      success: false,
      message: 'Investor with this email already exists',
    });
  }

  const investor = await prisma.investor.create({ data: { ...req.body, userId: req.user!.id, focusAreas: req.body.focusAreas || [] } });
  return res.status(201).json({
    success: true,
    message: 'Investor profile created successfully',
    data: {
      investor,
    },
  });
}));

// @route   GET /api/investors/:id
// @desc    Get investor by ID
// @access  Public
router.get('/:id', optionalAuth, asyncHandler(async (req: OptionalAuthRequest, res: Response) => {
  const investor = await prisma.investor.findUnique({ where: { id: req.params.id } });
  
  if (!investor) {
    return res.status(404).json({
      success: false,
      message: 'Investor not found',
    });
  }

  // Only show active investors to public
  if (!req.user || req.user.role !== 'ADMIN') {
    if (!investor!.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Investor profile is not active',
      });
    }
  }

  return res.json({
    success: true,
    data: {
      investor,
    },
  });
}));

// @route   PUT /api/investors/:id
// @desc    Update investor
// @access  Private
router.put('/:id', authenticate, validate(updateInvestorSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const investor = await prisma.investor.findUnique({ where: { id: req.params.id } });
  
  if (!investor) {
    return res.status(404).json({
      success: false,
      message: 'Investor not found',
    });
  }

  // Check if user can update this investor
  if (req.user!.role !== 'ADMIN' && req.user!.id !== (investor!.userId || '')) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  }

  // Check if email is being changed and if it's already taken
  if (req.body.email && req.body.email !== investor!.email) {
    const existingInvestor = await prisma.investor.findFirst({ where: { email: req.body.email } });
    if (existingInvestor) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists',
      });
    }
  }

  const updated = await prisma.investor.update({ where: { id: req.params.id }, data: req.body });

  return res.json({
    success: true,
    message: 'Investor updated successfully',
    data: {
      investor,
    },
  });
}));

// @route   DELETE /api/investors/:id
// @desc    Delete investor
// @access  Private
router.delete('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const investor = await prisma.investor.findUnique({ where: { id: req.params.id } });
  
  if (!investor) {
    return res.status(404).json({
      success: false,
      message: 'Investor not found',
    });
  }

  // Check if user can delete this investor
  if (req.user!.role !== 'ADMIN' && req.user!.id !== (investor!.userId || '')) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  }

  await prisma.investor.delete({ where: { id: req.params.id } });

  return res.json({
    success: true,
    message: 'Investor deleted successfully',
  });
}));

// @route   GET /api/investors/stats/overview
// @desc    Get investor statistics overview
// @access  Public
router.get('/stats/overview', asyncHandler(async (_req: Request, res: Response) => {
  const totalInvestors = await prisma.investor.count();
  const activeInvestors = await prisma.investor.count({ where: { isActive: true } });
  const verifiedInvestors = await prisma.investor.count({ where: { isVerified: true } });

  // Focus areas distribution
  const focusAreasDistribution = await Investor.aggregate([
    { $unwind: '$focusAreas' },
    { $group: { _id: '$focusAreas', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  // Preferred sectors distribution
  const preferredSectorsDistribution = await Investor.aggregate([
    { $unwind: '$preferences.preferredSectors' },
    { $group: { _id: '$preferences.preferredSectors', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  // Investment range distribution
  const investmentRangeDistribution = await Investor.aggregate([
    { $group: { _id: '$investmentRange', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  // Total investments
  const totalInvestments = await Investor.aggregate([
    { $group: { _id: null, total: { $sum: '$stats.totalAmountInvested' } } }
  ]);

  return res.json({
    success: true,
    data: {
      totalInvestors,
      activeInvestors,
      verifiedInvestors,
      focusAreasDistribution,
      preferredSectorsDistribution,
      investmentRangeDistribution,
      totalInvestments: totalInvestments[0]?.total || 0,
    },
  });
}));

export default router;
