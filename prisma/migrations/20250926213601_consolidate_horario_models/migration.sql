/*
  Warnings:

  - You are about to drop the `horarios_grado_seccion` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "proyecto-1"."excepciones_horario" DROP CONSTRAINT "excepciones_horario_id_horario_clase_fkey";

-- DropForeignKey
ALTER TABLE "proyecto-1"."horarios_grado_seccion" DROP CONSTRAINT "horarios_grado_seccion_id_grado_seccion_fkey";

-- DropForeignKey
ALTER TABLE "proyecto-1"."horarios_semanales_detalle" DROP CONSTRAINT "horarios_semanales_detalle_id_horario_base_fkey";

-- AlterTable
ALTER TABLE "proyecto-1"."horarios_clase" ADD COLUMN     "sesiones" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "tipo_actividad" "proyecto-1"."tipo_actividad" NOT NULL DEFAULT 'CLASE_REGULAR',
ADD COLUMN     "tolerancia_min" INTEGER NOT NULL DEFAULT 10;

-- AlterTable
ALTER TABLE "proyecto-1"."talleres" ADD COLUMN     "capacidad_maxima" INTEGER,
ADD COLUMN     "instructor" TEXT,
ADD COLUMN     "updated_at" TIMESTAMPTZ;

-- DropTable
DROP TABLE "proyecto-1"."horarios_grado_seccion";

-- AddForeignKey
ALTER TABLE "proyecto-1"."excepciones_horario" ADD CONSTRAINT "excepciones_horario_id_horario_clase_fkey" FOREIGN KEY ("id_horario_clase") REFERENCES "proyecto-1"."horarios_clase"("id_horario_clase") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."horarios_semanales_detalle" ADD CONSTRAINT "horarios_semanales_detalle_id_horario_base_fkey" FOREIGN KEY ("id_horario_base") REFERENCES "proyecto-1"."horarios_clase"("id_horario_clase") ON DELETE RESTRICT ON UPDATE CASCADE;
