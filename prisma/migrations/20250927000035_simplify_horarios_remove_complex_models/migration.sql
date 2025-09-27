/*
  Warnings:

  - You are about to drop the `horarios_mensuales` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `horarios_mensuales_semanas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `horarios_semanales` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `horarios_semanales_detalle` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "proyecto-1"."horarios_mensuales" DROP CONSTRAINT "horarios_mensuales_id_ie_fkey";

-- DropForeignKey
ALTER TABLE "proyecto-1"."horarios_mensuales_semanas" DROP CONSTRAINT "horarios_mensuales_semanas_id_horario_mensual_fkey";

-- DropForeignKey
ALTER TABLE "proyecto-1"."horarios_mensuales_semanas" DROP CONSTRAINT "horarios_mensuales_semanas_id_horario_semanal_fkey";

-- DropForeignKey
ALTER TABLE "proyecto-1"."horarios_semanales" DROP CONSTRAINT "horarios_semanales_id_ie_fkey";

-- DropForeignKey
ALTER TABLE "proyecto-1"."horarios_semanales_detalle" DROP CONSTRAINT "horarios_semanales_detalle_id_horario_base_fkey";

-- DropForeignKey
ALTER TABLE "proyecto-1"."horarios_semanales_detalle" DROP CONSTRAINT "horarios_semanales_detalle_id_horario_semanal_fkey";

-- DropTable
DROP TABLE "proyecto-1"."horarios_mensuales";

-- DropTable
DROP TABLE "proyecto-1"."horarios_mensuales_semanas";

-- DropTable
DROP TABLE "proyecto-1"."horarios_semanales";

-- DropTable
DROP TABLE "proyecto-1"."horarios_semanales_detalle";
