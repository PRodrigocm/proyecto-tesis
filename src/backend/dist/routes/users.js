"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const password_1 = require("../utils/password");
const qr_1 = require("../utils/qr");
const router = express_1.default.Router();
const createUserSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1, 'Nombre es requerido'),
    apellido: zod_1.z.string().min(1, 'Apellido es requerido'),
    dni: zod_1.z.string().length(8, 'DNI debe tener 8 dígitos'),
    email: zod_1.z.string().email('Email inválido'),
    telefono: zod_1.z.string().optional(),
    password: zod_1.z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
    idIe: zod_1.z.number().int().positive('ID de institución inválido'),
    roles: zod_1.z.array(zod_1.z.string()).min(1, 'Debe asignar al menos un rol')
});
router.get('/', auth_1.authenticateToken, auth_1.requireAdminOrAdministrativo, async (req, res) => {
    try {
        const { page = 1, limit = 10, search, rol, idIe } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);
        const where = {};
        if (search) {
            where.OR = [
                { nombre: { contains: search, mode: 'insensitive' } },
                { apellido: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { dni: { contains: search } }
            ];
        }
        if (idIe) {
            where.idIe = Number(idIe);
        }
        const usuarios = await prisma_1.prisma.usuario.findMany({
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
        const total = await prisma_1.prisma.usuario.count({ where });
        const response = {
            success: true,
            data: {
                usuarios: usuarios.map((u) => ({
                    id: u.idUsuario,
                    nombre: u.nombre,
                    apellido: u.apellido,
                    dni: u.dni,
                    email: u.email,
                    telefono: u.telefono,
                    estado: u.estado,
                    institucion: u.ie?.nombre,
                    roles: u.roles.map((ur) => ur.rol.nombre),
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
    }
    catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});
router.post('/', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const validatedData = createUserSchema.parse(req.body);
        const { nombre, apellido, dni, email, telefono, password, idIe, roles } = validatedData;
        const existingUser = await prisma_1.prisma.usuario.findFirst({
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
        const passwordHash = await (0, password_1.hashPassword)(password);
        const result = await prisma_1.prisma.$transaction(async (tx) => {
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
            if (roles.includes('ESTUDIANTE')) {
                const qr = (0, qr_1.generateQRFromDNI)(dni);
                await tx.estudiante.create({
                    data: {
                        idUsuario: usuario.idUsuario,
                        qr
                    }
                });
            }
            if (roles.includes('APODERADO')) {
                await tx.apoderado.create({
                    data: {
                        idUsuario: usuario.idUsuario
                    }
                });
            }
            if (roles.includes('DOCENTE')) {
                await tx.docente.create({
                    data: {
                        idUsuario: usuario.idUsuario
                    }
                });
            }
            return usuario;
        });
        const response = {
            success: true,
            data: {
                id: result.idUsuario,
                message: 'Usuario creado exitosamente'
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
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});
router.get('/:id', auth_1.authenticateToken, auth_1.requireAdminOrAdministrativo, async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = await prisma_1.prisma.usuario.findUnique({
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
        const response = {
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
                roles: usuario.roles.map((ur) => ur.rol.nombre),
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
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map