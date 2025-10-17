/*
  Warnings:

  - You are about to drop the `consecutivos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notificaciones` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "proyecto-1"."consecutivos" DROP CONSTRAINT "consecutivos_id_ie_fkey";

-- DropForeignKey
ALTER TABLE "proyecto-1"."notificaciones" DROP CONSTRAINT "notificaciones_id_usuario_fkey";

-- DropTable
DROP TABLE "proyecto-1"."consecutivos";

-- DropTable
DROP TABLE "proyecto-1"."notificaciones";
