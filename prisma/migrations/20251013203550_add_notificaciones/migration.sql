-- CreateTable
CREATE TABLE "proyecto-1"."notificaciones" (
    "id_notificacion" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "fecha_envio" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_lectura" TIMESTAMPTZ,
    "origen" TEXT,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id_notificacion")
);

-- CreateIndex
CREATE INDEX "notificaciones_id_usuario_leida_idx" ON "proyecto-1"."notificaciones"("id_usuario", "leida");

-- AddForeignKey
ALTER TABLE "proyecto-1"."notificaciones" ADD CONSTRAINT "notificaciones_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "proyecto-1"."usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
