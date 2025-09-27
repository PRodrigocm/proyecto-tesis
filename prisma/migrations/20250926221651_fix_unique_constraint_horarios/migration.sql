/*
  Warnings:

  - A unique constraint covering the columns `[id_grado_seccion,dia_semana,hora_inicio]` on the table `horarios_clase` will be added. If there are existing duplicate values, this will fail.

*/

-- Primero, eliminar duplicados manteniendo solo el registro más reciente
DELETE FROM "proyecto-1"."horarios_clase" 
WHERE "id_horario_clase" NOT IN (
    SELECT MAX("id_horario_clase")
    FROM "proyecto-1"."horarios_clase"
    GROUP BY "id_grado_seccion", "dia_semana", "hora_inicio"
);

-- DropIndex
DROP INDEX "proyecto-1"."horarios_clase_id_grado_seccion_dia_semana_hora_inicio_mate_key";

-- AlterTable
ALTER TABLE "proyecto-1"."horarios_clase" ALTER COLUMN "materia" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "horarios_clase_id_grado_seccion_dia_semana_hora_inicio_key" ON "proyecto-1"."horarios_clase"("id_grado_seccion", "dia_semana", "hora_inicio");
