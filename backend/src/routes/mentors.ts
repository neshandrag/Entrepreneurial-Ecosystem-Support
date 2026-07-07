import express, { Request, Response } from 'express';
import prisma from '../config/prisma';
import { authenticate, optionalAuth, AuthRequest, requireAdmin } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import Joi from 'joi';

type OptionalAuthRequest = Request & { user?: any };

const router = express.Router();

// Validation schemas
const createMentorSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  role: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  experience: Joi.string().min(10).max(500).required(),
  bio: Joi.string().min(20).max(1000).required(),
  profilePicture: Joi.string().uri(),
  phoneNumber: Joi.string().max(20),
  linkedinProfile: Joi.string().uri(),
  website: Joi.string().uri(),
  location: Joi.string().max(100),
  expertise: Joi.array().items(Joi.string()).min(1).required(),
  sectors: Joi.array().items(Joi.string()).min(1).required(),
  availability: Joi.object({
    days: Joi.array().items(Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
    timeSlots: Joi.array().items(Joi.object({
      start: Joi.string().required(),
      end: Joi.string().required(),
    })),
    timezone: Joi.string().default('UTC'),
  }),
  preferences: Joi.object({
    maxMentees: Joi.number().min(1).max(20).default(5),
    preferredSectors: Joi.array().items(Joi.string()),
    preferredStages: Joi.array().items(Joi.string()),
    meetingFrequency: Joi.string().valid('weekly', 'bi-weekly', 'monthly').default('monthly'),
  }),
});

const updateMentorSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  role: Joi.string().min(2).max(100),
  email: Joi.string().email(),
  experience: Joi.string().min(10).max(500),
  bio: Joi.string().min(20).max(1000),
  profilePicture: Joi.string().uri(),
  phoneNumber: Joi.string().max(20),
  linkedinProfile: Joi.string().uri(),
  website: Joi.string().uri(),
  location: Joi.string().max(100),
  expertise: Joi.array().items(Joi.string()),
  sectors: Joi.array().items(Joi.string()),
  availability: Joi.object({
    days: Joi.array().items(Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
    timeSlots: Joi.array().items(Joi.object({
      start: Joi.string().required(),
      end: Joi.string().required(),
    })),
    timezone: Joi.string(),
  }),
  preferences: Joi.object({
    maxMentees: Joi.number().min(1).max(20),
    preferredSectors: Joi.array().items(Joi.string()),
    preferredStages: Joi.array().items(Joi.string()),
    meetingFrequency: Joi.string().valid('weekly', 'bi-weekly', 'monthly'),
  }),
  isActive: Joi.boolean(),
  isVerified: Joi.boolean(),
});

const getMentorsQuerySchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10),
  sectors: Joi.string(),
  expertise: Joi.string(),
  location: Joi.string(),
  isActive: Joi.boolean(),
  isVerified: Joi.boolean(),
  minRating: Joi.number().min(0).max(5),
  search: Joi.string().max(100),
  sortBy: Joi.string().valid('createdAt', 'name', 'rating', 'stats.totalMentees').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

// @route   GET /api/mentors
// @desc    Get all mentors
// @access  Public
router.get('/', optionalAuth, validateQuery(getMentorsQuerySchema), asyncHandler(async (req: OptionalAuthRequest, res: Response) => {
  // Extract query params with proper defaults
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const sectors = req.query.sectors;
  const expertise = req.query.expertise;
  const location = req.query.location;
  const isActive = req.query.isActive;
  const isVerified = req.query.isVerified;
  const minRating = req.query.minRating;
  const search = req.query.search;
  const sortBy = String(req.query.sortBy || 'createdAt');
  const sortOrder = String(req.query.sortOrder || 'desc');
  
  const skip = (page - 1) * limit;

  const where: any = {};
  if (sectors) where.sectors = { hasSome: String(sectors).split(',') };
  if (expertise) where.expertise = { hasSome: String(expertise).split(',') };
  if (location) where.location = { contains: String(location), mode: 'insensitive' };
  if (typeof isActive === 'boolean') where.isActive = isActive;
  if (typeof isVerified === 'boolean') where.isVerified = isVerified;
  if (minRating) where.rating = { gte: Number(minRating) };
  if (search) {
    where.OR = [
      { name: { contains: String(search), mode: 'insensitive' } },
      { role: { contains: String(search), mode: 'insensitive' } },
      { bio: { contains: String(search), mode: 'insensitive' } },
      { experience: { contains: String(search), mode: 'insensitive' } },
    ];
  }
  if (!req.user || req.user.role !== 'ADMIN') {
    where.isActive = true;
  }
  
  // Build orderBy with proper validation
  const validSortFields = ['createdAt', 'name', 'rating'];
  const actualSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const orderBy = [{ [actualSortBy]: sortOrder }];

  const [mentors, total] = await Promise.all([
    prisma.mentor.findMany({ where, orderBy, skip, take: limit }),
    prisma.mentor.count({ where }),
  ]);

  return res.json({ 
    success: true, 
    data: { 
      mentors, 
      pagination: { 
        currentPage: page, 
        totalPages: Math.ceil(total / limit), 
        totalMentors: total, 
        hasNext: page < Math.ceil(total / limit), 
        hasPrev: page > 1 
      } 
    } 
  });
}));

// @route   POST /api/mentors
// @desc    Create mentor profile
// @access  Private
router.post('/', authenticate, validate(createMentorSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const existingMentor = await prisma.mentor.findFirst({ where: { email: req.body.email } });
  if (existingMentor) return res.status(400).json({ success: false, message: 'Mentor with this email already exists' });

  const mentor = await prisma.mentor.create({ data: { ...req.body, userId: req.user!.id, expertise: req.body.expertise || [], sectors: req.body.sectors || [] } });
  return res.status(201).json({ success: true, message: 'Mentor profile created successfully', data: { mentor } });
}));

// @route   GET /api/mentors/:id
// @desc    Get mentor by ID
// @access  Public
router.get('/:id', optionalAuth, asyncHandler(async (req: OptionalAuthRequest, res: Response) => {
  const mentor = await prisma.mentor.findUnique({ where: { id: req.params.id } });
  if (!mentor) {
    return res.status(404).json({
      success: false,
      message: 'Mentor not found',
    });
  }

  // Only show active mentors to public
  if (!req.user || req.user.role !== 'ADMIN') {
    if (!mentor.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Mentor profile is not active',
      });
    }
  }

  return res.json({
    success: true,
    data: {
      mentor,
    },
  });
}));

// @route   PUT /api/mentors/:id
// @desc    Update mentor
// @access  Private
router.put('/:id', authenticate, validate(updateMentorSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const mentor = await prisma.mentor.findUnique({ where: { id: req.params.id } });
  if (!mentor) {
    return res.status(404).json({
      success: false,
      message: 'Mentor not found',
    });
  }

  // Check if user can update this mentor
  if (req.user!.role !== 'ADMIN' && req.user!.id !== (mentor.userId || '')) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  }

  // Check if email is being changed and if it's already taken
  if (req.body.email && req.body.email !== mentor.email) {
    const existingMentor = await prisma.mentor.findFirst({ where: { email: req.body.email } });
    if (existingMentor) return res.status(400).json({ success: false, message: 'Email already exists' });
  }

  const updated = await prisma.mentor.update({ where: { id: req.params.id }, data: req.body });
  return res.json({ success: true, message: 'Mentor updated successfully', data: { mentor: updated } });
}));

// @route   DELETE /api/mentors/:id
// @desc    Delete mentor
// @access  Private
router.delete('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const mentor = await prisma.mentor.findUnique({ where: { id: req.params.id } });
  if (!mentor) {
    return res.status(404).json({
      success: false,
      message: 'Mentor not found',
    });
  }

  // Check if user can delete this mentor
  if (req.user!.role !== 'ADMIN' && req.user!.id !== (mentor.userId || '')) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  }

  await prisma.mentor.delete({ where: { id: req.params.id } });

  return res.json({
    success: true,
    message: 'Mentor deleted successfully',
  });
}));

// @route   GET /api/mentors/stats/overview
// @desc    Get mentor statistics overview
// @access  Public
router.get('/stats/overview', asyncHandler(async (_req: Request, res: Response) => {
  const [totalMentors, activeMentors, verifiedMentors] = await Promise.all([
    prisma.mentor.count(),
    prisma.mentor.count({ where: { isActive: true } }),
    prisma.mentor.count({ where: { isVerified: true } }),
  ]);

  const expertiseDistribution = await prisma.mentor.groupBy({ by: ['expertise'], _count: { _all: true } });
  const sectorDistribution = await prisma.mentor.groupBy({ by: ['sectors'], _count: { _all: true } });
  const ratingDistribution = await prisma.mentor.groupBy({ by: ['rating'], _count: { _all: true }, orderBy: { rating: 'asc' } });

  res.json({ success: true, data: { totalMentors, activeMentors, verifiedMentors, expertiseDistribution, sectorDistribution, ratingDistribution } });
}));

export default router;
