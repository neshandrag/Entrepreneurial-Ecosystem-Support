import express, { Request, Response } from 'express';
import { authenticate, optionalAuth, AuthRequest, requireAdmin } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import prisma from '../config/prisma';
import Joi from 'joi';
import crypto from 'crypto';

const router = express.Router();

// Validation schemas
const createStartupSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  founder: Joi.string().min(2).max(100).required(),
  sector: Joi.string().min(2).max(100).required(),
  type: Joi.string().valid('innovation', 'incubation').required(),
  trlLevel: Joi.number().min(1).max(9).required(),
  email: Joi.string().email().required(),
  description: Joi.string().max(1000).allow('', null),
  website: Joi.string().uri().allow('', null),
  linkedinProfile: Joi.string().uri().allow('', null),
  teamSize: Joi.number().min(1).allow(null),
  foundedYear: Joi.number().min(1900).max(new Date().getFullYear()).allow(null),
  location: Joi.string().max(100).allow('', null),
  coFounderNames: Joi.array().items(Joi.string().max(100)).allow(null),
  applicationStatus: Joi.string().valid('draft', 'submitted', 'under_review', 'approved', 'rejected').default('draft'),
  previouslyIncubated: Joi.boolean().default(false),
  incubatorName: Joi.string().max(200).allow('', null),
  incubatorLocation: Joi.string().max(200).allow('', null),
  incubationDuration: Joi.string().max(100).allow('', null),
  incubatorType: Joi.string().max(100).allow('', null),
  incubationMode: Joi.string().valid('online', 'offline', 'hybrid').allow(null),
  supportsReceived: Joi.array().items(Joi.string().max(200)).allow(null),
  aadhaarDoc: Joi.string().uri().allow('', null),
  incorporationCert: Joi.string().uri().allow('', null),
  msmeCert: Joi.string().uri().allow('', null),
  dpiitCert: Joi.string().uri().allow('', null),
  mouPartnership: Joi.string().uri().allow('', null),
  businessDocuments: Joi.array().items(Joi.string().uri()).allow(null),
  tractionDetails: Joi.string().max(2000).allow('', null),
  balanceSheet: Joi.string().uri().allow('', null),
  fundingStage: Joi.string().max(100).allow('', null),
  alreadyFunded: Joi.boolean().default(false),
  fundingAmount: Joi.number().min(0).allow(null),
  fundingSource: Joi.string().max(200).allow('', null),
  fundingDate: Joi.date().iso().allow(null),
});

const updateStartupSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  founder: Joi.string().min(2).max(100),
  sector: Joi.string().min(2).max(100),
  type: Joi.string().valid('innovation', 'incubation'),
  trlLevel: Joi.number().min(1).max(9),
  email: Joi.string().email(),
  description: Joi.string().max(1000).allow('', null),
  website: Joi.string().uri().allow('', null),
  linkedinProfile: Joi.string().uri().allow('', null),
  teamSize: Joi.number().min(1).allow(null),
  foundedYear: Joi.number().min(1900).max(new Date().getFullYear()).allow(null),
  location: Joi.string().max(100).allow('', null),
  coFounderNames: Joi.array().items(Joi.string().max(100)).allow(null),
  status: Joi.string().valid('pending', 'active', 'completed', 'dropout'),
  applicationStatus: Joi.string().valid('draft', 'submitted', 'under_review', 'approved', 'rejected'),
  reviewNotes: Joi.string().max(1000).allow('', null),
  previouslyIncubated: Joi.boolean(),
  incubatorName: Joi.string().max(200).allow('', null),
  incubatorLocation: Joi.string().max(200).allow('', null),
  incubationDuration: Joi.string().max(100).allow('', null),
  incubatorType: Joi.string().max(100).allow('', null),
  incubationMode: Joi.string().valid('online', 'offline', 'hybrid').allow(null),
  supportsReceived: Joi.array().items(Joi.string().max(200)).allow(null),
  aadhaarDoc: Joi.string().uri().allow('', null),
  incorporationCert: Joi.string().uri().allow('', null),
  msmeCert: Joi.string().uri().allow('', null),
  dpiitCert: Joi.string().uri().allow('', null),
  mouPartnership: Joi.string().uri().allow('', null),
  businessDocuments: Joi.array().items(Joi.string().uri()).allow(null),
  tractionDetails: Joi.string().max(2000).allow('', null),
  balanceSheet: Joi.string().uri().allow('', null),
  fundingStage: Joi.string().max(100).allow('', null),
  alreadyFunded: Joi.boolean(),
  fundingAmount: Joi.number().min(0).allow(null),
  fundingSource: Joi.string().max(200).allow('', null),
  fundingDate: Joi.date().iso().allow(null),
}).min(1);

const getStartupsQuerySchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10),
  type: Joi.string().valid('innovation', 'incubation'),
  status: Joi.string().valid('pending', 'active', 'completed', 'dropout'),
  applicationStatus: Joi.string().valid('draft', 'submitted', 'under_review', 'approved', 'rejected'),
  sector: Joi.string(),
  trlLevel: Joi.number().min(1).max(9),
  search: Joi.string().max(100),
  sortBy: Joi.string().valid('createdAt', 'name', 'submissionDate', 'trlLevel').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

// Get current user's startup (dashboard)
router.get('/dashboard/my-startup', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const startup = await prisma.startup.findFirst({ where: { userId: req.user!.id } });
  if (!startup) return res.status(404).json({ success: false, message: 'No startup found for this user' });
  return res.json({ success: true, data: { startup } });
}));

// Progress endpoint
router.get('/dashboard/progress', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const startup = await prisma.startup.findFirst({ where: { userId: req.user!.id } });
  if (!startup) return res.status(404).json({ success: false, message: 'No startup found for this user' });

  const requiredFields = ['name','founder','sector','type','trlLevel','email','description','website','linkedinProfile','location'];
  let completedFields = 0;
  requiredFields.forEach((f) => { if ((startup as any)[f]) completedFields++; });

  const profileCompletion = 0; // profile removed in Postgres-only migration for now
  const overallProgress = Math.round(((completedFields / requiredFields.length) * 50) + (profileCompletion * 0.5));

  const progress = {
    overallProgress,
    startupInfoProgress: Math.round((completedFields / requiredFields.length) * 100),
    profileProgress: profileCompletion,
    applicationStatus: startup.applicationStatus,
    status: startup.status,
    nextSteps: overallProgress < 100 ? ['Complete missing fields', 'Submit application'] : ['Await review'],
  };

  return res.json({ success: true, data: { progress } });
}));

// @route   GET /api/startups/dashboard/milestones
// @desc    Get startup milestones
// @access  Private
router.get('/dashboard/milestones', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const startup = await prisma.startup.findFirst({ where: { userId: req.user!.id } });
  if (!startup) return res.status(404).json({ success: false, message: 'No startup found for this user' });

  let milestones = (startup.milestones as any[]) || [];
  if (milestones.length === 0 && startup.applicationStatus === 'APPROVED') {
    milestones = [
      { id: crypto.randomUUID(), name: 'Complete Business Plan', description: 'Finalize your business plan with mentor guidance', targetDate: new Date(Date.now() + 30*24*60*60*1000), status: 'pending' },
      { id: crypto.randomUUID(), name: 'MVP Development', description: 'Develop your minimum viable product', targetDate: new Date(Date.now() + 90*24*60*60*1000), status: 'pending' },
      { id: crypto.randomUUID(), name: 'Market Validation', description: 'Validate your product in the market', targetDate: new Date(Date.now() + 120*24*60*60*1000), status: 'pending' },
    ];
    await prisma.startup.update({ where: { id: startup.id }, data: { milestones } });
  }

  return res.json({ success: true, data: { milestones } });
}));

// @route   PUT /api/startups/dashboard/milestones/:milestoneId
// @desc    Update milestone status
// @access  Private
router.put('/dashboard/milestones/:milestoneId', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, completedDate } = req.body as { status: string; completedDate?: string };
  const startup = await prisma.startup.findFirst({ where: { userId: req.user!.id } });
  if (!startup) return res.status(404).json({ success: false, message: 'No startup found for this user' });

  const milestones = (startup.milestones as any[]) || [];
  const idx = milestones.findIndex(m => m.id === req.params.milestoneId);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Milestone not found' });
  milestones[idx].status = status;
  if (status === 'completed' && completedDate) milestones[idx].completedDate = new Date(completedDate);

  await prisma.startup.update({ where: { id: startup.id }, data: { milestones } });
  return res.json({ success: true, message: 'Milestone updated successfully', data: { milestone: milestones[idx] } });
}));

// @route   GET /api/startups/stats/overview
// @desc    Get startup statistics overview
// @access  Public
router.get('/stats/overview', asyncHandler(async (_req: Request, res: Response) => {
  const totalStartups = await prisma.startup.count();
  const innovationStartups = await prisma.startup.count({ where: { type: 'INNOVATION' } });
  const incubationStartups = await prisma.startup.count({ where: { type: 'INCUBATION' } });
  const activeStartups = await prisma.startup.count({ where: { status: 'ACTIVE' } });
  const approvedStartups = await prisma.startup.count({ where: { applicationStatus: 'APPROVED' } });
  const pendingStartups = await prisma.startup.count({ where: { applicationStatus: 'DRAFT' } });
  const dropoutStartups = await prisma.startup.count({ where: { status: 'DROPOUT' } });

  const trlDistribution = await prisma.startup.groupBy({ 
    by: ['trlLevel'], 
    _count: { _all: true },
    orderBy: { trlLevel: 'asc' } 
  });
  
  const sectorDistribution = await prisma.startup.groupBy({ 
    by: ['sector'], 
    _count: { _all: true }
  });

  res.json({ success: true, data: { totalStartups, innovationStartups, incubationStartups, activeStartups, approvedStartups, pendingStartups, dropoutStartups, trlDistribution, sectorDistribution } });
}));

// @route   GET /api/startups/with-documents
// @desc    Get startups with their documents (admin only)
// @access  Private/Admin
router.get('/with-documents', authenticate, requireAdmin(), validateQuery(getStartupsQuerySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit, type, status, applicationStatus, sector, trlLevel, search, sortBy, sortOrder } = req.query as any;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (type) where.type = String(type).toUpperCase();
  if (status) where.status = String(status).toUpperCase();
  if (applicationStatus) where.applicationStatus = String(applicationStatus).toUpperCase();
  if (sector) where.sector = { contains: String(sector), mode: 'insensitive' };
  if (trlLevel) where.trlLevel = Number(trlLevel);
  if (search) {
    where.OR = [
      { name: { contains: String(search), mode: 'insensitive' } },
      { founder: { contains: String(search), mode: 'insensitive' } },
      { sector: { contains: String(search), mode: 'insensitive' } },
      { description: { contains: String(search), mode: 'insensitive' } },
    ];
  }

  const orderBy: any = [{ [String(sortBy)]: String(sortOrder) }];

  const startups = await prisma.startup.findMany({ where, orderBy, skip, take: Number(limit) });
  const total = await prisma.startup.count({ where });

  const startupsWithDocuments = await Promise.all(startups.map(async (s) => {
    const documents = await prisma.documentRef.findMany({
      where: { ownerId: s.userId },
      orderBy: { uploadedAt: 'desc' },
      select: { id: true, name: true, path: true, size: true, uploadedAt: true, type: true, category: true, description: true },
    });

    const profileDocuments: any[] = [];
    if (s.aadhaarDoc) profileDocuments.push({ name: 'Aadhaar Card', type: 'pdf', category: 'profile', uploadDate: s.createdAt, description: 'Aadhaar card document', source: 'profile' });
    if (s.incorporationCert) profileDocuments.push({ name: 'Incorporation Certificate', type: 'pdf', category: 'profile', uploadDate: s.createdAt, description: 'Company incorporation cert', source: 'profile' });
    if (s.msmeCert) profileDocuments.push({ name: 'MSME Certificate', type: 'pdf', category: 'profile', uploadDate: s.createdAt, description: 'MSME certificate', source: 'profile' });
    if (s.dpiitCert) profileDocuments.push({ name: 'DPIIT Certificate', type: 'pdf', category: 'profile', uploadDate: s.createdAt, description: 'DPIIT certificate', source: 'profile' });
    if (s.mouPartnership) profileDocuments.push({ name: 'MOU/Partnership', type: 'pdf', category: 'profile', uploadDate: s.createdAt, description: 'Partnership/MOU', source: 'profile' });

    return {
      ...s,
      documents,
      documentCount: documents.length + profileDocuments.length,
      userId: { _id: s.userId, fullName: '', email: s.email, username: '' },
      profileDocuments,
    } as any;
  }));

  res.json({ success: true, data: { startups: startupsWithDocuments, pagination: { currentPage: Number(page), totalPages: Math.ceil(total / Number(limit)), totalStartups: total, hasNext: Number(page) < Math.ceil(total / Number(limit)), hasPrev: Number(page) > 1 } } });
}));

// @route   GET /api/startups
// @desc    Get all startups
// @access  Public (with optional auth for filtering)
router.get('/', optionalAuth, validateQuery(getStartupsQuerySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit, type, status, applicationStatus, sector, trlLevel, search, sortBy, sortOrder } = req.query as any;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (type) where.type = String(type).toUpperCase();
  if (status) where.status = String(status).toUpperCase();
  if (applicationStatus) where.applicationStatus = String(applicationStatus).toUpperCase();
  if (sector) where.sector = { contains: String(sector), mode: 'insensitive' };
  if (trlLevel) where.trlLevel = Number(trlLevel);
  
  if (search) {
    where.OR = [
      { name: { contains: String(search), mode: 'insensitive' } },
      { founder: { contains: String(search), mode: 'insensitive' } },
      { sector: { contains: String(search), mode: 'insensitive' } },
      { description: { contains: String(search), mode: 'insensitive' } },
    ];
  }

  // If not admin, only show approved startups
  if (!req.user || req.user.role !== 'ADMIN') {
    where.applicationStatus = 'APPROVED';
  }

  const orderBy = [{ [String(sortBy)]: String(sortOrder) }];
  const [startups, total] = await Promise.all([
    prisma.startup.findMany({
      where,
      orderBy: orderBy as any,
      skip,
      take: Number(limit),
      include: {
        user: { select: { fullName: true, email: true, username: true } }
      }
    }),
    prisma.startup.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      startups,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalStartups: total,
        hasNext: Number(page) < Math.ceil(total / Number(limit)),
        hasPrev: Number(page) > 1,
      },
    },
  });
}));

// @route   POST /api/startups
// @desc    Create new startup application
// @access  Private
router.post('/', authenticate, validate(createStartupSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = req.body as any;
  const created = await prisma.startup.create({
    data: {
      userId: req.user!.id,
      name: data.name,
      founder: data.founder,
      sector: data.sector,
      type: data.type === 'incubation' ? 'INCUBATION' : 'INNOVATION',
      trlLevel: data.trlLevel,
      email: data.email,
      description: data.description || null,
      website: data.website || null,
      linkedinProfile: data.linkedinProfile || null,
      teamSize: data.teamSize || null,
      foundedYear: data.foundedYear || null,
      location: data.location || null,
      coFounderNames: data.coFounderNames || [],
      applicationStatus: (data.applicationStatus || 'draft').toUpperCase(),
      previouslyIncubated: !!data.previouslyIncubated,
      incubatorName: data.incubatorName || null,
      incubatorLocation: data.incubatorLocation || null,
      incubationDuration: data.incubationDuration || null,
      incubatorType: data.incubatorType || null,
      incubationMode: data.incubationMode || null,
      supportsReceived: data.supportsReceived || [],
      aadhaarDoc: data.aadhaarDoc || null,
      incorporationCert: data.incorporationCert || null,
      msmeCert: data.msmeCert || null,
      dpiitCert: data.dpiitCert || null,
      mouPartnership: data.mouPartnership || null,
      businessDocuments: data.businessDocuments || [],
      tractionDetails: data.tractionDetails || null,
      balanceSheet: data.balanceSheet || null,
      fundingStage: data.fundingStage || null,
      alreadyFunded: !!data.alreadyFunded,
      fundingAmount: data.fundingAmount || null,
      fundingSource: data.fundingSource || null,
      fundingDate: data.fundingDate ? new Date(data.fundingDate) : null,
    },
  });
  return res.status(201).json({ success: true, message: 'Startup created successfully', data: created });
}));

// @route   GET /api/startups/:id
// @desc    Get startup by ID
// @access  Public
router.get('/:id', optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const startup = await prisma.startup.findUnique({
    where: { id: req.params.id },
    include: { user: { select: { fullName: true, email: true, username: true } } }
  });
  
  if (!startup) {
    return res.status(404).json({ success: false, message: 'Startup not found' });
  }

  // Check if user can view this startup
  if (!req.user || (req.user.role !== 'ADMIN' && req.user.id !== startup.userId)) {
    // Only show approved startups to non-owners
    if (startup.applicationStatus !== 'APPROVED') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
  }

  return res.json({ success: true, data: { startup } });
}));

// Update startup
router.put('/:id', authenticate, validate(updateStartupSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const startup = await prisma.startup.findUnique({ where: { id: req.params.id } });
  if (!startup) return res.status(404).json({ success: false, message: 'Startup not found' });
  if (startup.userId !== req.user!.id && req.user!.role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Access denied' });

  const data = req.body as any;
  const updated = await prisma.startup.update({ where: { id: req.params.id }, data: {
    name: data.name ?? startup.name,
    founder: data.founder ?? startup.founder,
    sector: data.sector ?? startup.sector,
    type: data.type ? (data.type === 'incubation' ? 'INCUBATION' : 'INNOVATION') : startup.type,
    trlLevel: data.trlLevel ?? startup.trlLevel,
    email: data.email ?? startup.email,
    description: data.description ?? startup.description,
    website: data.website ?? startup.website,
    linkedinProfile: data.linkedinProfile ?? startup.linkedinProfile,
    teamSize: data.teamSize ?? startup.teamSize,
    foundedYear: data.foundedYear ?? startup.foundedYear,
    location: data.location ?? startup.location,
    coFounderNames: data.coFounderNames ?? startup.coFounderNames,
    status: data.status ? String(data.status).toUpperCase() : startup.status,
    applicationStatus: data.applicationStatus ? String(data.applicationStatus).toUpperCase() : startup.applicationStatus,
    previouslyIncubated: data.previouslyIncubated ?? startup.previouslyIncubated,
    incubatorName: data.incubatorName ?? startup.incubatorName,
    incubatorLocation: data.incubatorLocation ?? startup.incubatorLocation,
    incubationDuration: data.incubationDuration ?? startup.incubationDuration,
    incubatorType: data.incubatorType ?? startup.incubatorType,
    incubationMode: data.incubationMode ?? startup.incubationMode,
    supportsReceived: data.supportsReceived ?? startup.supportsReceived,
    aadhaarDoc: data.aadhaarDoc ?? startup.aadhaarDoc,
    incorporationCert: data.incorporationCert ?? startup.incorporationCert,
    msmeCert: data.msmeCert ?? startup.msmeCert,
    dpiitCert: data.dpiitCert ?? startup.dpiitCert,
    mouPartnership: data.mouPartnership ?? startup.mouPartnership,
    businessDocuments: data.businessDocuments ?? startup.businessDocuments,
    tractionDetails: data.tractionDetails ?? startup.tractionDetails,
    balanceSheet: data.balanceSheet ?? startup.balanceSheet,
    fundingStage: data.fundingStage ?? startup.fundingStage,
    alreadyFunded: data.alreadyFunded ?? startup.alreadyFunded,
    fundingAmount: data.fundingAmount ?? startup.fundingAmount,
    fundingSource: data.fundingSource ?? startup.fundingSource,
    fundingDate: data.fundingDate ? new Date(data.fundingDate) : startup.fundingDate,
  } });

  return res.json({ success: true, message: 'Startup updated successfully', data: updated });
}));

// @route   DELETE /api/startups/:id
// @desc    Delete startup
// @access  Private
router.delete('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const startup = await prisma.startup.findUnique({ where: { id: req.params.id } });
  
  if (!startup) {
    return res.status(404).json({ success: false, message: 'Startup not found' });
  }

  if (startup.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  await prisma.startup.delete({ where: { id: req.params.id } });
  return res.json({ success: true, message: 'Startup deleted successfully' });
}));

export default router;
