import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import prisma from '../config/prisma';
import { JwtPayload, UserRole } from '../types';

// Define a User type based on what Prisma returns
interface PrismaUser {
  id: string;
  email: string;
  fullName: string;
  username: string;
  role: UserRole;
  profileComplete: boolean;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Define extended user with _id for compatibility
interface ExtendedUser extends PrismaUser {
  _id?: string;
}

export interface AuthRequest extends Request {
  user?: ExtendedUser;
  userId?: string;
}

// Optional: user activity logging can be implemented via Prisma if needed.
async function logUserActivity(
  userId: string,
  activityType: string,
  action: string,
  description: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  // No-op for now - parameters available for future implementation
  console.log(`User activity: ${userId} - ${activityType}:${action} - ${description}`, {
    ipAddress,
    userAgent
  });
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user) {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid token. User not found.' 
      });
      return;
    }

    // Log user activity (optional)
    await logUserActivity(decoded.userId, 'auth', 'token_verified', 'User authenticated successfully', req.ip, req.get('User-Agent') || undefined);

    // Backward-compat shape for routes expecting _id
    const extendedUser: ExtendedUser = { ...user, _id: user.id };
    req.user = extendedUser;
    req.userId = user.id;
    next();
  } catch (error: unknown) {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid token.',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

// Role-based authorization
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        success: false, 
        message: 'Access denied. No user found.' 
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ 
        success: false, 
        message: 'Access denied. Insufficient permissions.',
        requiredRoles: roles,
        userRole: req.user.role
      });
      return;
    }

    next();
  };
};

// Admin-only authorization
export const requireAdmin = () => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        res.status(403).json({ 
          success: false, 
          message: 'Access denied. Admin privileges required.' 
        });
        return;
      }

      // No fine-grained permissions in current Prisma schema; allow admin role
      next();
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Error verifying admin permissions.',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  };
};

// Super admin only access (not implemented in Prisma schema)
export const requireSuperAdmin = () => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.role !== 'ADMIN') {
      res.status(403).json({ 
        success: false, 
        message: 'Access denied. Super admin privileges required.'
      });
      return;
    }
    next();
  };
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (user) {
        const extendedUser: ExtendedUser = { ...user, _id: user.id };
        req.user = extendedUser;
      }
    }
    
    next();
  } catch {
    // If token is invalid, continue without user
    next();
  }
};
