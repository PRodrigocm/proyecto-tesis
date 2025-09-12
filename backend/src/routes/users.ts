import express from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticateToken, requireAdmin, requireAdminOrAdministrativo } from '../middleware/auth';
import { hashPassword } from '../utils/password';
import { generateQRFromDNI } from '../utils/qr';
import { ApiResponse, UserRole } from '../types';

const router = express.Router();

// Validation schemas
const createUserSchema = z.object({
  nombre: z.string().min(1, 'Nombre es requerido'),
  apellido: z.string().min(1, 'Apellido es requerido'),
  dni: z.string().length(8, 'DNI debe tener 8 dígitos'),
  email: z.string().email('Email inválido'),
  telefono: z.string().optional(),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
  idIe: z.number().int().positive('ID de institución inválido'),
  roles: z.array(z.string()).min(1, 'Debe asignar al menos un rol')
});

/**
 * GET /api/users
 * Obtener lista de usuarios
 * Requiere permisos de admin o administrativo
 */
router.get('/', authenticateToken, requireAdminOrAdministrativo, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, rol, idIe } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};
    
    if (search) {
      where.OR = [
        { nombre: { contains: search as string, mode: 'insensitive' } },
        { apellido: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { dni: { contains: search as string } }
      ];
    }

    if (idIe) {
      where.idIe = Number(idIe);
    }

    const usuarios = await prisma.usuario.findMany({
      where,
      skip,
      take,
      include: {
        roles: {
          include: {
            rol: true
          }
        },
        ie: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const total = await prisma.usuario.count({ where });

    const response: ApiResponse = {
      success: true,
      data: {
        usuarios: usuarios.map(u => ({
          id: u.idUsuario,
          nombre: u.nombre,
          apellido: u.apellido,
          dni: u.dni,
          email: u.email,
          telefono: u.telefono,
          estado: u.estado,
          institucion: u.ie?.nombre,
          roles: u.roles.map(ur => ur.rol.nombre),
          createdAt: u.createdAt
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

/**
 * POST /api/users
 * Crear nuevo usuario
 * Requiere permisos de admin
 */
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const validatedData = createUserSchema.parse(req.body);
    const { nombre, apellido, dni, email, telefono, password, idIe, roles } = validatedData;

    // Verificar que el DNI y email no existan
    const existingUser = await prisma.usuario.findFirst({
      where: {
        OR: [
          { dni },
          { email }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: existingUser.dni === dni ? 'DNI ya registrado' : 'Email ya registrado'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Crear usuario en transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear usuario
      const usuario = await tx.usuario.create({
        data: {
          nombre,
          apellido,
          dni,
          email,
          telefono,
          passwordHash,
          estado: 'activo',
          idIe
        }
      });

      // Asignar roles
      for (const roleName of roles) {
        const rol = await tx.rol.findUnique({
          where: { nombre: roleName }
        });

        if (rol) {
          await tx.usuarioRol.create({
            data: {
              idUsuario: usuario.idUsuario,
              idRol: rol.idRol
            }
          });
        }
      }

      // Si es estudiante, crear perfil de estudiante con QR
      if (roles.includes('ESTUDIANTE')) {
        const qr = generateQRFromDNI(dni);
        
        await tx.estudiante.create({
          data: {
            idUsuario: usuario.idUsuario,
            qr
          }
        });
      }

      // Si es apoderado, crear perfil de apoderado
      if (roles.includes('APODERADO')) {
        await tx.apoderado.create({
          data: {
            idUsuario: usuario.idUsuario
          }
        });
      }

      // Si es docente, crear perfil de docente
      if (roles.includes('DOCENTE')) {
        await tx.docente.create({
          data: {
            idUsuario: usuario.idUsuario
          }
        });
      }

      return usuario;
    });

    const response: ApiResponse = {
      success: true,
      data: {
        id: result.idUsuario,
        message: 'Usuario creado exitosamente'
      }
    };

    res.status(201).json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: error.errors[0]?.message || 'Datos inválidos' 
      });
    }

    console.error('Create user error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

/**
 * GET /api/users/:id
 * Obtener usuario por ID
 */
router.get('/:id', authenticateToken, requireAdminOrAdministrativo, async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await prisma.usuario.findUnique({
      where: { idUsuario: Number(id) },
      include: {
        roles: {
          include: {
            rol: true
          }
        },
        ie: true,
        estudiante: true,
        apoderado: true,
        docente: true
      }
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    const response: ApiResponse = {
      success: true,
      data: {
        id: usuario.idUsuario,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        dni: usuario.dni,
        email: usuario.email,
        telefono: usuario.telefono,
        estado: usuario.estado,
        institucion: usuario.ie?.nombre,
        roles: usuario.roles.map(ur => ur.rol.nombre),
        perfiles: {
          estudiante: usuario.estudiante ? {
            id: usuario.estudiante.idEstudiante,
            qr: usuario.estudiante.qr,
            codigo: usuario.estudiante.codigo
          } : null,
          apoderado: usuario.apoderado ? {
            id: usuario.apoderado.idApoderado,
            codigo: usuario.apoderado.codigo,
            ocupacion: usuario.apoderado.ocupacion
          } : null,
          docente: usuario.docente ? {
            id: usuario.docente.idDocente,
            codigo: usuario.docente.codigo,
            especialidad: usuario.docente.especialidad
          } : null
        },
        createdAt: usuario.createdAt,
        updatedAt: usuario.updatedAt
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

export default router;
