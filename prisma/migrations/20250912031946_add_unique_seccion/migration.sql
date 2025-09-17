/*
  Warnings:

  - A unique constraint covering the columns `[nombre]` on the table `seccion` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "seccion_nombre_key" ON "proyecto-1"."seccion"("nombre");
