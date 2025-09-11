// Modelo base para usuarios
export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email?: string;
  telefono?: string;
  passwordHash?: string;
  estado: string; // activo / inactivo
  rol: 'ADMIN' | 'ADMINISTRATIVO' | 'DOCENTE' | 'APODERADO';
}
