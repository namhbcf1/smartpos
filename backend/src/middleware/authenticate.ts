/**
 * Authentication Middleware - Online-Only POS System
 * JWT-based authentication with role-based access control
 */

import { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  storeId?: string;
  iat: number;
  exp: number;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role: string;
      permissions: string[];
      storeId?: string;
    };
  }

  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authorize: (requiredPermissions: string[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export const authenticateMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({
        status: 'error',
        message: 'Authentication required',
        error: 'NO_TOKEN'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!process.env.JWT_SECRET) {
      request.log.error('JWT_SECRET not configured');
      return reply.code(500).send({
        status: 'error',
        message: 'Server configuration error',
        error: 'JWT_SECRET_MISSING'
      });
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
      
      // Set user information in request
      request.user = {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
        permissions: payload.permissions || [],
        storeId: payload.storeId,
      };

      // Log authentication success for audit
      request.log.info({
        event: 'auth_success',
        userId: payload.userId,
        role: payload.role,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      });

    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        return reply.code(401).send({
          status: 'error',
          message: 'Token has expired',
          error: 'TOKEN_EXPIRED'
        });
      } else if (jwtError instanceof jwt.JsonWebTokenError) {
        return reply.code(401).send({
          status: 'error',
          message: 'Invalid token',
          error: 'TOKEN_INVALID'
        });
      } else {
        throw jwtError;
      }
    }

  } catch (error) {
    request.log.error('Authentication error:', error);
    return reply.code(401).send({
      status: 'error',
      message: 'Authentication failed',
      error: 'AUTH_ERROR'
    });
  }
};

export const authorizeMiddleware = (requiredPermissions: string[]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.code(401).send({
        status: 'error',
        message: 'Authentication required',
        error: 'NOT_AUTHENTICATED'
      });
    }

    const userPermissions = request.user.permissions || [];
    
    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every(permission => {
      // Super admin has all permissions
      if (userPermissions.includes('*')) {
        return true;
      }
      
      // Check specific permission
      return userPermissions.includes(permission);
    });

    if (!hasAllPermissions) {
      // Log authorization failure for audit
      request.log.warn({
        event: 'auth_denied',
        userId: request.user.id,
        role: request.user.role,
        requiredPermissions,
        userPermissions,
        ip: request.ip,
        path: request.url,
      });

      return reply.code(403).send({
        status: 'error',
        message: 'Insufficient permissions',
        error: 'INSUFFICIENT_PERMISSIONS',
        required: requiredPermissions,
      });
    }

    // Log successful authorization for audit trail
    request.log.info({
      event: 'auth_granted',
      userId: request.user.id,
      role: request.user.role,
      permissions: requiredPermissions,
      ip: request.ip,
      path: request.url,
    });
  };
};

// Plugin to register middleware with Fastify
export default async function authPlugin(fastify: any) {
  fastify.decorate('authenticate', authenticateMiddleware);
  fastify.decorate('authorize', authorizeMiddleware);
}