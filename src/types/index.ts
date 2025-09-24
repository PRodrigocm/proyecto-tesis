import { Request } from 'express';

// Extend Express Request to include user info
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    rol: string;
    idIe?: number;
  };
}

// JWT Payload
export interface JWTPayload {
  userId: number;
  email: string;
  rol: string;
  idIe?: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Login request types
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

// User roles
export enum UserRole {
  ADMINISTRATIVO = 'ADMINISTRATIVO',
  AUXILIAR = 'AUXILIAR', 
  DOCENTE = 'DOCENTE',
  APODERADO = 'APODERADO'
}

// Attendance session types
export enum SessionType {
  AM = 'AM',
  PM = 'PM'
}

// Attendance status
export enum AttendanceStatus {
  PRESENTE = 'presente',
  AUSENTE = 'ausente',
  TARDANZA = 'tardanza',
  JUSTIFICADO = 'justificado'
}

// Withdrawal status
export enum WithdrawalStatus {
  REPORTADO = 'reportado',
  CONTACTADO = 'contactado',
  EN_PROCESO = 'en_proceso',
  ENTREGADO = 'entregado',
  CANCELADO = 'cancelado'
}
