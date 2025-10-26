/*
  Warnings:

  - Added the required column `fechaInicio` to the `excepciones_horario` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "excepciones_horario" ADD COLUMN     "fechaInicio" DATE NOT NULL;
