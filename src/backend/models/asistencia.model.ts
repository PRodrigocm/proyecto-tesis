// Modelo base para asistencias
export interface Asistencia {
  id: number;
  estudianteId: number;
  fecha: Date;
  estado: 'presente' | 'ausente' | 'tardanza' | 'justificado';
  tipo: 'AM' | 'PM';
  tallerId?: number;
  historial: Array<{
    fecha: Date;
    estado: string;
    usuarioId: number;
  }>;
}
