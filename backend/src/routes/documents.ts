import express, { Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../config/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { config } from '../config/env';
import Joi from 'joi';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = config.upload.uploadPath;
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
  const allowedTypes = config.upload.allowedTypes;
  const fileExt = path.extname(file.originalname).toLowerCase().substring(1);
  
  if (allowedTypes.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error(`File type .${fileExt} is not allowed. Allowed types: ${allowedTypes.join(', ')}`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
  }
});

// Validation schemas
const createDocumentSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  description: Joi.string().max(500),
  category: Joi.string().valid('profile', 'startup', 'pitch_deck', 'financial', 'legal', 'other').required(),
  isPublic: Joi.boolean().default(false),
  tags: Joi.array().items(Joi.string()),
});

const updateDocumentSchema = Joi.object({
  name: Joi.string().min(2).max(200),
  description: Joi.string().max(500),
  category: Joi.string().valid('profile', 'startup', 'pitch_deck', 'financial', 'legal', 'other'),
  isPublic: Joi.boolean(),
  tags: Joi.array().items(Joi.string()),
});

const getDocumentsQuerySchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10),
  category: Joi.string().valid('profile', 'startup', 'pitch_deck', 'financial', 'legal', 'other'),
  type: Joi.string(),
  isPublic: Joi.boolean(),
  search: Joi.string().max(100),
  sortBy: Joi.string().valid('createdAt', 'name', 'uploadDate', 'fileSize').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

// @route   GET /api/documents
// @desc    Get all documents
// @access  Private
router.get('/', authenticate, validateQuery(getDocumentsQuerySchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = req.query as {
    page?: string;
    limit?: string;
    category?: string;
    type?: string;
    isPublic?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  };
  
  const page = parseInt(query.page || '1');
  const limit = parseInt(query.limit || '10');
  const { category, type, isPublic, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;
  const skip = (page - 1) * limit;

  // Type definitions for Prisma where clause
  type DocumentWhere = {
    category?: string;
    type?: { contains: string; mode: 'insensitive' };
    isPublic?: boolean;
    OR?: Array<{
      name?: { contains: string; mode: 'insensitive' };
      description?: { contains: string; mode: 'insensitive' };
      tags?: { hasSome: string[] };
      ownerId?: string;
      isPublic?: boolean;
    }>;
    ownerId?: string;
  };

  const where: DocumentWhere = {};
  if (category) where.category = String(category);
  if (type) where.type = { contains: String(type), mode: 'insensitive' };
  if (typeof isPublic === 'string') where.isPublic = isPublic === 'true';
  if (search) {
    where.OR = [
      { name: { contains: String(search), mode: 'insensitive' } },
      { description: { contains: String(search), mode: 'insensitive' } },
      { tags: { hasSome: [String(search)] } },
    ];
  }
  // If not admin, only show user's documents or public documents
  if (req.user && req.user.role !== 'ADMIN') {
    where.OR = [{ ownerId: req.user.id }, { isPublic: true }];
  }

  const orderBy = { [String(sortBy)]: String(sortOrder) as 'asc' | 'desc' };

  const [documents, total] = await Promise.all([
    prisma.documentRef.findMany({ where, orderBy, skip, take: Number(limit) }),
    prisma.documentRef.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      documents,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalDocuments: total,
        hasNext: Number(page) < Math.ceil(total / Number(limit)),
        hasPrev: Number(page) > 1,
      },
    },
  });
}));

// @route   POST /api/documents/upload
// @desc    Upload document
// @access  Private
router.post('/upload', authenticate, upload.single('file'), validate(createDocumentSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  if (!req.user) {
    return res.status(401).json({ success: false, message: 'User not authenticated' });
  }

  const { name, description, category, isPublic, tags } = req.body;
  const fileSizeInBytes = req.file.size;
  const ext = path.extname(req.file.originalname).toLowerCase().substring(1);

  const doc = await prisma.documentRef.create({
    data: {
      ownerId: req.user.id,
      name: name || req.file.originalname,
      type: ext,
      size: fileSizeInBytes,
      path: req.file.path,
      description: description || null,
      category,
      isPublic: String(isPublic) === 'true',
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      tags: tags ? String(tags).split(',') : [],
    },
  });

  return res.status(201).json({ success: true, message: 'Document uploaded successfully', data: { document: doc } });
}));

// @route   GET /api/documents/:id
// @desc    Get document by ID
// @access  Private
router.get('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const document = await prisma.documentRef.findUnique({ where: { id: req.params.id } });
  if (!document) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }

  if (!req.user) {
    return res.status(401).json({ success: false, message: 'User not authenticated' });
  }

  if (req.user.role !== 'admin' && req.user.id !== document.ownerId && !document.isPublic) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  return res.json({ success: true, data: { document } });
}));

// @route   GET /api/documents/:id/download
// @desc    Download document
// @access  Private
router.get('/:id/download', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const document = await prisma.documentRef.findUnique({ where: { id: req.params.id } });
  if (!document) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }

  if (!req.user) {
    return res.status(401).json({ success: false, message: 'User not authenticated' });
  }

  if (req.user.role !== 'admin' && req.user.id !== document.ownerId && !document.isPublic) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  if (!document.path || !fs.existsSync(document.path)) {
    return res.status(404).json({ success: false, message: 'File not found on server' });
  }

  return res.download(document.path, document.originalName || path.basename(document.path));
}));

// @route   PUT /api/documents/:id
// @desc    Update document
// @access  Private
router.put('/:id', authenticate, validate(updateDocumentSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const document = await prisma.documentRef.findUnique({ where: { id: req.params.id } });
  if (!document) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }

  if (!req.user) {
    return res.status(401).json({ success: false, message: 'User not authenticated' });
  }

  if (req.user.role !== 'admin' && req.user.id !== document.ownerId) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const updated = await prisma.documentRef.update({ where: { id: req.params.id }, data: req.body });
  return res.json({ success: true, message: 'Document updated successfully', data: { document: updated } });
}));

// @route   DELETE /api/documents/:id
// @desc    Delete document
// @access  Private
router.delete('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const document = await prisma.documentRef.findUnique({ where: { id: req.params.id } });
  if (!document) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }

  if (!req.user) {
    return res.status(401).json({ success: false, message: 'User not authenticated' });
  }

  if (req.user.role !== 'admin' && req.user.id !== document.ownerId) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  if (document.path && fs.existsSync(document.path)) {
    fs.unlinkSync(document.path);
  }

  await prisma.documentRef.delete({ where: { id: req.params.id } });
  return res.json({ success: true, message: 'Document deleted successfully' });
}));

// @route   GET /api/documents/stats/overview
// @desc    Get document statistics overview
// @access  Private
router.get('/stats/overview', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const where: { ownerId?: string } = {};
  if (req.user && req.user.role !== 'admin') where.ownerId = req.user.id;

  const [totalDocuments, publicDocuments, privateDocuments, categoryAgg, typeAgg, storageSum] = await Promise.all([
    prisma.documentRef.count({ where }),
    prisma.documentRef.count({ where: { ...where, isPublic: true } }),
    prisma.documentRef.count({ where: { ...where, isPublic: false } }),
    prisma.documentRef.groupBy({ by: ['category'], where, _count: { _all: true }, orderBy: { _count: { _all: 'desc' } } }),
    prisma.documentRef.groupBy({ by: ['type'], where, _count: { _all: true }, orderBy: { _count: { _all: 'desc' } } }),
    prisma.documentRef.aggregate({ _sum: { size: true }, where }),
  ]);

  res.json({
    success: true,
    data: {
      totalDocuments,
      publicDocuments,
      privateDocuments,
      categoryDistribution: categoryAgg,
      typeDistribution: typeAgg,
      totalStorageUsed: storageSum._sum.size || 0,
    },
  });
}));

export default router;
