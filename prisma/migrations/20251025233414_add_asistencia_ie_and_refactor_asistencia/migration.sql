/*
  Warnings:

  - The values [TALLER_EXTRA] on the enum `tipo_actividad` will be removed. If these variants are still used in the database, this will fail.
  - The values [TALLER] on the enum `tipo_horario` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `fuente` on the `asistencias` table. All the data in the column will be lost.
  - You are about to drop the column `hora_entrada` on the `asistencias` table. All the data in the column will be lost.
  - You are about to drop the column `hora_salida` on the `asistencias` table. All the data in the column will be lost.
  - You are about to drop the column `id_ie` on the `asistencias` table. All the data in the column will be lost.
  - You are about to drop the column `id_inscripcion_taller` on the `asistencias` table. All the data in the column will be lost.
  - You are about to drop the column `sesion` on the `asistencias` table. All the data in the column will be lost.
  - You are about to drop the column `id_horario_taller` on the `excepciones_horario` table. All the data in the column will be lost.
  - You are about to drop the `horarios_taller` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `inscripcion_taller` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `talleres` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[id_estudiante,id_horario_clase,fecha]` on the table `asistencias` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "proyecto-1"."tipo_actividad_new" AS ENUM ('CLASE_REGULAR', 'REFORZAMIENTO', 'RECUPERACION', 'EVALUACION');
ALTER TABLE "proyecto-1"."horarios_clase" ALTER COLUMN "tipo_actividad" DROP DEFAULT;
ALTER TABLE "proyecto-1"."horarios_clase" ALTER COLUMN "tipo_actividad" TYPE "proyecto-1"."tipo_actividad_new" USING ("tipo_actividad"::text::"proyecto-1"."tipo_actividad_new");
ALTER TYPE "proyecto-1"."tipo_actividad" RENAME TO "tipo_actividad_old";
ALTER TYPE "proyecto-1"."tipo_actividad_new" RENAME TO "tipo_actividad";
DROP TYPE "proyecto-1"."tipo_actividad_old";
ALTER TABLE "proyecto-1"."horarios_clase" ALTER COLUMN "tipo_actividad" SET DEFAULT 'CLASE_REGULAR';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "proyecto-1"."tipo_horario_new" AS ENUM ('CLASE', 'AMBOS');
ALTER TABLE "proyecto-1"."excepciones_horario" ALTER COLUMN "tipo_horario" TYPE "proyecto-1"."tipo_horario_new" USING ("tipo_horario"::text::"proyecto-1"."tipo_horario_new");
ALTER TYPE "proyecto-1"."tipo_horario" RENAME TO "tipo_horario_old";
ALTER TYPE "proyecto-1"."tipo_horario_new" RENAME TO "tipo_horario";
DROP TYPE "proyecto-1"."tipo_horario_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "proyecto-1"."asistencias" DROP CONSTRAINT "asistencias_id_ie_fkey";

-- DropForeignKey
ALTER TABLE "proyecto-1"."asistencias" DROP CONSTRAINT "asistencias_id_inscripcion_taller_fkey";

-- DropForeignKey
ALTER TABLE "proyecto-1"."excepciones_horario" DROP CONSTRAINT "excepciones_horario_id_horario_taller_fkey";

-- DropForeignKey
ALTER TABLE "proyecto-1"."horarios_taller" DROP CONSTRAINT "horarios_taller_id_taller_fkey";

-- DropForeignKey
ALTER TABLE "proyecto-1"."inscripcion_taller" DROP CONSTRAINT "inscripcion_taller_id_estudiante_fkey";

-- DropForeignKey
ALTER TABLE "proyecto-1"."inscripcion_taller" DROP CONSTRAINT "inscripcion_taller_id_taller_fkey";

-- DropForeignKey
ALTER TABLE "proyecto-1"."talleres" DROP CONSTRAINT "talleres_id_ie_fkey";

-- DropIndex
DROP INDEX "proyecto-1"."asistencias_id_estudiante_fecha_sesion_key";

-- DropIndex
DROP INDEX "proyecto-1"."asistencias_id_ie_fecha_idx";

-- DropIndex
DROP INDEX "proyecto-1"."asistencias_id_inscripcion_taller_idx";

-- DropIndex
DROP INDEX "proyecto-1"."excepciones_horario_id_horario_taller_fecha_key";

-- AlterTable
ALTER TABLE "proyecto-1"."asistencias" DROP COLUMN "fuente",
DROP COLUMN "hora_entrada",
DROP COLUMN "hora_salida",
DROP COLUMN "id_ie",
DROP COLUMN "id_inscripcion_taller",
DROP COLUMN "sesion",
ADD COLUMN     "hora_registro" TIMESTAMPTZ(6),
ADD COLUMN     "id_horario_clase" INTEGER;

-- AlterTable
ALTER TABLE "proyecto-1"."excepciones_horario" DROP COLUMN "id_horario_taller";

-- DropTable
DROP TABLE "proyecto-1"."horarios_taller";

-- DropTable
DROP TABLE "proyecto-1"."inscripcion_taller";

-- DropTable
DROP TABLE "proyecto-1"."talleres";

-- CreateTable
CREATE TABLE "proyecto-1"."asistencia_ie" (
    "id_asistencia_ie" SERIAL NOT NULL,
    "id_estudiante" INTEGER NOT NULL,
    "id_ie" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "hora_ingreso" TIMESTAMPTZ(6),
    "hora_salida" TIMESTAMPTZ(6),
    "estado" TEXT,
    "registrado_ingreso_por" INTEGER,
    "registrado_salida_por" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "asistencia_ie_pkey" PRIMARY KEY ("id_asistencia_ie")
);

-- CreateIndex
CREATE INDEX "asistencia_ie_id_ie_fecha_idx" ON "proyecto-1"."asistencia_ie"("id_ie", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "asistencia_ie_id_estudiante_fecha_key" ON "proyecto-1"."asistencia_ie"("id_estudiante", "fecha");

-- CreateIndex
CREATE INDEX "asistencias_id_horario_clase_fecha_idx" ON "proyecto-1"."asistencias"("id_horario_clase", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "asistencias_id_estudiante_id_horario_clase_fecha_key" ON "proyecto-1"."asistencias"("id_estudiante", "id_horario_clase", "fecha");

-- AddForeignKey
ALTER TABLE "proyecto-1"."asistencias" ADD CONSTRAINT "asistencias_id_horario_clase_fkey" FOREIGN KEY ("id_horario_clase") REFERENCES "proyecto-1"."horarios_clase"("id_horario_clase") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."asistencia_ie" ADD CONSTRAINT "asistencia_ie_id_estudiante_fkey" FOREIGN KEY ("id_estudiante") REFERENCES "proyecto-1"."estudiante"("id_estudiante") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."asistencia_ie" ADD CONSTRAINT "asistencia_ie_id_ie_fkey" FOREIGN KEY ("id_ie") REFERENCES "proyecto-1"."ie"("id_ie") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."asistencia_ie" ADD CONSTRAINT "asistencia_ie_registrado_ingreso_por_fkey" FOREIGN KEY ("registrado_ingreso_por") REFERENCES "proyecto-1"."usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."asistencia_ie" ADD CONSTRAINT "asistencia_ie_registrado_salida_por_fkey" FOREIGN KEY ("registrado_salida_por") REFERENCES "proyecto-1"."usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;
