import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/env';
import prisma from '../config/prisma';
import { JwtPayload, RefreshTokenPayload, UserRole } from '../types';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TokenValidationResult {
  valid: boolean;
  payload?: JwtPayload;
  expired?: boolean;
  error?: string;
}

/**
 * Generate access token for user
 */
type MinimalUser = { id: string; email: string; role: UserRole };

export const generateAccessToken = (
  user: MinimalUser
): string => {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (config.jwt.expiresIn || 24 * 60 * 60), // 24 hours default
  };

  return jwt.sign(payload, config.jwt.secret, {
    algorithm: 'HS256',
  });
};

/**
 * Generate refresh token for user
 */
export const generateRefreshToken = async (userId: string): Promise<string> => {
  const tokenId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + (config.jwt.refreshExpiresIn || 30 * 24 * 60 * 60 * 1000)); // 30 days default

  const payload: RefreshTokenPayload = {
    userId,
    tokenId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(expiresAt.getTime() / 1000),
  };

  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret || config.jwt.secret, {
    algorithm: 'HS256',
  });

// Store refresh token session in PostgreSQL via Prisma
  try {
    await prisma.session.create({
      data: {
        userId,
        sessionToken: tokenId,
        refreshToken: tokenId,
        expiresAt,
      },
    });
  } catch (error) {
    console.error('Error storing refresh token:', error);
    // Don't throw - token is still valid even if storage fails
  }

  return refreshToken;
};

/**
 * Generate both access and refresh tokens
 */
export const generateTokenPair = async (
  user: MinimalUser
): Promise<TokenPair> => {
  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user.id);

  return {
    accessToken,
    refreshToken,
    expiresIn: config.jwt.expiresIn || 24 * 60 * 60,
  };
};

/**
 * Validate access token
 */
export const validateAccessToken = (token: string): TokenValidationResult => {
  try {
    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
    return {
      valid: true,
      payload,
    };
  } catch (error) {
    const jwtError = error as jwt.JsonWebTokenError;
    
    return {
      valid: false,
      expired: jwtError.name === 'TokenExpiredError',
      error: jwtError.message,
    };
  }
};

/**
 * Validate refresh token
 */
export const validateRefreshToken = async (token: string): Promise<TokenValidationResult & { tokenId?: string }> => {
  try {
    const payload = jwt.verify(token, config.jwt.refreshSecret || config.jwt.secret) as RefreshTokenPayload;
    
// Check if refresh token exists in database and is not expired
    const session = await prisma.session.findFirst({
      where: {
        refreshToken: payload.tokenId,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      return {
        valid: false,
        error: 'Refresh token not found or expired',
      };
    }

    return {
      valid: true,
      payload: {
        userId: payload.userId,
        email: '', // Will be filled by caller
        role: 'individual' as UserRole, // Will be filled by caller
        iat: payload.iat,
        exp: payload.exp,
      },
      tokenId: payload.tokenId,
    };
  } catch (error) {
    const jwtError = error as jwt.JsonWebTokenError;
    
    return {
      valid: false,
      expired: jwtError.name === 'TokenExpiredError',
      error: jwtError.message,
    };
  }
};

/**
 * Revoke refresh token
 */
export const revokeRefreshToken = async (tokenId: string): Promise<boolean> => {
  try {
    const result = await prisma.session.deleteMany({ where: { refreshToken: tokenId } });
    return result.count > 0;
  } catch (error) {
    console.error('Error revoking refresh token:', error);
    return false;
  }
};

/**
 * Revoke all refresh tokens for a user
 */
export const revokeAllUserTokens = async (userId: string): Promise<boolean> => {
  try {
    const result = await prisma.session.deleteMany({ where: { userId } });
    return result.count > 0;
  } catch (error) {
    console.error('Error revoking all user tokens:', error);
    return false;
  }
};

/**
 * Clean up expired tokens (should be called periodically)
 */
export const cleanupExpiredTokens = async (): Promise<number> => {
  try {
    const result = await prisma.session.deleteMany({ where: { expiresAt: { lte: new Date() } } });
    console.log(`Cleaned up ${result.count} expired tokens`);
    return result.count || 0;
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
    return 0;
  }
};

/**
 * Get user's active sessions
 */
export const getUserActiveSessions = async (userId: string): Promise<Array<{
  id: string;
  createdAt: Date;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
}>> => {
  try {
    const sessions = await prisma.session.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true, ipAddress: true, userAgent: true, expiresAt: true },
    });
    return sessions.map(s => ({
      id: s.id,
      createdAt: s.createdAt,
      ipAddress: s.ipAddress || undefined,
      userAgent: s.userAgent || undefined,
      expiresAt: s.expiresAt,
    }));
  } catch (error) {
    console.error('Error getting user active sessions:', error);
    return [];
  }
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};