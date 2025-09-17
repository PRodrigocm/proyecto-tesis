import express from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { comparePassword } from '../utils/password';
import { LoginRequest, AdminLoginRequest, ApiResponse, UserRole } from '../types';

const router = express.Router();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
  institucionEducativa: z.string().optional(),
  rol: z.string().optional()
});

const adminLoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres')
});

/**
 * POST /api/auth/login
 * Login general para administrativos, docentes y apoderados
 * Cumple con RF-03: Login con selección de rol
 */
router.post('/login', async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { email, password, institucionEducativa, rol } = validatedData;

    // Buscar usuario por email
    const usuario = await prisma.usuario.findFirst({
      where: { email },
      include: {
        roles: {
          include: {
            rol: true
          }
        },
        ie: true
      }
    });

    if (!usuario) {
      return res.status(401).json({ 
        success: false, 
        error: 'Credenciales inválidas' 
      });
    }

    // Verificar contraseña
    if (!usuario.passwordHash || !await comparePassword(password, usuario.passwordHash)) {
      return res.status(401).json({ 
        success: false, 
        error: 'Credenciales inválidas' 
      });
    }

    // Verificar que no sea ADMIN (debe usar /admin-login)
    const userRoles = usuario.roles.map((ur: any) => ur.rol.nombre);
    if (userRoles.includes(UserRole.ADMIN)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Los administradores deben usar el acceso administrativo' 
      });
    }

    // Verificar rol seleccionado
    if (rol && !userRoles.includes(rol)) {
      return res.status(403).json({ 
        success: false, 
        error: 'No tienes permisos para el rol seleccionado' 
      });
    }

    // Verificar institución educativa
    if (institucionEducativa && usuario.idIe !== parseInt(institucionEducativa)) {
      return res.status(403).json({ 
        success: false, 
        error: 'No tienes acceso a la institución seleccionada' 
      });
    }

    // Generar JWT
    const token = jwt.sign(
      {
        userId: usuario.idUsuario,
        email: usuario.email,
        rol: rol || userRoles[0],
        idIe: usuario.idIe
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    const response: ApiResponse = {
      success: true,
      data: {
        token,
        user: {
          id: usuario.idUsuario,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          email: usuario.email,
          rol: rol || userRoles[0],
          institucion: usuario.ie?.nombre,
          roles: userRoles
        }
      }
    };

    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: error.errors[0]?.message || 'Datos inválidos' 
      });
    }

    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

/**
 * POST /api/auth/admin-login
 * Login exclusivo para administradores
 * Cumple con RF-03: Login exclusivo para ADMIN
 */
router.post('/admin-login', async (req, res) => {
  try {
    const validatedData = adminLoginSchema.parse(req.body);
    const { email, password } = validatedData;

    // Buscar usuario admin
    const usuario = await prisma.usuario.findFirst({
      where: { email },
      include: {
        roles: {
          include: {
            rol: true
          }
        }
      }
    });

    if (!usuario) {
      return res.status(401).json({ 
        success: false, 
        error: 'Credenciales administrativas inválidas' 
      });
    }

    // Verificar contraseña
    if (!usuario.passwordHash || !await comparePassword(password, usuario.passwordHash)) {
      return res.status(401).json({ 
        success: false, 
        error: 'Credenciales administrativas inválidas' 
      });
    }

    // Verificar que sea ADMIN
    const userRoles = usuario.roles.map((ur: any) => ur.rol.nombre);
    if (!userRoles.includes(UserRole.ADMIN)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Acceso denegado: Se requieren permisos de administrador' 
      });
    }

    // Generar JWT
    const token = jwt.sign(
      {
        userId: usuario.idUsuario,
        email: usuario.email,
        rol: UserRole.ADMIN,
        idIe: usuario.idIe
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    const response: ApiResponse = {
      success: true,
      data: {
        token,
        user: {
          id: usuario.idUsuario,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          email: usuario.email,
          rol: UserRole.ADMIN,
          roles: userRoles
        }
      }
    };

    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: error.errors[0]?.message || 'Datos inválidos' 
      });
    }

    console.error('Admin login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

/**
 * GET /api/auth/me
 * Obtener información del usuario autenticado
 */
router.get('/me', async (req, res) => {
  // TODO: Implementar middleware de autenticación
  res.json({ message: 'User info endpoint - TODO: implement' });
});

export default router;
