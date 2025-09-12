import express from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticateToken, requireAdminOrAdministrativo, requireDocente, AuthenticatedRequest } from '../middleware/auth';
import { ApiResponse, WithdrawalStatus } from '../types';

const router = express.Router();

// Validation schemas
const crearRetiroSchema = z.object({
  idEstudiante: z.number().int().positive(),
  fecha: z.string().datetime(),
  hora: z.string(),
  idTipoRetiro: z.number().int().positive().optional(),
  origen: z.string().optional(),
  reportadoPorDocente: z.number().int().positive().optional(),
  observaciones: z.string().optional()
});

/**
 * POST /api/retiros
 * Registrar retiro de estudiante
 * Cumple con RF-09: Registrar retiros indicando causa, docente y apoderado
 */
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const validatedData = crearRetiroSchema.parse(req.body);
    const { idEstudiante, fecha, hora, idTipoRetiro, origen, reportadoPorDocente, observaciones } = validatedData;

    // Obtener estudiante y su grado/sección
    const estudiante = await prisma.estudiante.findUnique({
      where: { idEstudiante },
      include: { 
        usuario: true,
        gradoSeccion: true
      }
    });

    if (!estudiante) {
      return res.status(404).json({
        success: false,
        error: 'Estudiante no encontrado'
      });
    }

    // Buscar estado inicial "reportado"
    const estadoReportado = await prisma.estadoRetiro.findFirst({
      where: { codigo: WithdrawalStatus.REPORTADO }
    });

    // Crear retiro
    const retiro = await prisma.retiro.create({
      data: {
        idEstudiante,
        idIe: estudiante.idIe!,
        idGradoSeccion: estudiante.idGradoSeccion?.idGradoSeccion,
        fecha: new Date(fecha),
        hora: new Date(`1970-01-01T${hora}`),
        idTipoRetiro,
        origen,
        reportadoPorDocente,
        idEstadoRetiro: estadoReportado?.idEstadoRetiro,
        observaciones
      },
      include: {
        estudiante: {
          include: {
            usuario: true
          }
        },
        tipoRetiro: true,
        docenteReportador: {
          include: {
            usuario: true
          }
        },
        estadoRetiro: true
      }
    });

    const response: ApiResponse = {
      success: true,
      data: {
        id: retiro.idRetiro,
        estudiante: {
          nombre: retiro.estudiante.usuario.nombre,
          apellido: retiro.estudiante.usuario.apellido,
          dni: retiro.estudiante.usuario.dni
        },
        fecha: retiro.fecha,
        hora: retiro.hora,
        tipo: retiro.tipoRetiro?.nombre,
        estado: retiro.estadoRetiro?.nombre,
        docenteReportador: retiro.docenteReportador ? {
          nombre: retiro.docenteReportador.usuario.nombre,
          apellido: retiro.docenteReportador.usuario.apellido
        } : null,
        message: 'Retiro registrado exitosamente'
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

    console.error('Create withdrawal error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

/**
 * GET /api/retiros
 * Consultar retiros
 * Cumple con RF-12: Mantener histórico de estados
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      idEstudiante, 
      fecha, 
      fechaInicio, 
      fechaFin, 
      idEstadoRetiro, 
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

    if (idEstadoRetiro) {
      where.idEstadoRetiro = Number(idEstadoRetiro);
    }

    const retiros = await prisma.retiro.findMany({
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
        tipoRetiro: true,
        estadoRetiro: true,
        docenteReportador: {
          include: {
            usuario: true
          }
        },
        apoderadoContacto: {
          include: {
            usuario: true
          }
        },
        apoderadoRetira: {
          include: {
            usuario: true
          }
        },
        usuarioVerificador: true
      },
      orderBy: [
        { fecha: 'desc' },
        { hora: 'desc' }
      ]
    });

    const total = await prisma.retiro.count({ where });

    const response: ApiResponse = {
      success: true,
      data: {
        retiros: retiros.map((r: any) => ({
          id: r.idRetiro,
          estudiante: {
            id: r.estudiante.idEstudiante,
            nombre: r.estudiante.usuario.nombre,
            apellido: r.estudiante.usuario.apellido,
            dni: r.estudiante.usuario.dni,
            grado: r.estudiante.gradoSeccion?.grado.nombre,
            seccion: r.estudiante.gradoSeccion?.seccion.nombre
          },
          fecha: r.fecha,
          hora: r.hora,
          tipo: r.tipoRetiro?.nombre,
          estado: r.estadoRetiro?.nombre,
          origen: r.origen,
          docenteReportador: r.docenteReportador ? {
            nombre: r.docenteReportador.usuario.nombre,
            apellido: r.docenteReportador.usuario.apellido
          } : null,
          apoderadoContactado: r.apoderadoContacto ? {
            nombre: r.apoderadoContacto.usuario.nombre,
            apellido: r.apoderadoContacto.usuario.apellido
          } : null,
          apoderadoQueRetira: r.apoderadoRetira ? {
            nombre: r.apoderadoRetira.usuario.nombre,
            apellido: r.apoderadoRetira.usuario.apellido,
            dni: r.apoderadoRetira.usuario.dni
          } : null,
          dniVerificado: r.dniVerificado,
          observaciones: r.observaciones,
          createdAt: r.createdAt
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
    console.error('Get withdrawals error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

/**
 * PUT /api/retiros/:id/contactar
 * Contactar apoderado para retiro
 * Cumple con RF-09: Indicar apoderado contactado
 */
router.put('/:id/contactar', authenticateToken, requireAdminOrAdministrativo, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { idApoderado, medioContacto, observaciones } = req.body;

    const retiro = await prisma.retiro.findUnique({
      where: { idRetiro: Number(id) }
    });

    if (!retiro) {
      return res.status(404).json({
        success: false,
        error: 'Retiro no encontrado'
      });
    }

    // Buscar estado "contactado"
    const estadoContactado = await prisma.estadoRetiro.findFirst({
      where: { codigo: WithdrawalStatus.CONTACTADO }
    });

    // Actualizar retiro
    await prisma.retiro.update({
      where: { idRetiro: Number(id) },
      data: {
        apoderadoContactado: Number(idApoderado),
        horaContacto: new Date(),
        medioContacto,
        idEstadoRetiro: estadoContactado?.idEstadoRetiro,
        observaciones: observaciones || retiro.observaciones,
        updatedAt: new Date()
      }
    });

    const response: ApiResponse = {
      success: true,
      data: {
        message: 'Apoderado contactado exitosamente'
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Contact guardian error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

/**
 * PUT /api/retiros/:id/entregar
 * Entregar estudiante a apoderado
 * Cumple con RF-11: Verificación del retiro y DNI del apoderado
 */
router.put('/:id/entregar', authenticateToken, requireAdminOrAdministrativo, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { idApoderado, dniVerificado, observaciones } = req.body;

    if (!idApoderado || !dniVerificado) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere apoderado y DNI verificado'
      });
    }

    const retiro = await prisma.retiro.findUnique({
      where: { idRetiro: Number(id) }
    });

    if (!retiro) {
      return res.status(404).json({
        success: false,
        error: 'Retiro no encontrado'
      });
    }

    // Buscar estado "entregado"
    const estadoEntregado = await prisma.estadoRetiro.findFirst({
      where: { codigo: WithdrawalStatus.ENTREGADO }
    });

    // Actualizar retiro
    await prisma.retiro.update({
      where: { idRetiro: Number(id) },
      data: {
        apoderadoQueRetira: Number(idApoderado),
        dniVerificado,
        verificadoPor: req.user?.userId,
        idEstadoRetiro: estadoEntregado?.idEstadoRetiro,
        observaciones: observaciones || retiro.observaciones,
        updatedAt: new Date()
      }
    });

    const response: ApiResponse = {
      success: true,
      data: {
        message: 'Estudiante entregado exitosamente'
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Deliver student error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

/**
 * POST /api/retiros/:id/autorizar
 * Autorizar retiro por apoderado
 * Cumple con RF-10: Apoderados autorizan retiros
 */
router.post('/:id/autorizar', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { autorizado, observaciones } = req.body;

    // Verificar que el usuario sea apoderado
    const apoderado = await prisma.apoderado.findUnique({
      where: { idUsuario: req.user?.userId }
    });

    if (!apoderado) {
      return res.status(403).json({
        success: false,
        error: 'Solo los apoderados pueden autorizar retiros'
      });
    }

    const retiro = await prisma.retiro.findUnique({
      where: { idRetiro: Number(id) },
      include: {
        estudiante: {
          include: {
            apoderados: {
              where: {
                idApoderado: apoderado.idApoderado
              }
            }
          }
        }
      }
    });

    if (!retiro) {
      return res.status(404).json({
        success: false,
        error: 'Retiro no encontrado'
      });
    }

    // Verificar que el apoderado tenga relación con el estudiante
    if (retiro.estudiante.apoderados.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'No tienes autorización para este estudiante'
      });
    }

    // Crear autorización de retiro
    await prisma.autorizacionRetiro.create({
      data: {
        idEstudiante: retiro.idEstudiante,
        idApoderado: apoderado.idApoderado,
        vigenteDesde: new Date(),
        vigenteHasta: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
        observacion: observaciones
      }
    });

    const response: ApiResponse = {
      success: true,
      data: {
        message: autorizado ? 'Retiro autorizado exitosamente' : 'Retiro no autorizado'
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Authorize withdrawal error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

export default router;
