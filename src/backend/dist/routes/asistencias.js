"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const types_1 = require("../types");
const router = express_1.default.Router();
const registrarAsistenciaSchema = zod_1.z.object({
    idEstudiante: zod_1.z.number().int().positive(),
    fecha: zod_1.z.string().datetime(),
    sesion: zod_1.z.enum(['AM', 'PM']),
    idInscripcionTaller: zod_1.z.number().int().positive().optional(),
    horaEntrada: zod_1.z.string().optional(),
    horaSalida: zod_1.z.string().optional(),
    fuente: zod_1.z.string().optional(),
    observaciones: zod_1.z.string().optional()
});
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const validatedData = registrarAsistenciaSchema.parse(req.body);
        const { idEstudiante, fecha, sesion, idInscripcionTaller, horaEntrada, horaSalida, fuente, observaciones } = validatedData;
        if (sesion === 'PM' && !idInscripcionTaller) {
            return res.status(400).json({
                success: false,
                error: 'Para sesión PM se requiere inscripción a taller'
            });
        }
        if (sesion === 'AM' && idInscripcionTaller) {
            return res.status(400).json({
                success: false,
                error: 'Para sesión AM no debe especificar taller'
            });
        }
        const existingAsistencia = await prisma_1.prisma.asistencia.findUnique({
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
        const estudiante = await prisma_1.prisma.estudiante.findUnique({
            where: { idEstudiante },
            include: { usuario: true }
        });
        if (!estudiante) {
            return res.status(404).json({
                success: false,
                error: 'Estudiante no encontrado'
            });
        }
        const estadoPresente = await prisma_1.prisma.estadoAsistencia.findFirst({
            where: { nombreEstado: types_1.AttendanceStatus.PRESENTE }
        });
        const asistencia = await prisma_1.prisma.asistencia.create({
            data: {
                idEstudiante,
                idIe: estudiante.idIe,
                fecha: new Date(fecha),
                sesion,
                idInscripcionTaller,
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
                estadoAsistencia: true,
                inscripcionTaller: {
                    include: {
                        taller: true
                    }
                }
            }
        });
        const response = {
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
                taller: asistencia.inscripcionTaller?.taller?.nombre,
                horaEntrada: asistencia.horaEntrada,
                message: 'Asistencia registrada exitosamente'
            }
        };
        res.status(201).json(response);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, idEstudiante, idGradoSeccion, fecha, fechaInicio, fechaFin, sesion, idIe } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);
        const where = {};
        if (idEstudiante) {
            where.idEstudiante = Number(idEstudiante);
        }
        if (idIe) {
            where.idIe = Number(idIe);
        }
        if (fecha) {
            where.fecha = new Date(fecha);
        }
        else if (fechaInicio && fechaFin) {
            where.fecha = {
                gte: new Date(fechaInicio),
                lte: new Date(fechaFin)
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
        const asistencias = await prisma_1.prisma.asistencia.findMany({
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
                inscripcionTaller: {
                    include: {
                        taller: true
                    }
                },
                usuarioRegistrador: true
            },
            orderBy: [
                { fecha: 'desc' },
                { sesion: 'asc' }
            ]
        });
        const total = await prisma_1.prisma.asistencia.count({ where });
        const response = {
            success: true,
            data: {
                asistencias: asistencias.map((a) => ({
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
                    taller: a.inscripcionTaller?.taller?.nombre,
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
    }
    catch (error) {
        console.error('Get attendance error:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});
router.put('/:id/estado', auth_1.authenticateToken, auth_1.requireAdminOrAdministrativo, async (req, res) => {
    try {
        const { id } = req.params;
        const { idEstadoAsistencia, observaciones } = req.body;
        const asistencia = await prisma_1.prisma.asistencia.findUnique({
            where: { idAsistencia: Number(id) },
            include: { estadoAsistencia: true }
        });
        if (!asistencia) {
            return res.status(404).json({
                success: false,
                error: 'Asistencia no encontrada'
            });
        }
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            if (asistencia.idEstadoAsistencia) {
                await tx.historicoEstadoAsistencia.create({
                    data: {
                        idAsistencia: asistencia.idAsistencia,
                        idEstadoAsistencia: asistencia.idEstadoAsistencia,
                        cambiadoPor: req.user?.userId
                    }
                });
            }
            await tx.asistencia.update({
                where: { idAsistencia: Number(id) },
                data: {
                    idEstadoAsistencia: Number(idEstadoAsistencia),
                    observaciones: observaciones || asistencia.observaciones,
                    updatedAt: new Date()
                }
            });
        });
        const response = {
            success: true,
            data: {
                message: 'Estado de asistencia actualizado exitosamente'
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Update attendance status error:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});
exports.default = router;
//# sourceMappingURL=asistencias.js.map