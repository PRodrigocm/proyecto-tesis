// Modelo base para talleres
export interface Taller {
  id: number;
  nombre: string;
  institucionId: number;
  descripcion?: string;
  estado: 'activa' | 'retirada';
}
