import { Request } from 'express';
export interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        email: string;
        rol: string;
        idIe?: number;
    };
}
export interface JWTPayload {
    userId: number;
    email: string;
    rol: string;
    idIe?: number;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface LoginRequest {
    email: string;
    password: string;
    institucionEducativa?: string;
    rol?: string;
}
export interface AdminLoginRequest {
    email: string;
    password: string;
}
export declare enum UserRole {
    ADMIN = "ADMIN",
    ADMINISTRATIVO = "ADMINISTRATIVO",
    DOCENTE = "DOCENTE",
    APODERADO = "APODERADO"
}
export declare enum SessionType {
    AM = "AM",
    PM = "PM"
}
export declare enum AttendanceStatus {
    PRESENTE = "presente",
    AUSENTE = "ausente",
    TARDANZA = "tardanza",
    JUSTIFICADO = "justificado"
}
export declare enum WithdrawalStatus {
    REPORTADO = "reportado",
    CONTACTADO = "contactado",
    EN_PROCESO = "en_proceso",
    ENTREGADO = "entregado",
    CANCELADO = "cancelado"
}
//# sourceMappingURL=index.d.ts.map