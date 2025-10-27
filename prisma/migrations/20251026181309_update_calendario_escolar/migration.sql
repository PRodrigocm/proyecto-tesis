/*
  Warnings:

  - The primary key for the `calendario_escolar` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `es_lectivo` on the `calendario_escolar` table. All the data in the column will be lost.
  - You are about to drop the column `fecha` on the `calendario_escolar` table. All the data in the column will be lost.
  - You are about to drop the column `id_cal` on the `calendario_escolar` table. All the data in the column will be lost.
  - You are about to drop the column `motivo` on the `calendario_escolar` table. All the data in the column will be lost.
  - You are about to drop the `excepciones_horario` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `fecha_fin` to the `calendario_escolar` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fecha_inicio` to the `calendario_escolar` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipo_dia` to the `calendario_escolar` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "proyecto-1"."excepciones_horario" DROP CONSTRAINT "excepciones_horario_id_horario_clase_fkey";

-- DropForeignKey
ALTER TABLE "proyecto-1"."excepciones_horario" DROP CONSTRAINT "excepciones_horario_id_ie_fkey";

-- DropIndex
DROP INDEX "proyecto-1"."calendario_escolar_id_ie_fecha_key";

-- AlterTable
ALTER TABLE "calendario_escolar" DROP CONSTRAINT "calendario_escolar_pkey",
DROP COLUMN "es_lectivo",
DROP COLUMN "fecha",
DROP COLUMN "id_cal",
DROP COLUMN "motivo",
ADD COLUMN     "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "descripcion" TEXT,
ADD COLUMN     "fecha_fin" DATE NOT NULL,
ADD COLUMN     "fecha_inicio" DATE NOT NULL,
ADD COLUMN     "id_calendario" SERIAL NOT NULL,
ADD COLUMN     "tipo_dia" TEXT NOT NULL,
ADD CONSTRAINT "calendario_escolar_pkey" PRIMARY KEY ("id_calendario");

-- DropTable
DROP TABLE "proyecto-1"."excepciones_horario";

-- DropEnum
DROP TYPE "proyecto-1"."tipo_excepcion";

-- DropEnum
DROP TYPE "proyecto-1"."tipo_horario";

-- CreateIndex
CREATE INDEX "calendario_escolar_id_ie_fecha_inicio_idx" ON "calendario_escolar"("id_ie", "fecha_inicio");

-- CreateIndex
CREATE INDEX "calendario_escolar_tipo_dia_idx" ON "calendario_escolar"("tipo_dia");
