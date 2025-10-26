/*
  Warnings:

  - You are about to drop the column `id_docente_responsable` on the `reuniones` table. All the data in the column will be lost.
  - Added the required column `id_usuario_responsable` to the `reuniones` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "proyecto-1"."reuniones" DROP CONSTRAINT "reuniones_id_docente_responsable_fkey";

-- DropIndex
DROP INDEX "proyecto-1"."reuniones_id_docente_responsable_idx";

-- AlterTable
ALTER TABLE "reuniones" DROP COLUMN "id_docente_responsable",
ADD COLUMN     "id_usuario_responsable" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "reuniones_id_usuario_responsable_idx" ON "reuniones"("id_usuario_responsable");

-- AddForeignKey
ALTER TABLE "reuniones" ADD CONSTRAINT "reuniones_id_usuario_responsable_fkey" FOREIGN KEY ("id_usuario_responsable") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
