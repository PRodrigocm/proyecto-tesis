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
const crearRetiroSchema = zod_1.z.object({
    idEstudiante: zod_1.z.number().int().positive(),
    fecha: zod_1.z.string().datetime(),
    hora: zod_1.z.string(),
    idTipoRetiro: zod_1.z.number().int().positive().optional(),
    origen: zod_1.z.string().optional(),
    reportadoPorDocente: zod_1.z.number().int().positive().optional(),
    observaciones: zod_1.z.string().optional()
});
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const validatedData = crearRetiroSchema.parse(req.body);
        const { idEstudiante, fecha, hora, idTipoRetiro, origen, reportadoPorDocente, observaciones } = validatedData;
        const estudiante = await prisma_1.prisma.estudiante.findUnique({
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
        const estadoReportado = await prisma_1.prisma.estadoRetiro.findFirst({
            where: { codigo: types_1.WithdrawalStatus.REPORTADO }
        });
        const retiro = await prisma_1.prisma.retiro.create({
            data: {
                idEstudiante,
                idIe: estudiante.idIe,
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
        const response = {
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 10, idEstudiante, fecha, fechaInicio, fechaFin, idEstadoRetiro, idIe } = req.query;
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
        if (idEstadoRetiro) {
            where.idEstadoRetiro = Number(idEstadoRetiro);
        }
        const retiros = await prisma_1.prisma.retiro.findMany({
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
        const total = await prisma_1.prisma.retiro.count({ where });
        const response = {
            success: true,
            data: {
                retiros: retiros.map((r) => ({
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
    }
    catch (error) {
        console.error('Get withdrawals error:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});
router.put('/:id/contactar', auth_1.authenticateToken, auth_1.requireAdminOrAdministrativo, async (req, res) => {
    try {
        const { id } = req.params;
        const { idApoderado, medioContacto, observaciones } = req.body;
        const retiro = await prisma_1.prisma.retiro.findUnique({
            where: { idRetiro: Number(id) }
        });
        if (!retiro) {
            return res.status(404).json({
                success: false,
                error: 'Retiro no encontrado'
            });
        }
        const estadoContactado = await prisma_1.prisma.estadoRetiro.findFirst({
            where: { codigo: types_1.WithdrawalStatus.CONTACTADO }
        });
        await prisma_1.prisma.retiro.update({
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
        const response = {
            success: true,
            data: {
                message: 'Apoderado contactado exitosamente'
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Contact guardian error:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});
router.put('/:id/entregar', auth_1.authenticateToken, auth_1.requireAdminOrAdministrativo, async (req, res) => {
    try {
        const { id } = req.params;
        const { idApoderado, dniVerificado, observaciones } = req.body;
        if (!idApoderado || !dniVerificado) {
            return res.status(400).json({
                success: false,
                error: 'Se requiere apoderado y DNI verificado'
            });
        }
        const retiro = await prisma_1.prisma.retiro.findUnique({
            where: { idRetiro: Number(id) }
        });
        if (!retiro) {
            return res.status(404).json({
                success: false,
                error: 'Retiro no encontrado'
            });
        }
        const estadoEntregado = await prisma_1.prisma.estadoRetiro.findFirst({
            where: { codigo: types_1.WithdrawalStatus.ENTREGADO }
        });
        await prisma_1.prisma.retiro.update({
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
        const response = {
            success: true,
            data: {
                message: 'Estudiante entregado exitosamente'
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Deliver student error:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});
router.post('/:id/autorizar', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { autorizado, observaciones } = req.body;
        const apoderado = await prisma_1.prisma.apoderado.findUnique({
            where: { idUsuario: req.user?.userId }
        });
        if (!apoderado) {
            return res.status(403).json({
                success: false,
                error: 'Solo los apoderados pueden autorizar retiros'
            });
        }
        const retiro = await prisma_1.prisma.retiro.findUnique({
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
        if (retiro.estudiante.apoderados.length === 0) {
            return res.status(403).json({
                success: false,
                error: 'No tienes autorización para este estudiante'
            });
        }
        await prisma_1.prisma.autorizacionRetiro.create({
            data: {
                idEstudiante: retiro.idEstudiante,
                idApoderado: apoderado.idApoderado,
                vigenteDesde: new Date(),
                vigenteHasta: new Date(Date.now() + 24 * 60 * 60 * 1000),
                observacion: observaciones
            }
        });
        const response = {
            success: true,
            data: {
                message: autorizado ? 'Retiro autorizado exitosamente' : 'Retiro no autorizado'
            }
        };
        res.json(response);
    }
    catch (error) {
        console.error('Authorize withdrawal error:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});
exports.default = router;
//# sourceMappingURL=retiros.js.map