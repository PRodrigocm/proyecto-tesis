/*
  Warnings:

  - A unique constraint covering the columns `[codigo]` on the table `estados_asistencia` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `codigo` to the `estados_asistencia` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable - Agregar columnas opcionales primero
ALTER TABLE "proyecto-1"."estados_asistencia" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "afecta_asistencia" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "codigo" TEXT,
ADD COLUMN     "requiere_justificacion" BOOLEAN NOT NULL DEFAULT false;

-- Actualizar estados existentes con códigos
UPDATE "proyecto-1"."estados_asistencia" SET 
  codigo = 'PRESENTE',
  requiere_justificacion = false,
  afecta_asistencia = true
WHERE nombre_estado = 'Presente';

UPDATE "proyecto-1"."estados_asistencia" SET 
  codigo = 'TARDANZA',
  requiere_justificacion = false,
  afecta_asistencia = true
WHERE nombre_estado = 'Tardanza';

-- Insertar nuevos estados de asistencia
INSERT INTO "proyecto-1"."estados_asistencia" (nombre_estado, codigo, requiere_justificacion, afecta_asistencia, activo) VALUES
('Inasistencia', 'INASISTENCIA', true, false, true),
('Justificada', 'JUSTIFICADA', false, true, true),
('Falta Médica', 'FALTA_MEDICA', false, true, true),
('Permiso Especial', 'PERMISO_ESPECIAL', false, true, true)
ON CONFLICT (nombre_estado) DO NOTHING;

-- Ahora hacer el campo codigo requerido
ALTER TABLE "proyecto-1"."estados_asistencia" ALTER COLUMN "codigo" SET NOT NULL;

-- CreateTable
CREATE TABLE "proyecto-1"."tipos_justificacion" (
    "id_tipo_justificacion" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "requiere_documento" BOOLEAN NOT NULL DEFAULT false,
    "dias_maximos" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tipos_justificacion_pkey" PRIMARY KEY ("id_tipo_justificacion")
);

-- CreateTable
CREATE TABLE "proyecto-1"."estados_justificacion" (
    "id_estado_justificacion" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "es_final" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "estados_justificacion_pkey" PRIMARY KEY ("id_estado_justificacion")
);

-- CreateTable
CREATE TABLE "proyecto-1"."justificaciones" (
    "id_justificacion" SERIAL NOT NULL,
    "id_estudiante" INTEGER NOT NULL,
    "id_ie" INTEGER NOT NULL,
    "id_tipo_justificacion" INTEGER NOT NULL,
    "id_estado_justificacion" INTEGER NOT NULL,
    "id_estado_asistencia" INTEGER,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "motivo" TEXT NOT NULL,
    "observaciones" TEXT,
    "fecha_presentacion" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "presentado_por" INTEGER,
    "revisado_por" INTEGER,
    "fecha_revision" TIMESTAMPTZ,
    "observaciones_revision" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,

    CONSTRAINT "justificaciones_pkey" PRIMARY KEY ("id_justificacion")
);

-- CreateTable
CREATE TABLE "proyecto-1"."documentos_justificacion" (
    "id_documento" SERIAL NOT NULL,
    "id_justificacion" INTEGER NOT NULL,
    "nombre_archivo" TEXT NOT NULL,
    "ruta_archivo" TEXT NOT NULL,
    "tipo_archivo" TEXT NOT NULL,
    "tamanio_bytes" INTEGER NOT NULL,
    "descripcion" TEXT,
    "subido_por" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documentos_justificacion_pkey" PRIMARY KEY ("id_documento")
);

-- CreateTable
CREATE TABLE "proyecto-1"."asistencias_justificaciones" (
    "id_asistencia" INTEGER NOT NULL,
    "id_justificacion" INTEGER NOT NULL,
    "fecha_aplicacion" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aplicado_por" INTEGER,

    CONSTRAINT "asistencias_justificaciones_pkey" PRIMARY KEY ("id_asistencia","id_justificacion")
);

-- CreateIndex
CREATE UNIQUE INDEX "tipos_justificacion_nombre_key" ON "proyecto-1"."tipos_justificacion"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_justificacion_codigo_key" ON "proyecto-1"."tipos_justificacion"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "estados_justificacion_nombre_key" ON "proyecto-1"."estados_justificacion"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "estados_justificacion_codigo_key" ON "proyecto-1"."estados_justificacion"("codigo");

-- CreateIndex
CREATE INDEX "justificaciones_id_estudiante_fecha_inicio_fecha_fin_idx" ON "proyecto-1"."justificaciones"("id_estudiante", "fecha_inicio", "fecha_fin");

-- CreateIndex
CREATE INDEX "justificaciones_id_ie_fecha_presentacion_idx" ON "proyecto-1"."justificaciones"("id_ie", "fecha_presentacion");

-- CreateIndex
CREATE INDEX "justificaciones_id_estado_justificacion_idx" ON "proyecto-1"."justificaciones"("id_estado_justificacion");

-- CreateIndex
CREATE UNIQUE INDEX "estados_asistencia_codigo_key" ON "proyecto-1"."estados_asistencia"("codigo");

-- AddForeignKey
ALTER TABLE "proyecto-1"."justificaciones" ADD CONSTRAINT "justificaciones_id_estudiante_fkey" FOREIGN KEY ("id_estudiante") REFERENCES "proyecto-1"."estudiante"("id_estudiante") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."justificaciones" ADD CONSTRAINT "justificaciones_id_ie_fkey" FOREIGN KEY ("id_ie") REFERENCES "proyecto-1"."ie"("id_ie") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."justificaciones" ADD CONSTRAINT "justificaciones_id_tipo_justificacion_fkey" FOREIGN KEY ("id_tipo_justificacion") REFERENCES "proyecto-1"."tipos_justificacion"("id_tipo_justificacion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."justificaciones" ADD CONSTRAINT "justificaciones_id_estado_justificacion_fkey" FOREIGN KEY ("id_estado_justificacion") REFERENCES "proyecto-1"."estados_justificacion"("id_estado_justificacion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."justificaciones" ADD CONSTRAINT "justificaciones_id_estado_asistencia_fkey" FOREIGN KEY ("id_estado_asistencia") REFERENCES "proyecto-1"."estados_asistencia"("id_estado_asistencia") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."justificaciones" ADD CONSTRAINT "justificaciones_presentado_por_fkey" FOREIGN KEY ("presentado_por") REFERENCES "proyecto-1"."usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."justificaciones" ADD CONSTRAINT "justificaciones_revisado_por_fkey" FOREIGN KEY ("revisado_por") REFERENCES "proyecto-1"."usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."documentos_justificacion" ADD CONSTRAINT "documentos_justificacion_id_justificacion_fkey" FOREIGN KEY ("id_justificacion") REFERENCES "proyecto-1"."justificaciones"("id_justificacion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."documentos_justificacion" ADD CONSTRAINT "documentos_justificacion_subido_por_fkey" FOREIGN KEY ("subido_por") REFERENCES "proyecto-1"."usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."asistencias_justificaciones" ADD CONSTRAINT "asistencias_justificaciones_id_asistencia_fkey" FOREIGN KEY ("id_asistencia") REFERENCES "proyecto-1"."asistencias"("id_asistencia") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."asistencias_justificaciones" ADD CONSTRAINT "asistencias_justificaciones_id_justificacion_fkey" FOREIGN KEY ("id_justificacion") REFERENCES "proyecto-1"."justificaciones"("id_justificacion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."asistencias_justificaciones" ADD CONSTRAINT "asistencias_justificaciones_aplicado_por_fkey" FOREIGN KEY ("aplicado_por") REFERENCES "proyecto-1"."usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- Insertar tipos de justificación iniciales
INSERT INTO "proyecto-1"."tipos_justificacion" (nombre, codigo, requiere_documento, dias_maximos, activo) VALUES
('Justificación Médica', 'MEDICA', true, 3, true),
('Asunto Familiar', 'FAMILIAR', false, 1, true),
('Asunto Personal', 'PERSONAL', false, 1, true),
('Actividad Académica', 'ACADEMICA', true, 5, true),
('Emergencia', 'EMERGENCIA', false, 7, true),
('Otro', 'OTRO', false, 2, true);

-- Insertar estados de justificación iniciales
INSERT INTO "proyecto-1"."estados_justificacion" (nombre, codigo, es_final, activo) VALUES
('Pendiente de Revisión', 'PENDIENTE', false, true),
('Aprobada', 'APROBADA', true, true),
('Rechazada', 'RECHAZADA', true, true),
('Requiere Documentación', 'REQUIERE_DOC', false, true),
('Vencida', 'VENCIDA', true, true),
('En Revisión', 'EN_REVISION', false, true);
