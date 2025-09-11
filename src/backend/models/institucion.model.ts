// Modelo base para instituciones
export interface Institucion {
  id: number;
  nombre: string;
  direccion?: string;
  telefono?: string;
  email?: string;
}
