/*
  Warnings:

  - You are about to drop the column `hora_fin_ingreso_manana` on the `configuracion_ie` table. All the data in the column will be lost.
  - You are about to drop the column `hora_fin_ingreso_tarde` on the `configuracion_ie` table. All the data in the column will be lost.
  - You are about to drop the column `hora_ingreso_manana` on the `configuracion_ie` table. All the data in the column will be lost.
  - You are about to drop the column `hora_ingreso_tarde` on the `configuracion_ie` table. All the data in the column will be lost.
  - You are about to drop the column `hora_salida_manana` on the `configuracion_ie` table. All the data in the column will be lost.
  - You are about to drop the column `hora_salida_tarde` on the `configuracion_ie` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "configuracion_ie" DROP COLUMN "hora_fin_ingreso_manana",
DROP COLUMN "hora_fin_ingreso_tarde",
DROP COLUMN "hora_ingreso_manana",
DROP COLUMN "hora_ingreso_tarde",
DROP COLUMN "hora_salida_manana",
DROP COLUMN "hora_salida_tarde",
ADD COLUMN     "hora_fin_ingreso" VARCHAR(5),
ADD COLUMN     "hora_ingreso" VARCHAR(5),
ADD COLUMN     "hora_salida" VARCHAR(5);
