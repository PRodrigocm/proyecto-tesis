-- CreateTable
CREATE TABLE "configuracion_ie" (
    "id_configuracion" SERIAL NOT NULL,
    "id_ie" INTEGER NOT NULL,
    "hora_ingreso_manana" VARCHAR(5),
    "hora_fin_ingreso_manana" VARCHAR(5),
    "hora_salida_manana" VARCHAR(5),
    "hora_ingreso_tarde" VARCHAR(5),
    "hora_fin_ingreso_tarde" VARCHAR(5),
    "hora_salida_tarde" VARCHAR(5),
    "tolerancia_minutos" INTEGER NOT NULL DEFAULT 15,
    "dias_laborables" TEXT[] DEFAULT ARRAY['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES']::TEXT[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "configuracion_ie_pkey" PRIMARY KEY ("id_configuracion")
);

-- CreateIndex
CREATE UNIQUE INDEX "configuracion_ie_id_ie_key" ON "configuracion_ie"("id_ie");
