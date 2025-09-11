// Modelo base para reportes
export interface Reporte {
  id: number;
  tipo: string;
  fecha: Date;
  datos: object;
  generadoPor: number;
}
