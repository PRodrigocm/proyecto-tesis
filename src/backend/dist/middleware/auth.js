"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireApoderado = exports.requireDocente = exports.requireAdminOrAdministrativo = exports.requireAdmin = exports.requireRole = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const types_1 = require("../types");
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Token de acceso requerido' });
    }
    jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido' });
        }
        req.user = decoded;
        next();
    });
};
exports.authenticateToken = authenticateToken;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        if (!roles.includes(req.user.rol)) {
            return res.status(403).json({ error: 'Permisos insuficientes' });
        }
        next();
    };
};
exports.requireRole = requireRole;
exports.requireAdmin = (0, exports.requireRole)([types_1.UserRole.ADMIN]);
exports.requireAdminOrAdministrativo = (0, exports.requireRole)([types_1.UserRole.ADMIN, types_1.UserRole.ADMINISTRATIVO]);
exports.requireDocente = (0, exports.requireRole)([types_1.UserRole.DOCENTE]);
exports.requireApoderado = (0, exports.requireRole)([types_1.UserRole.APODERADO]);
//# sourceMappingURL=auth.js.map