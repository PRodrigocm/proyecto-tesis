// Modelo base para horarios
export interface Horario {
  id: number;
  grado: string;
  seccion: string;
  dia: string;
  horaInicio: string;
  horaFin: string;
  tipo: 'curricular' | 'taller';
  tallerId?: number;
}
