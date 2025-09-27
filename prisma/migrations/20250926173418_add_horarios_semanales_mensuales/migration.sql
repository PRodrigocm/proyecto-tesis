/*
  Warnings:

  - A unique constraint covering the columns `[id_grado_seccion,dia_semana,hora_entrada]` on the table `horarios_grado_seccion` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "proyecto-1"."tipo_actividad" AS ENUM ('CLASE_REGULAR', 'REFORZAMIENTO', 'RECUPERACION', 'EVALUACION', 'TALLER_EXTRA');

-- DropIndex
DROP INDEX "proyecto-1"."horarios_grado_seccion_id_grado_seccion_dia_semana_key";

-- AlterTable
ALTER TABLE "proyecto-1"."horarios_grado_seccion" ADD COLUMN     "tipo_actividad" "proyecto-1"."tipo_actividad" NOT NULL DEFAULT 'CLASE_REGULAR';

-- CreateTable
CREATE TABLE "proyecto-1"."horarios_semanales" (
    "id_horario_semanal" SERIAL NOT NULL,
    "id_ie" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,

    CONSTRAINT "horarios_semanales_pkey" PRIMARY KEY ("id_horario_semanal")
);

-- CreateTable
CREATE TABLE "proyecto-1"."horarios_semanales_detalle" (
    "id_detalle" SERIAL NOT NULL,
    "id_horario_semanal" INTEGER NOT NULL,
    "id_horario_base" INTEGER NOT NULL,
    "dia_semana" INTEGER NOT NULL,
    "hora_inicio" TIME NOT NULL,
    "hora_fin" TIME NOT NULL,
    "materia" TEXT,
    "docente" TEXT,
    "aula" TEXT,
    "tipo_actividad" "proyecto-1"."tipo_actividad" NOT NULL,
    "observaciones" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "horarios_semanales_detalle_pkey" PRIMARY KEY ("id_detalle")
);

-- CreateTable
CREATE TABLE "proyecto-1"."horarios_mensuales" (
    "id_horario_mensual" SERIAL NOT NULL,
    "id_ie" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,

    CONSTRAINT "horarios_mensuales_pkey" PRIMARY KEY ("id_horario_mensual")
);

-- CreateTable
CREATE TABLE "proyecto-1"."horarios_mensuales_semanas" (
    "id_semana" SERIAL NOT NULL,
    "id_horario_mensual" INTEGER NOT NULL,
    "id_horario_semanal" INTEGER NOT NULL,
    "numero_semana" INTEGER NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "horarios_mensuales_semanas_pkey" PRIMARY KEY ("id_semana")
);

-- CreateIndex
CREATE UNIQUE INDEX "horarios_semanales_id_ie_nombre_key" ON "proyecto-1"."horarios_semanales"("id_ie", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "horarios_semanales_detalle_id_horario_semanal_dia_semana_ho_key" ON "proyecto-1"."horarios_semanales_detalle"("id_horario_semanal", "dia_semana", "hora_inicio");

-- CreateIndex
CREATE UNIQUE INDEX "horarios_mensuales_id_ie_anio_mes_key" ON "proyecto-1"."horarios_mensuales"("id_ie", "anio", "mes");

-- CreateIndex
CREATE UNIQUE INDEX "horarios_mensuales_semanas_id_horario_mensual_numero_semana_key" ON "proyecto-1"."horarios_mensuales_semanas"("id_horario_mensual", "numero_semana");

-- CreateIndex
CREATE UNIQUE INDEX "horarios_grado_seccion_id_grado_seccion_dia_semana_hora_ent_key" ON "proyecto-1"."horarios_grado_seccion"("id_grado_seccion", "dia_semana", "hora_entrada");

-- AddForeignKey
ALTER TABLE "proyecto-1"."horarios_semanales" ADD CONSTRAINT "horarios_semanales_id_ie_fkey" FOREIGN KEY ("id_ie") REFERENCES "proyecto-1"."ie"("id_ie") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."horarios_semanales_detalle" ADD CONSTRAINT "horarios_semanales_detalle_id_horario_semanal_fkey" FOREIGN KEY ("id_horario_semanal") REFERENCES "proyecto-1"."horarios_semanales"("id_horario_semanal") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."horarios_semanales_detalle" ADD CONSTRAINT "horarios_semanales_detalle_id_horario_base_fkey" FOREIGN KEY ("id_horario_base") REFERENCES "proyecto-1"."horarios_grado_seccion"("id_horario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."horarios_mensuales" ADD CONSTRAINT "horarios_mensuales_id_ie_fkey" FOREIGN KEY ("id_ie") REFERENCES "proyecto-1"."ie"("id_ie") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."horarios_mensuales_semanas" ADD CONSTRAINT "horarios_mensuales_semanas_id_horario_mensual_fkey" FOREIGN KEY ("id_horario_mensual") REFERENCES "proyecto-1"."horarios_mensuales"("id_horario_mensual") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."horarios_mensuales_semanas" ADD CONSTRAINT "horarios_mensuales_semanas_id_horario_semanal_fkey" FOREIGN KEY ("id_horario_semanal") REFERENCES "proyecto-1"."horarios_semanales"("id_horario_semanal") ON DELETE RESTRICT ON UPDATE CASCADE;
