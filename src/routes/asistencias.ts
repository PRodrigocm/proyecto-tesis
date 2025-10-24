import express from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticateToken, requireAdminOrAdministrativo, requireDocente, AuthenticatedRequest } from '../middleware/auth';
import { ApiResponse, SessionType, AttendanceStatus } from '../types';

const router = express.Router();

// Validation schemas
const registrarAsistenciaSchema = z.object({
  idEstudiante: z.number().int().positive(),
  fecha: z.string().datetime(),
  sesion: z.enum(['AM', 'PM']),
  horaEntrada: z.string().optional(),
  horaSalida: z.string().optional(),
  fuente: z.string().optional(),
  observaciones: z.string().optional()
});

/**
 * POST /api/asistencias
 * Registrar asistencia de estudiante
 * Cumple con RF-05: Registro de asistencia diaria
 */
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = registrarAsistenciaSchema.parse(req.body);
    const { idEstudiante, fecha, sesion, horaEntrada, horaSalida, fuente, observaciones } = validatedData;

    // Verificar si ya existe asistencia para ese día y sesión
    const existingAsistencia = await prisma.asistencia.findUnique({
      where: {
        idEstudiante_fecha_sesion: {
          idEstudiante,
          fecha: new Date(fecha),
          sesion
        }
      }
    });

    if (existingAsistencia) {
      return res.status(400).json({
        success: false,
        error: 'Ya existe registro de asistencia para este estudiante en esta fecha y sesión'
      });
    }

    // Obtener estudiante para validar IE
    const estudiante = await prisma.estudiante.findUnique({
      where: { idEstudiante },
      include: { usuario: true }
    });

    if (!estudiante) {
      return res.status(404).json({
        success: false,
        error: 'Estudiante no encontrado'
      });
    }

    // Buscar estado "presente" por defecto
    const estadoPresente = await prisma.estadoAsistencia.findFirst({
      where: { nombreEstado: AttendanceStatus.PRESENTE }
    });

    // Crear asistencia
    const asistencia = await prisma.asistencia.create({
      data: {
        idEstudiante,
        idIe: estudiante.idIe!,
        fecha: new Date(fecha),
        sesion,
        horaEntrada: horaEntrada ? new Date(`1970-01-01T${horaEntrada}`) : undefined,
        horaSalida: horaSalida ? new Date(`1970-01-01T${horaSalida}`) : undefined,
        idEstadoAsistencia: estadoPresente?.idEstadoAsistencia,
        fuente,
        observaciones,
        registradoPor: req.user?.userId
      },
      include: {
        estudiante: {
          include: {
            usuario: true
          }
        },
        estadoAsistencia: true
      }
    });

    const response: ApiResponse = {
      success: true,
      data: {
        id: asistencia.idAsistencia,
        estudiante: {
          nombre: asistencia.estudiante.usuario.nombre,
          apellido: asistencia.estudiante.usuario.apellido,
          dni: asistencia.estudiante.usuario.dni
        },
        fecha: asistencia.fecha,
        sesion: asistencia.sesion,
        estado: asistencia.estadoAsistencia?.nombreEstado,
        horaEntrada: asistencia.horaEntrada,
        message: 'Asistencia registrada exitosamente'
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

    console.error('Register attendance error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

/**
 * GET /api/asistencias
 * Consultar historial de asistencias
 * Cumple con RF-07: Consultar historial por estudiante, aula o fecha
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      idEstudiante, 
      idGradoSeccion, 
      fecha, 
      fechaInicio, 
      fechaFin, 
      sesion, 
      idIe 
    } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};
    
    if (idEstudiante) {
      where.idEstudiante = Number(idEstudiante);
    }

    if (idIe) {
      where.idIe = Number(idIe);
    }

    if (fecha) {
      where.fecha = new Date(fecha as string);
    } else if (fechaInicio && fechaFin) {
      where.fecha = {
        gte: new Date(fechaInicio as string),
        lte: new Date(fechaFin as string)
      };
    }

    if (sesion) {
      where.sesion = sesion;
    }

    if (idGradoSeccion) {
      where.estudiante = {
        idGradoSeccion: Number(idGradoSeccion)
      };
    }

    const asistencias = await prisma.asistencia.findMany({
      where,
      skip,
      take,
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
        },
        estadoAsistencia: true,
        usuarioRegistrador: true
      },
      orderBy: [
        { fecha: 'desc' },
        { sesion: 'asc' }
      ]
    });

    const total = await prisma.asistencia.count({ where });

    const response: ApiResponse = {
      success: true,
      data: {
        asistencias: asistencias.map((a: any) => ({
          id: a.idAsistencia,
          estudiante: {
            id: a.estudiante.idEstudiante,
            nombre: a.estudiante.usuario.nombre,
            apellido: a.estudiante.usuario.apellido,
            dni: a.estudiante.usuario.dni,
            grado: a.estudiante.gradoSeccion?.grado.nombre,
            seccion: a.estudiante.gradoSeccion?.seccion.nombre
          },
          fecha: a.fecha,
          sesion: a.sesion,
          estado: a.estadoAsistencia?.nombreEstado,
          horaEntrada: a.horaEntrada,
          horaSalida: a.horaSalida,
          fuente: a.fuente,
          observaciones: a.observaciones,
          registradoPor: a.usuarioRegistrador?.nombre,
          createdAt: a.createdAt
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
    console.error('Get attendance error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

/**
 * PUT /api/asistencias/:id/estado
 * Modificar estado de asistencia
 * Cumple con RF-08: Modificar estado y mantener histórico
 */
router.put('/:id/estado', authenticateToken, requireAdminOrAdministrativo, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { idEstadoAsistencia, observaciones } = req.body;

    const asistencia = await prisma.asistencia.findUnique({
      where: { idAsistencia: Number(id) },
      include: { estadoAsistencia: true }
    });

    if (!asistencia) {
      return res.status(404).json({
        success: false,
        error: 'Asistencia no encontrada'
      });
    }

    // Actualizar en transacción para mantener histórico
    const result = await prisma.$transaction(async (tx: any) => {
      // Crear registro histórico del estado anterior
      if (asistencia.idEstadoAsistencia) {
        await tx.historicoEstadoAsistencia.create({
          data: {
            idAsistencia: asistencia.idAsistencia,
            idEstadoAsistencia: asistencia.idEstadoAsistencia,
            cambiadoPor: req.user?.userId
          }
        });
      }

      // Actualizar asistencia
      await tx.asistencia.update({
        where: { idAsistencia: Number(id) },
        data: {
          idEstadoAsistencia: Number(idEstadoAsistencia),
          observaciones: observaciones || asistencia.observaciones,
          updatedAt: new Date()
        }
      });
    });

    const response: ApiResponse = {
      success: true,
      data: {
        message: 'Estado de asistencia actualizado exitosamente'
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Update attendance status error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

export default router;
