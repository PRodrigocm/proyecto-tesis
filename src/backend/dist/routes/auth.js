"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const password_1 = require("../utils/password");
const types_1 = require("../types");
const router = express_1.default.Router();
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email inválido'),
    password: zod_1.z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
    institucionEducativa: zod_1.z.string().optional(),
    rol: zod_1.z.string().optional()
});
const adminLoginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email inválido'),
    password: zod_1.z.string().min(6, 'Contraseña debe tener al menos 6 caracteres')
});
router.post('/login', async (req, res) => {
    try {
        const validatedData = loginSchema.parse(req.body);
        const { email, password, institucionEducativa, rol } = validatedData;
        const usuario = await prisma_1.prisma.usuario.findUnique({
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
        if (!usuario.passwordHash || !await (0, password_1.comparePassword)(password, usuario.passwordHash)) {
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas'
            });
        }
        const userRoles = usuario.roles.map((ur) => ur.rol.nombre);
        if (userRoles.includes(types_1.UserRole.ADMIN)) {
            return res.status(403).json({
                success: false,
                error: 'Los administradores deben usar el acceso administrativo'
            });
        }
        if (rol && !userRoles.includes(rol)) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permisos para el rol seleccionado'
            });
        }
        if (institucionEducativa && usuario.idIe !== parseInt(institucionEducativa)) {
            return res.status(403).json({
                success: false,
                error: 'No tienes acceso a la institución seleccionada'
            });
        }
        const token = jsonwebtoken_1.default.sign({
            userId: usuario.idUsuario,
            email: usuario.email,
            rol: rol || userRoles[0],
            idIe: usuario.idIe
        }, process.env.JWT_SECRET, { expiresIn: '7d' });
        const response = {
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
router.post('/admin-login', async (req, res) => {
    try {
        const validatedData = adminLoginSchema.parse(req.body);
        const { email, password } = validatedData;
        const usuario = await prisma_1.prisma.usuario.findUnique({
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
        if (!usuario.passwordHash || !await (0, password_1.comparePassword)(password, usuario.passwordHash)) {
            return res.status(401).json({
                success: false,
                error: 'Credenciales administrativas inválidas'
            });
        }
        const userRoles = usuario.roles.map((ur) => ur.rol.nombre);
        if (!userRoles.includes(types_1.UserRole.ADMIN)) {
            return res.status(403).json({
                success: false,
                error: 'Acceso denegado: Se requieren permisos de administrador'
            });
        }
        const token = jsonwebtoken_1.default.sign({
            userId: usuario.idUsuario,
            email: usuario.email,
            rol: types_1.UserRole.ADMIN,
            idIe: usuario.idIe
        }, process.env.JWT_SECRET, { expiresIn: '7d' });
        const response = {
            success: true,
            data: {
                token,
                user: {
                    id: usuario.idUsuario,
                    nombre: usuario.nombre,
                    apellido: usuario.apellido,
                    email: usuario.email,
                    rol: types_1.UserRole.ADMIN,
                    roles: userRoles
                }
            }
        };
        res.json(response);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
router.get('/me', async (req, res) => {
    res.json({ message: 'User info endpoint - TODO: implement' });
});
exports.default = router;
//# sourceMappingURL=auth.js.map