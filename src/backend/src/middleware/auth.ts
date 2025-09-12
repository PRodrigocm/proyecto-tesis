import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types';

interface JWTPayload {
  userId: number;
  email: string;
  rol: string;
  idIe?: number;
}

// Extend Express Request type to include user
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email: string;
    rol: string;
    idIe?: number;
  };
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }

    req.user = decoded as JWTPayload;
    next();
  });
};

export const requireRole = (roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!roles.includes(req.user.rol as UserRole)) {
      return res.status(403).json({ error: 'Permisos insuficientes' });
    }

    next();
  };
};

export const requireAdmin = requireRole([UserRole.ADMIN]);
export const requireAdminOrAdministrativo = requireRole([UserRole.ADMIN, UserRole.ADMINISTRATIVO]);
export const requireDocente = requireRole([UserRole.DOCENTE]);
export const requireApoderado = requireRole([UserRole.APODERADO]);
