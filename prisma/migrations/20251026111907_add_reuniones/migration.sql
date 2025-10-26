-- CreateEnum
CREATE TYPE "tipo_reunion" AS ENUM ('GENERAL', 'POR_GRADO', 'POR_AULA');

-- CreateEnum
CREATE TYPE "metodo_registro" AS ENUM ('QR', 'MANUAL');

-- CreateEnum
CREATE TYPE "estado_reunion" AS ENUM ('PROGRAMADA', 'REALIZADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "reuniones" (
    "id_reunion" SERIAL NOT NULL,
    "id_ie" INTEGER NOT NULL,
    "titulo" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "fecha" DATE NOT NULL,
    "hora_inicio" TIME(6) NOT NULL,
    "hora_fin" TIME(6),
    "tipo_reunion" "tipo_reunion" NOT NULL,
    "id_docente_responsable" INTEGER NOT NULL,
    "id_grado" INTEGER,
    "id_seccion" INTEGER,
    "metodo_registro" "metodo_registro" NOT NULL DEFAULT 'MANUAL',
    "estado" "estado_reunion" NOT NULL DEFAULT 'PROGRAMADA',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "reuniones_pkey" PRIMARY KEY ("id_reunion")
);

-- CreateIndex
CREATE INDEX "reuniones_id_ie_fecha_idx" ON "reuniones"("id_ie", "fecha");

-- CreateIndex
CREATE INDEX "reuniones_id_docente_responsable_idx" ON "reuniones"("id_docente_responsable");

-- CreateIndex
CREATE INDEX "reuniones_estado_idx" ON "reuniones"("estado");

-- AddForeignKey
ALTER TABLE "reuniones" ADD CONSTRAINT "reuniones_id_ie_fkey" FOREIGN KEY ("id_ie") REFERENCES "ie"("id_ie") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reuniones" ADD CONSTRAINT "reuniones_id_docente_responsable_fkey" FOREIGN KEY ("id_docente_responsable") REFERENCES "docente"("id_docente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reuniones" ADD CONSTRAINT "reuniones_id_grado_fkey" FOREIGN KEY ("id_grado") REFERENCES "grado"("id_grado") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reuniones" ADD CONSTRAINT "reuniones_id_seccion_fkey" FOREIGN KEY ("id_seccion") REFERENCES "seccion"("id_seccion") ON DELETE SET NULL ON UPDATE CASCADE;
