"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const crearTallerSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1, 'Nombre del taller es requerido'),
    descripcion: zod_1.z.string().optional(),
    idIe: zod_1.z.number().int().positive('ID de institución inválido'),
    horarios: zod_1.z.array(zod_1.z.object({
        diaSemana: zod_1.z.number().int().min(1).max(7),
        horaInicio: zod_1.z.string(),
        horaFin: zod_1.z.string(),
        lugar: zod_1.z.string().optional()
    })).optional()
});
const inscribirEstudianteSchema = zod_1.z.object({
    idEstudiante: zod_1.z.number().int().positive(),
    idTaller: zod_1.z.number().int().positive(),
    anio: zod_1.z.number().int().positive()
});
router.post('/', auth_1.authenticateToken, auth_1.requireAdminOrAdministrativo, async (req, res) => {
    try {
        const validatedData = crearTallerSchema.parse(req.body);
        const { nombre, descripcion, idIe, horarios } = validatedData;
        const existingTaller = await prisma_1.prisma.taller.findFirst({
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
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            const taller = await tx.taller.create({
                data: {
                    nombre,
                    descripcion,
                    idIe,
                    activo: true
                }
            });
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
        const response = {
            success: true,
            data: {
                id: result.idTaller,
                message: 'Taller creado exitosamente'
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
        console.error('Create workshop error:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, idIe, activo = 'true' } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);
        const where = {};
        if (idIe) {
            where.idIe = Number(idIe);
        }
        if (activo !== 'all') {
            where.activo = activo === 'true';
        }
        const talleres = await prisma_1.prisma.taller.findMany({
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
        const total = await prisma_1.prisma.taller.count({ where });
        const response = {
            success: true,
            data: {
                talleres: talleres.map((t) => ({
                    id: t.idTaller,
                    nombre: t.nombre,
                    descripcion: t.descripcion,
                    activo: t.activo,
                    institucion: t.ie.nombre,
                    horarios: t.horarios.map((h) => ({
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
    }
    catch (error) {
        console.error('Get workshops error:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});
router.post('/inscribir', auth_1.authenticateToken, auth_1.requireAdminOrAdministrativo, async (req, res) => {
    try {
        const validatedData = inscribirEstudianteSchema.parse(req.body);
        const { idEstudiante, idTaller, anio } = validatedData;
        const existingInscripcion = await prisma_1.prisma.inscripcionTaller.findFirst({
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
        const taller = await prisma_1.prisma.taller.findUnique({
            where: { idTaller },
            include: { ie: true }
        });
        if (!taller || !taller.activo) {
            return res.status(400).json({
                success: false,
                error: 'El taller no está disponible'
            });
        }
        const inscripcion = await prisma_1.prisma.inscripcionTaller.create({
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
        const response = {
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
router.get('/:id/estudiantes', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { anio = new Date().getFullYear(), estado = 'activa' } = req.query;
        const inscripciones = await prisma_1.prisma.inscripcionTaller.findMany({
            where: {
                idTaller: Number(id),
                anio: Number(anio),
                estado: estado
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
        const response = {
            success: true,
            data: {
                estudiantes: inscripciones.map((i) => ({
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
    }
    catch (error) {
        console.error('Get workshop students error:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});
router.put('/inscripciones/:id/estado', auth_1.authenticateToken, auth_1.requireAdminOrAdministrativo, async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, observaciones } = req.body;
        if (!['activa', 'retirada', 'suspendida'].includes(estado)) {
            return res.status(400).json({
                success: false,
                error: 'Estado inválido'
            });
        }
        await prisma_1.prisma.inscripcionTaller.update({
            where: { idInscripcion: Number(id) },
            data: { estado }
        });
        const response = {
            success: true,
            data: {
                message: `Estado de inscripción actualizado a: ${estado}`
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Update enrollment status error:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});
exports.default = router;
//# sourceMappingURL=talleres.js.map