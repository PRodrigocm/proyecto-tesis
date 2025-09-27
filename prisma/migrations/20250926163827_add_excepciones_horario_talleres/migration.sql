-- CreateEnum
CREATE TYPE "proyecto-1"."tipo_excepcion" AS ENUM ('FERIADO', 'DIA_NO_LABORABLE', 'SUSPENSION_CLASES', 'HORARIO_ESPECIAL', 'VACACIONES', 'CAPACITACION', 'OTRO');

-- CreateEnum
CREATE TYPE "proyecto-1"."tipo_horario" AS ENUM ('CLASE', 'TALLER', 'AMBOS');

-- AlterTable
ALTER TABLE "proyecto-1"."horarios_grado_seccion" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "proyecto-1"."horarios_taller" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "proyecto-1"."excepciones_horario" (
    "id_excepcion" SERIAL NOT NULL,
    "id_ie" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "tipo_excepcion" "proyecto-1"."tipo_excepcion" NOT NULL,
    "tipo_horario" "proyecto-1"."tipo_horario" NOT NULL,
    "id_horario_clase" INTEGER,
    "id_horario_taller" INTEGER,
    "motivo" TEXT,
    "descripcion" TEXT,
    "hora_inicio_alt" TIME,
    "hora_fin_alt" TIME,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,

    CONSTRAINT "excepciones_horario_pkey" PRIMARY KEY ("id_excepcion")
);

-- CreateTable
CREATE TABLE "proyecto-1"."horarios_clase" (
    "id_horario_clase" SERIAL NOT NULL,
    "id_grado_seccion" INTEGER NOT NULL,
    "id_docente" INTEGER,
    "materia" TEXT NOT NULL,
    "dia_semana" INTEGER NOT NULL,
    "hora_inicio" TIME NOT NULL,
    "hora_fin" TIME NOT NULL,
    "aula" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,

    CONSTRAINT "horarios_clase_pkey" PRIMARY KEY ("id_horario_clase")
);

-- CreateIndex
CREATE INDEX "excepciones_horario_fecha_idx" ON "proyecto-1"."excepciones_horario"("fecha");

-- CreateIndex
CREATE INDEX "excepciones_horario_id_ie_fecha_idx" ON "proyecto-1"."excepciones_horario"("id_ie", "fecha");

-- CreateIndex
CREATE INDEX "excepciones_horario_tipo_horario_idx" ON "proyecto-1"."excepciones_horario"("tipo_horario");

-- CreateIndex
CREATE UNIQUE INDEX "excepciones_horario_id_horario_clase_fecha_key" ON "proyecto-1"."excepciones_horario"("id_horario_clase", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "excepciones_horario_id_horario_taller_fecha_key" ON "proyecto-1"."excepciones_horario"("id_horario_taller", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "horarios_clase_id_grado_seccion_dia_semana_hora_inicio_mate_key" ON "proyecto-1"."horarios_clase"("id_grado_seccion", "dia_semana", "hora_inicio", "materia");

-- AddForeignKey
ALTER TABLE "proyecto-1"."excepciones_horario" ADD CONSTRAINT "excepciones_horario_id_horario_clase_fkey" FOREIGN KEY ("id_horario_clase") REFERENCES "proyecto-1"."horarios_grado_seccion"("id_horario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."excepciones_horario" ADD CONSTRAINT "excepciones_horario_id_horario_taller_fkey" FOREIGN KEY ("id_horario_taller") REFERENCES "proyecto-1"."horarios_taller"("id_horario_taller") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."excepciones_horario" ADD CONSTRAINT "excepciones_horario_id_ie_fkey" FOREIGN KEY ("id_ie") REFERENCES "proyecto-1"."ie"("id_ie") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."horarios_clase" ADD CONSTRAINT "horarios_clase_id_grado_seccion_fkey" FOREIGN KEY ("id_grado_seccion") REFERENCES "proyecto-1"."grado_seccion"("id_grado_seccion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."horarios_clase" ADD CONSTRAINT "horarios_clase_id_docente_fkey" FOREIGN KEY ("id_docente") REFERENCES "proyecto-1"."docente"("id_docente") ON DELETE SET NULL ON UPDATE CASCADE;
