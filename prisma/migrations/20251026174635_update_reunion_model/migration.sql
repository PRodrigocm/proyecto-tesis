/*
  Warnings:

  - The values [POR_GRADO,POR_AULA] on the enum `tipo_reunion` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `reuniones` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropEnum (will be recreated)
DROP TYPE IF EXISTS "proyecto-1"."tipo_reunion" CASCADE;

-- DropForeignKey
ALTER TABLE "proyecto-1"."reuniones" DROP CONSTRAINT "reuniones_id_grado_fkey";

-- DropForeignKey
ALTER TABLE "proyecto-1"."reuniones" DROP CONSTRAINT "reuniones_id_ie_fkey";

-- DropForeignKey
ALTER TABLE "proyecto-1"."reuniones" DROP CONSTRAINT "reuniones_id_seccion_fkey";

-- DropForeignKey
ALTER TABLE "proyecto-1"."reuniones" DROP CONSTRAINT "reuniones_id_usuario_responsable_fkey";

-- DropTable
DROP TABLE "proyecto-1"."reuniones";

-- DropEnum
DROP TYPE IF EXISTS "proyecto-1"."estado_reunion";

-- DropEnum
DROP TYPE IF EXISTS "proyecto-1"."metodo_registro";

-- CreateEnum
CREATE TYPE "proyecto-1"."tipo_reunion" AS ENUM ('GENERAL', 'ENTREGA_LIBRETAS', 'ASAMBLEA_PADRES', 'TUTORIAL', 'EMERGENCIA', 'OTRO');

-- CreateTable
CREATE TABLE "proyecto-1"."reunion" (
    "id_reunion" SERIAL NOT NULL,
    "id_ie" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "fecha" TIMESTAMPTZ(6) NOT NULL,
    "hora_inicio" TIME(6) NOT NULL,
    "hora_fin" TIME(6) NOT NULL,
    "tipo" "proyecto-1"."tipo_reunion" NOT NULL DEFAULT 'GENERAL',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "reunion_pkey" PRIMARY KEY ("id_reunion")
);

-- CreateTable
CREATE TABLE "proyecto-1"."_ReunionGrados" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ReunionGrados_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "proyecto-1"."_ReunionSecciones" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ReunionSecciones_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ReunionGrados_B_index" ON "proyecto-1"."_ReunionGrados"("B");

-- CreateIndex
CREATE INDEX "_ReunionSecciones_B_index" ON "proyecto-1"."_ReunionSecciones"("B");

-- AddForeignKey
ALTER TABLE "proyecto-1"."reunion" ADD CONSTRAINT "reunion_id_ie_fkey" FOREIGN KEY ("id_ie") REFERENCES "proyecto-1"."ie"("id_ie") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."_ReunionGrados" ADD CONSTRAINT "_ReunionGrados_A_fkey" FOREIGN KEY ("A") REFERENCES "proyecto-1"."grado"("id_grado") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."_ReunionGrados" ADD CONSTRAINT "_ReunionGrados_B_fkey" FOREIGN KEY ("B") REFERENCES "proyecto-1"."reunion"("id_reunion") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."_ReunionSecciones" ADD CONSTRAINT "_ReunionSecciones_A_fkey" FOREIGN KEY ("A") REFERENCES "proyecto-1"."reunion"("id_reunion") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."_ReunionSecciones" ADD CONSTRAINT "_ReunionSecciones_B_fkey" FOREIGN KEY ("B") REFERENCES "proyecto-1"."seccion"("id_seccion") ON DELETE CASCADE ON UPDATE CASCADE;
