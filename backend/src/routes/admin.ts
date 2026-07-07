import express, { Request, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validation';
import prisma from '../config/prisma';
import Joi from 'joi';

const router = express.Router();

// Protect all admin routes
router.use(authenticate);
router.use(authorize('admin'));

// Validation schemas
const createUserSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('individual', 'enterprise', 'admin').required(),
});

const updateUserSchema = Joi.object({
  fullName: Joi.string().min(2).max(100),
  email: Joi.string().email(),
  username: Joi.string().alphanum().min(3).max(30),
  role: Joi.string().valid('individual', 'enterprise', 'admin'),
  profileComplete: Joi.boolean(),
  isEmailVerified: Joi.boolean(),
});

// Dashboard stats endpoint
router.get('/stats', asyncHandler(async (req: AuthRequest, res: Response) => {
  const [userCount, startupCount, mentorCount, investorCount, eventCount] = await Promise.all([
    prisma.user.count(),
    prisma.startup.count(),
    prisma.mentor.count(),
    prisma.investor.count(),
    prisma.event.count(),
  ]);
  
  const recentStartups = await prisma.startup.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { user: { select: { fullName: true, email: true } } },
  });
  
  const stats = {
    overview: {
      totalUsers: userCount,
      totalStartups: startupCount,
      totalMentors: mentorCount,
      totalInvestors: investorCount,
      totalEvents: eventCount,
    },
    recentActivity: {
      recentStartups,
    },
  };
  
  res.json({
    success: true,
    data: stats,
  });
}));

// User Management
router.get('/users', asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string;
  const role = req.query.role as string;
  
  const where: any = {};
  
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { username: { contains: search, mode: 'insensitive' } },
    ];
  }
  
  if (role) {
    where.role = role;
  }
  
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        username: true,
        role: true,
        profileComplete: true,
        isEmailVerified: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    }),
  ]);
  
  res.json({
    success: true,
    data: {
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    },
  });
}));

router.get('/users/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      fullName: true,
      email: true,
      username: true,
      role: true,
      profileComplete: true,
      isEmailVerified: true,
      lastLogin: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }
  
  res.json({
    success: true,
    data: { user },
  });
}));

router.post('/users', validate(createUserSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { fullName, email, username, password, role } = req.body;
  
  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }]
    }
  });
  
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: existingUser.email === email ? 'Email already exists' : 'Username already exists',
    });
  }
  
  // Hash password
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);
  
  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      username,
      passwordHash,
      role: role.toUpperCase(), // Convert to match Prisma enum
      isEmailVerified: true, // Admin-created users are pre-verified
    },
  });
  
  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: { user: { ...user, passwordHash: undefined } },
  });
}));

router.put('/users/:id', validate(updateUserSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const updateData: any = { ...req.body };
  if (updateData.role) {
    updateData.role = updateData.role.toUpperCase(); // Convert to match Prisma enum
  }
  
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: updateData,
    select: {
      id: true,
      fullName: true,
      email: true,
      username: true,
      role: true,
      profileComplete: true,
      isEmailVerified: true,
      lastLogin: true,
      createdAt: true,
      updatedAt: true,
    },
  }).catch(() => null);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }
  
  res.json({
    success: true,
    message: 'User updated successfully',
    data: { user },
  });
}));

router.delete('/users/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  // Check if user exists first
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }
  
  // Delete associated data in a transaction
  await prisma.$transaction(async (tx) => {
    // Delete associated profiles
    await tx.profile.deleteMany({ where: { userId: req.params.id } });
    // Delete associated startups
    await tx.startup.deleteMany({ where: { userId: req.params.id } });
    // Delete associated mentors
    await tx.mentor.deleteMany({ where: { userId: req.params.id } });
    // Delete associated investors
    await tx.investor.deleteMany({ where: { userId: req.params.id } });
    // Delete user sessions
    await tx.session.deleteMany({ where: { userId: req.params.id } });
    // Finally delete the user
    await tx.user.delete({ where: { id: req.params.id } });
  });
  
  res.json({
    success: true,
    message: 'User deleted successfully',
  });
}));

// Startup Management
router.get('/startups', asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string;
  const status = req.query.status as string;
  const type = req.query.type as string;
  
  const where: any = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { founder: { contains: search, mode: 'insensitive' } },
      { sector: { contains: search, mode: 'insensitive' } },
    ];
  }
  
  if (status) {
    where.status = status;
  }
  
  if (type) {
    where.type = type;
  }
  
  const [total, startups] = await Promise.all([
    prisma.startup.count({ where }),
    prisma.startup.findMany({
      where,
      include: {
        user: { select: { fullName: true, email: true } },
        assignedMentor: { select: { name: true, email: true } },
        assignedInvestor: { select: { name: true, firm: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    }),
  ]);
  
  res.json({
    success: true,
    data: {
      startups,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    },
  });
}));

router.get('/startups/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const startup = await prisma.startup.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { fullName: true, email: true } },
      assignedMentor: { select: { name: true, email: true, role: true } },
      assignedInvestor: { select: { name: true, firm: true, email: true } },
    },
  });
  
  if (!startup) {
    return res.status(404).json({
      success: false,
      message: 'Startup not found',
    });
  }
  
  res.json({
    success: true,
    data: { startup },
  });
}));

router.put('/startups/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const startup = await prisma.startup.update({
    where: { id: req.params.id },
    data: req.body,
    include: {
      user: { select: { fullName: true, email: true } },
    },
  }).catch(() => null);
  
  if (!startup) {
    return res.status(404).json({
      success: false,
      message: 'Startup not found',
    });
  }
  
  res.json({
    success: true,
    message: 'Startup updated successfully',
    data: { startup },
  });
}));

router.delete('/startups/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const startup = await prisma.startup.delete({
    where: { id: req.params.id },
  }).catch(() => null);
  
  if (!startup) {
    return res.status(404).json({
      success: false,
      message: 'Startup not found',
    });
  }
  
  res.json({
    success: true,
    message: 'Startup deleted successfully',
  });
}));

// Application Management
router.put('/startups/:id/approve', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { reviewNotes, assignedMentor, assignedInvestor } = req.body;
  
  const startup = await prisma.startup.update({
    where: { id: req.params.id },
    data: {
      applicationStatus: 'approved',
      status: 'active',
      reviewNotes,
      assignedMentorId: assignedMentor,
      assignedInvestorId: assignedInvestor,
    },
    include: {
      user: { select: { fullName: true, email: true } },
    },
  }).catch(() => null);
  
  if (!startup) {
    return res.status(404).json({
      success: false,
      message: 'Startup not found',
    });
  }
  
  res.json({
    success: true,
    message: 'Startup application approved',
    data: { startup },
  });
}));

router.put('/startups/:id/reject', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { reviewNotes } = req.body;
  
  const startup = await prisma.startup.update({
    where: { id: req.params.id },
    data: {
      applicationStatus: 'rejected',
      reviewNotes,
    },
    include: {
      user: { select: { fullName: true, email: true } },
    },
  }).catch(() => null);
  
  if (!startup) {
    return res.status(404).json({
      success: false,
      message: 'Startup not found',
    });
  }
  
  res.json({
    success: true,
    message: 'Startup application rejected',
    data: { startup },
  });
}));

// Mentor Management
router.get('/mentors', asyncHandler(async (req: AuthRequest, res: Response) => {
  const mentors = await prisma.mentor.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({
    success: true,
    data: { mentors },
  });
}));

router.post('/mentors', asyncHandler(async (req: AuthRequest, res: Response) => {
  const mentor = await prisma.mentor.create({ data: req.body });
  
  res.status(201).json({
    success: true,
    message: 'Mentor created successfully',
    data: { mentor },
  });
}));

router.put('/mentors/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const mentor = await prisma.mentor.update({
    where: { id: req.params.id },
    data: req.body,
  }).catch(() => null);
  
  if (!mentor) {
    return res.status(404).json({
      success: false,
      message: 'Mentor not found',
    });
  }
  
  res.json({
    success: true,
    message: 'Mentor updated successfully',
    data: { mentor },
  });
}));

router.delete('/mentors/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const mentor = await prisma.mentor.delete({
    where: { id: req.params.id },
  }).catch(() => null);
  
  if (!mentor) {
    return res.status(404).json({
      success: false,
      message: 'Mentor not found',
    });
  }
  
  res.json({
    success: true,
    message: 'Mentor deleted successfully',
  });
}));

// Investor Management
router.get('/investors', asyncHandler(async (req: AuthRequest, res: Response) => {
  const investors = await prisma.investor.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({
    success: true,
    data: { investors },
  });
}));

router.post('/investors', asyncHandler(async (req: AuthRequest, res: Response) => {
  const investor = await prisma.investor.create({ data: req.body });
  
  res.status(201).json({
    success: true,
    message: 'Investor created successfully',
    data: { investor },
  });
}));

router.put('/investors/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const investor = await prisma.investor.update({
    where: { id: req.params.id },
    data: req.body,
  }).catch(() => null);
  
  if (!investor) {
    return res.status(404).json({
      success: false,
      message: 'Investor not found',
    });
  }
  
  res.json({
    success: true,
    message: 'Investor updated successfully',
    data: { investor },
  });
}));

router.delete('/investors/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const investor = await prisma.investor.delete({
    where: { id: req.params.id },
  }).catch(() => null);
  
  if (!investor) {
    return res.status(404).json({
      success: false,
      message: 'Investor not found',
    });
  }
  
  res.json({
    success: true,
    message: 'Investor deleted successfully',
  });
}));

// Settings Management
router.get('/settings', asyncHandler(async (req: AuthRequest, res: Response) => {
  // Return current admin settings
  const settings = {
    email: {
      notificationsEnabled: true,
      adminEmail: process.env.ADMIN_EMAIL || 'admin@citbif.com',
    },
    application: {
      autoApprovalEnabled: false,
      maxFileSize: '10MB',
      allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
    },
    system: {
      maintenanceMode: false,
      registrationEnabled: true,
    },
  };
  
  res.json({
    success: true,
    data: { settings },
  });
}));

router.put('/settings', asyncHandler(async (req: AuthRequest, res: Response) => {
  // In a real application, these settings would be stored in database
  // For now, we'll just return the updated settings
  const updatedSettings = req.body;
  
  res.json({
    success: true,
    message: 'Settings updated successfully',
    data: { settings: updatedSettings },
  });
}));

export default router;
