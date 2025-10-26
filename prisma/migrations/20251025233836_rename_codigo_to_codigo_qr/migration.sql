/*
  Warnings:

  - You are about to drop the column `codigo` on the `estudiante` table. All the data in the column will be lost.
  - You are about to drop the column `qr` on the `estudiante` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[codigo_qr]` on the table `estudiante` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `codigo_qr` to the `estudiante` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "proyecto-1"."estudiante_codigo_key";

-- DropIndex
DROP INDEX "proyecto-1"."estudiante_qr_key";

-- AlterTable
ALTER TABLE "estudiante" DROP COLUMN "codigo",
DROP COLUMN "qr",
ADD COLUMN     "codigo_qr" VARCHAR(32) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "estudiante_codigo_qr_key" ON "estudiante"("codigo_qr");
