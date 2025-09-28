/*
  Warnings:

  - You are about to drop the `aulas` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "proyecto-1"."aulas" DROP CONSTRAINT "aulas_id_ie_fkey";

-- AlterTable
ALTER TABLE "proyecto-1"."ie" ADD COLUMN     "direccion" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "telefono" TEXT;

-- DropTable
DROP TABLE "proyecto-1"."aulas";
