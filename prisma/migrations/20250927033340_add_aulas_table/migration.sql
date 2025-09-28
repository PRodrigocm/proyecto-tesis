-- CreateTable
CREATE TABLE "proyecto-1"."aulas" (
    "id_aula" SERIAL NOT NULL,
    "id_ie" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "capacidad" INTEGER,
    "tipo" TEXT,
    "ubicacion" TEXT,
    "equipamiento" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,

    CONSTRAINT "aulas_pkey" PRIMARY KEY ("id_aula")
);

-- CreateIndex
CREATE INDEX "aulas_id_ie_idx" ON "proyecto-1"."aulas"("id_ie");

-- CreateIndex
CREATE INDEX "aulas_tipo_idx" ON "proyecto-1"."aulas"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "aulas_id_ie_nombre_key" ON "proyecto-1"."aulas"("id_ie", "nombre");

-- AddForeignKey
ALTER TABLE "proyecto-1"."aulas" ADD CONSTRAINT "aulas_id_ie_fkey" FOREIGN KEY ("id_ie") REFERENCES "proyecto-1"."ie"("id_ie") ON DELETE RESTRICT ON UPDATE CASCADE;
