import express from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticateToken, requireAdminOrAdministrativo } from '../middleware/auth';
import { ApiResponse } from '../types';

const router = express.Router();

// Validation schemas
const crearTallerSchema = z.object({
  nombre: z.string().min(1, 'Nombre del taller es requerido'),
  descripcion: z.string().optional(),
  idIe: z.number().int().positive('ID de institución inválido'),
  horarios: z.array(z.object({
    diaSemana: z.number().int().min(1).max(7),
    horaInicio: z.string(),
    horaFin: z.string(),
    lugar: z.string().optional()
  })).optional()
});

const inscribirEstudianteSchema = z.object({
  idEstudiante: z.number().int().positive(),
  idTaller: z.number().int().positive(),
  anio: z.number().int().positive()
});

/**
 * POST /api/talleres
 * Crear nuevo taller
 * Cumple con RF-13: Registrar talleres extracurriculares
 */
router.post('/', authenticateToken, requireAdminOrAdministrativo, async (req, res) => {
  try {
    const validatedData = crearTallerSchema.parse(req.body);
    const { nombre, descripcion, idIe, horarios } = validatedData;

    // Verificar que no exista taller con el mismo nombre en la IE
    const existingTaller = await prisma.taller.findFirst({
      where: {
        nombre,
        idIe
      }
    });

    if (existingTaller) {
      return res.status(400).json({
        success: false,
        error: 'Ya existe un taller con este nombre en la institución'
      });
    }

    // Crear taller en transacción
    const result = await prisma.$transaction(async (tx) => {
      const taller = await tx.taller.create({
        data: {
          nombre,
          descripcion,
          idIe,
          activo: true
        }
      });

      // Crear horarios si se proporcionaron
      if (horarios && horarios.length > 0) {
        for (const horario of horarios) {
          await tx.horarioTaller.create({
            data: {
              idTaller: taller.idTaller,
              diaSemana: horario.diaSemana,
              horaInicio: new Date(`1970-01-01T${horario.horaInicio}`),
              horaFin: new Date(`1970-01-01T${horario.horaFin}`),
              lugar: horario.lugar
            }
          });
        }
      }

      return taller;
    });

    const response: ApiResponse = {
      success: true,
      data: {
        id: result.idTaller,
        message: 'Taller creado exitosamente'
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

    console.error('Create workshop error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

/**
 * GET /api/talleres
 * Obtener lista de talleres
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, idIe, activo = 'true' } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};
    
    if (idIe) {
      where.idIe = Number(idIe);
    }

    if (activo !== 'all') {
      where.activo = activo === 'true';
    }

    const talleres = await prisma.taller.findMany({
      where,
      skip,
      take,
      include: {
        ie: true,
        horarios: true,
        inscripciones: {
          where: {
            estado: 'activa'
          },
          include: {
            estudiante: {
              include: {
                usuario: true
              }
            }
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    const total = await prisma.taller.count({ where });

    const response: ApiResponse = {
      success: true,
      data: {
        talleres: talleres.map(t => ({
          id: t.idTaller,
          nombre: t.nombre,
          descripcion: t.descripcion,
          activo: t.activo,
          institucion: t.ie.nombre,
          horarios: t.horarios.map(h => ({
            diaSemana: h.diaSemana,
            horaInicio: h.horaInicio,
            horaFin: h.horaFin,
            lugar: h.lugar
          })),
          estudiantesInscritos: t.inscripciones.length,
          createdAt: t.createdAt
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
    console.error('Get workshops error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

/**
 * POST /api/talleres/inscribir
 * Inscribir estudiante a taller
 * Cumple con RF-14: Inscribir estudiantes a talleres
 */
router.post('/inscribir', authenticateToken, requireAdminOrAdministrativo, async (req, res) => {
  try {
    const validatedData = inscribirEstudianteSchema.parse(req.body);
    const { idEstudiante, idTaller, anio } = validatedData;

    // Verificar que no exista inscripción activa
    const existingInscripcion = await prisma.inscripcionTaller.findFirst({
      where: {
        idEstudiante,
        idTaller,
        anio,
        estado: 'activa'
      }
    });

    if (existingInscripcion) {
      return res.status(400).json({
        success: false,
        error: 'El estudiante ya está inscrito en este taller para el año especificado'
      });
    }

    // Verificar que el taller esté activo
    const taller = await prisma.taller.findUnique({
      where: { idTaller },
      include: { ie: true }
    });

    if (!taller || !taller.activo) {
      return res.status(400).json({
        success: false,
        error: 'El taller no está disponible'
      });
    }

    // Crear inscripción
    const inscripcion = await prisma.inscripcionTaller.create({
      data: {
        idEstudiante,
        idTaller,
        anio,
        fechaInscripcion: new Date(),
        estado: 'activa'
      },
      include: {
        estudiante: {
          include: {
            usuario: true
          }
        },
        taller: true
      }
    });

    const response: ApiResponse = {
      success: true,
      data: {
        id: inscripcion.idInscripcion,
        estudiante: {
          nombre: inscripcion.estudiante.usuario.nombre,
          apellido: inscripcion.estudiante.usuario.apellido
        },
        taller: inscripcion.taller.nombre,
        anio: inscripcion.anio,
        message: 'Estudiante inscrito exitosamente'
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

    console.error('Enroll student error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

/**
 * GET /api/talleres/:id/estudiantes
 * Obtener estudiantes inscritos en un taller
 */
router.get('/:id/estudiantes', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { anio = new Date().getFullYear(), estado = 'activa' } = req.query;

    const inscripciones = await prisma.inscripcionTaller.findMany({
      where: {
        idTaller: Number(id),
        anio: Number(anio),
        estado: estado as string
      },
      include: {
        estudiante: {
          include: {
            usuario: true,
            gradoSeccion: {
              include: {
                grado: {
                  include: {
                    nivel: true
                  }
                },
                seccion: true
              }
            }
          }
        }
      },
      orderBy: {
        fechaInscripcion: 'asc'
      }
    });

    const response: ApiResponse = {
      success: true,
      data: {
        estudiantes: inscripciones.map(i => ({
          inscripcionId: i.idInscripcion,
          estudiante: {
            id: i.estudiante.idEstudiante,
            nombre: i.estudiante.usuario.nombre,
            apellido: i.estudiante.usuario.apellido,
            dni: i.estudiante.usuario.dni,
            grado: i.estudiante.gradoSeccion?.grado.nombre,
            seccion: i.estudiante.gradoSeccion?.seccion.nombre
          },
          fechaInscripcion: i.fechaInscripcion,
          estado: i.estado
        }))
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get workshop students error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

/**
 * PUT /api/talleres/inscripciones/:id/estado
 * Cambiar estado de inscripción (retirar estudiante)
 */
router.put('/inscripciones/:id/estado', authenticateToken, requireAdminOrAdministrativo, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, observaciones } = req.body;

    if (!['activa', 'retirada', 'suspendida'].includes(estado)) {
      return res.status(400).json({
        success: false,
        error: 'Estado inválido'
      });
    }

    await prisma.inscripcionTaller.update({
      where: { idInscripcion: Number(id) },
      data: { estado }
    });

    const response: ApiResponse = {
      success: true,
      data: {
        message: `Estado de inscripción actualizado a: ${estado}`
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Update enrollment status error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

export default router;
