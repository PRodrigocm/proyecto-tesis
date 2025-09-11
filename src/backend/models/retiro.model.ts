// Modelo base para retiros
export interface Retiro {
  id: number;
  estudianteId: number;
  causa: string;
  docenteId: number;
  apoderadoId: number;
  fecha: Date;
  estado: 'reportado' | 'contactado' | 'en_proceso' | 'entregado' | 'cancelado';
  historial: Array<{
    fecha: Date;
    estado: string;
    usuarioId: number;
  }>;
  verificadoPor?: number;
  dniApoderado?: string;
}
