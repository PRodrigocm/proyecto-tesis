/*
  Warnings:

  - You are about to drop the `evento_participantes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `evento_recursos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `eventos` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "proyecto-1"."evento_participantes" DROP CONSTRAINT "evento_participantes_id_evento_fkey";

-- DropForeignKey
ALTER TABLE "proyecto-1"."evento_participantes" DROP CONSTRAINT "evento_participantes_id_usuario_fkey";

-- DropForeignKey
ALTER TABLE "proyecto-1"."evento_recursos" DROP CONSTRAINT "evento_recursos_id_evento_fkey";

-- DropForeignKey
ALTER TABLE "proyecto-1"."eventos" DROP CONSTRAINT "eventos_creado_por_fkey";

-- DropForeignKey
ALTER TABLE "proyecto-1"."eventos" DROP CONSTRAINT "eventos_id_ie_fkey";

-- DropTable
DROP TABLE "proyecto-1"."evento_participantes";

-- DropTable
DROP TABLE "proyecto-1"."evento_recursos";

-- DropTable
DROP TABLE "proyecto-1"."eventos";

-- DropEnum
DROP TYPE "proyecto-1"."estado_evento";

-- DropEnum
DROP TYPE "proyecto-1"."estado_recurso";

-- DropEnum
DROP TYPE "proyecto-1"."tipo_evento";

-- DropEnum
DROP TYPE "proyecto-1"."tipo_participante";

-- DropEnum
DROP TYPE "proyecto-1"."tipo_recurso";
