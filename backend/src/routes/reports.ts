import express from 'express';
import prisma from '../config/prisma';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const createReportSchema = Joi.object({
  name: Joi.string().min(5).max(200).required(),
  type: Joi.string().min(2).max(50).required(),
  description: Joi.string().max(500),
  parameters: Joi.object().default({}),
  reportConfig: Joi.object({
    format: Joi.string().valid('pdf', 'excel', 'csv', 'json').default('pdf'),
    template: Joi.string(),
    filters: Joi.object(),
    dateRange: Joi.object({
      start: Joi.date(),
      end: Joi.date(),
    }),
  }),
  isPublic: Joi.boolean().default(false),
  tags: Joi.array().items(Joi.string()),
});

const updateReportSchema = Joi.object({
  name: Joi.string().min(5).max(200),
  description: Joi.string().max(500),
  parameters: Joi.object(),
  reportConfig: Joi.object({
    format: Joi.string().valid('pdf', 'excel', 'csv', 'json'),
    template: Joi.string(),
    filters: Joi.object(),
    dateRange: Joi.object({
      start: Joi.date(),
      end: Joi.date(),
    }),
  }),
  isPublic: Joi.boolean(),
  tags: Joi.array().items(Joi.string()),
});

const getReportsQuerySchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10),
  type: Joi.string(),
  status: Joi.string().valid('ready', 'processing', 'error'),
  isPublic: Joi.boolean(),
  search: Joi.string().max(100),
  sortBy: Joi.string().valid('createdAt', 'name', 'dateGenerated', 'fileSize').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

// @route   GET /api/reports
// @desc    Get all reports
// @access  Private
router.get('/', authenticate, validateQuery(getReportsQuerySchema), asyncHandler(async (req, res) => {
  const { page, limit, type, status, isPublic, search, sortBy, sortOrder } = req.query as any;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (type) where.type = { contains: String(type), mode: 'insensitive' };
  if (status) where.status = String(status);
  if (typeof isPublic === 'boolean') where.isPublic = isPublic;
  if (search) {
    where.OR = [
      { name: { contains: String(search), mode: 'insensitive' } },
      { description: { contains: String(search), mode: 'insensitive' } },
      { tags: { hasSome: [String(search)] } },
    ];
  }
  if (req.user.role !== 'ADMIN') {
    where.OR = [{ userId: req.user.id }, { isPublic: true }];
  }

  const orderBy: any = [{ [String(sortBy)]: String(sortOrder) }];

  const [reports, total] = await Promise.all([
    prisma.report.findMany({ where, orderBy, skip, take: Number(limit) }),
    prisma.report.count({ where }),
  ]);

  res.json({ success: true, data: { reports, pagination: { currentPage: Number(page), totalPages: Math.ceil(total / Number(limit)), totalReports: total, hasNext: Number(page) < Math.ceil(total / Number(limit)), hasPrev: Number(page) > 1 } } });
}));

// @route   POST /api/reports
// @desc    Create new report
// @access  Private
router.post('/', authenticate, validate(createReportSchema), asyncHandler(async (req, res) => {
  const data = req.body as any;
  const report = await prisma.report.create({ data: { ...data, userId: req.user.id, processingInfo: { startedAt: new Date(), retryCount: 0 } } });

  setTimeout(async () => {
    try {
      await prisma.report.update({ where: { id: report.id }, data: { status: 'ready', processingInfo: { ...report.processingInfo, completedAt: new Date() }, fileSize: '2.5 MB', filePath: `/reports/${report.id}.pdf`, fileName: `${report.name}.pdf`, mimeType: 'application/pdf' } });
    } catch (error) {
      await prisma.report.update({ where: { id: report.id }, data: { status: 'error', processingInfo: { ...report.processingInfo, errorMessage: 'Report generation failed' } } });
    }
  }, 5000);

  res.status(201).json({ success: true, message: 'Report generation started', data: { report } });
}));

// @route   GET /api/reports/:id
// @desc    Get report by ID
// @access  Private
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const report = await prisma.report.findUnique({ where: { id: req.params.id } });
  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found',
    });
  }

  // Check if user can access this report
  if (req.user.role !== 'ADMIN' && req.user.id !== report.userId && !report.isPublic) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  }

  res.json({
    success: true,
    data: {
      report,
    },
  });
}));

// @route   GET /api/reports/:id/download
// @desc    Download report
// @access  Private
router.get('/:id/download', authenticate, asyncHandler(async (req, res) => {
  const report = await prisma.report.findUnique({ where: { id: req.params.id } });
  
  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found',
    });
  }

  // Check if user can access this report
  if (req.user.role !== 'ADMIN' && req.user.id !== report.userId && !report.isPublic) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  }

  if (report.status !== 'ready') {
    return res.status(400).json({
      success: false,
      message: 'Report is not ready for download',
    });
  }

  if (!report.filePath) {
    return res.status(404).json({
      success: false,
      message: 'Report file not found',
    });
  }

  // TODO: Implement actual file download
  // For now, return a placeholder response
  res.json({ success: true, message: 'Report download initiated', data: { downloadUrl: `/api/reports/${report.id}/file`, fileName: report.fileName, fileSize: report.fileSize } });
}));

// @route   PUT /api/reports/:id
// @desc    Update report
// @access  Private
router.put('/:id', authenticate, validate(updateReportSchema), asyncHandler(async (req, res) => {
  const report = await prisma.report.findUnique({ where: { id: req.params.id } });
  
  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found',
    });
  }

  // Check if user can update this report
  if (req.user.role !== 'ADMIN' && req.user.id !== report.userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  }

  const updated = await prisma.report.update({ where: { id: req.params.id }, data: req.body });
  res.json({ success: true, message: 'Report updated successfully', data: { report: updated } });
}));

// @route   DELETE /api/reports/:id
// @desc    Delete report
// @access  Private
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const report = await prisma.report.findUnique({ where: { id: req.params.id } });
  
  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found',
    });
  }

  // Check if user can delete this report
  if (req.user.role !== 'ADMIN' && req.user.id !== report.userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  }

  // TODO: Delete associated files if they exist
  if (report.filePath) {
    // Delete file from filesystem
  }

  // Delete report record
  await prisma.report.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Report deleted successfully' });
}));

// @route   POST /api/reports/:id/regenerate
// @desc    Regenerate report
// @access  Private
router.post('/:id/regenerate', authenticate, asyncHandler(async (req, res) => {
  const report = await prisma.report.findUnique({ where: { id: req.params.id } });
  
  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found',
    });
  }

  // Check if user can regenerate this report
  if (req.user.role !== 'ADMIN' && req.user.id !== report.userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  }

  // Reset report status
  await prisma.report.update({ where: { id: req.params.id }, data: { status: 'processing', processingInfo: { startedAt: new Date(), retryCount: (report.processingInfo as any)?.retryCount ? (report.processingInfo as any).retryCount + 1 : 1 } } });

  // TODO: Start report generation process in background
  setTimeout(async () => {
    try {
      await prisma.report.update({ where: { id: req.params.id }, data: { status: 'ready', processingInfo: { ...(report.processingInfo as any), completedAt: new Date() }, fileSize: '2.5 MB', filePath: `/reports/${req.params.id}.pdf`, fileName: `${report.name}.pdf`, mimeType: 'application/pdf' } });
    } catch (error) {
      await prisma.report.update({ where: { id: req.params.id }, data: { status: 'error', processingInfo: { ...(report.processingInfo as any), errorMessage: 'Report generation failed' } } });
    }
  }, 5000);

  res.json({ success: true, message: 'Report regeneration started', data: { report } });
}));

// @route   GET /api/reports/stats/overview
// @desc    Get report statistics overview
// @access  Private
router.get('/stats/overview', authenticate, asyncHandler(async (req, res) => {
  const where: any = {};
  if (req.user.role !== 'ADMIN') where.userId = req.user.id;

  const [totalReports, readyReports, processingReports, errorReports, publicReports] = await Promise.all([
    prisma.report.count({ where }),
    prisma.report.count({ where: { ...where, status: 'ready' } }),
    prisma.report.count({ where: { ...where, status: 'processing' } }),
    prisma.report.count({ where: { ...where, status: 'error' } }),
    prisma.report.count({ where: { ...where, isPublic: true } }),
  ]);

  const [typeDistribution, formatDistribution, monthlyReports] = await Promise.all([
    prisma.report.groupBy({ by: ['type'], where, _count: { _all: true }, orderBy: { _count: { _all: 'desc' } } }),
    prisma.report.groupBy({ by: ['reportConfig'], where, _count: { _all: true } }),
    prisma.report.groupBy({ 
      by: ['createdAt'], 
      where: { 
        ...where, 
        createdAt: { 
          gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1)
        }
      }, 
      _count: { _all: true },
      orderBy: { createdAt: 'asc' }
    })
  ]);

  res.json({
    success: true,
    data: {
      totalReports,
      readyReports,
      processingReports,
      errorReports,
      publicReports,
      typeDistribution,
      formatDistribution: formatDistribution.map((item: any) => ({
        _id: item.reportConfig?.format || 'unknown',
        count: item._count._all
      })),
      monthlyReports: monthlyReports.map((item: any) => ({
        _id: {
          year: item.createdAt.getFullYear(),
          month: item.createdAt.getMonth() + 1
        },
        count: item._count._all
      }))
    },
  });
}));

export default router;
