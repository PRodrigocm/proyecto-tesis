-- CreateEnum
CREATE TYPE "proyecto-1"."tipo_evento" AS ENUM ('FIESTA', 'PRESENTACION', 'COMPETENCIA', 'REUNION', 'CEREMONIA', 'TALLER', 'CAPACITACION', 'ACTIVIDAD_DEPORTIVA', 'ACTIVIDAD_CULTURAL', 'REUNION_PADRES', 'CONSEJO_ACADEMICO', 'OTRO');

-- CreateEnum
CREATE TYPE "proyecto-1"."estado_evento" AS ENUM ('PLANIFICADO', 'CONFIRMADO', 'EN_CURSO', 'COMPLETADO', 'CANCELADO', 'POSPUESTO');

-- CreateEnum
CREATE TYPE "proyecto-1"."tipo_participante" AS ENUM ('ORGANIZADOR', 'INVITADO', 'ASISTENTE', 'PONENTE', 'JURADO', 'VOLUNTARIO', 'PADRE_FAMILIA', 'ESTUDIANTE', 'DOCENTE', 'ADMINISTRATIVO', 'EXTERNO');

-- CreateEnum
CREATE TYPE "proyecto-1"."tipo_recurso" AS ENUM ('AULA', 'AUDITORIO', 'LABORATORIO', 'GIMNASIO', 'PATIO', 'EQUIPO_SONIDO', 'PROYECTOR', 'COMPUTADORA', 'MICROFONO', 'DECORACION', 'CATERING', 'TRANSPORTE', 'MATERIAL_OFICINA', 'MOBILIARIO', 'OTRO');

-- CreateEnum
CREATE TYPE "proyecto-1"."estado_recurso" AS ENUM ('PENDIENTE', 'RESERVADO', 'CONFIRMADO', 'EN_USO', 'DEVUELTO', 'NO_DISPONIBLE');

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

-- CreateTable
CREATE TABLE "proyecto-1"."eventos" (
    "id_evento" SERIAL NOT NULL,
    "id_ie" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo_evento" "proyecto-1"."tipo_evento" NOT NULL,
    "fecha_inicio" TIMESTAMPTZ NOT NULL,
    "fecha_fin" TIMESTAMPTZ,
    "hora_inicio" TIME NOT NULL,
    "hora_fin" TIME,
    "ubicacion" TEXT,
    "organizador" TEXT,
    "estado" "proyecto-1"."estado_evento" NOT NULL DEFAULT 'PLANIFICADO',
    "es_publico" BOOLEAN NOT NULL DEFAULT true,
    "requiere_confirmacion" BOOLEAN NOT NULL DEFAULT false,
    "capacidad_maxima" INTEGER,
    "costo" DECIMAL(10,2),
    "observaciones" TEXT,
    "creado_por" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,

    CONSTRAINT "eventos_pkey" PRIMARY KEY ("id_evento")
);

-- CreateTable
CREATE TABLE "proyecto-1"."evento_participantes" (
    "id_participante" SERIAL NOT NULL,
    "id_evento" INTEGER NOT NULL,
    "id_usuario" INTEGER,
    "nombre_externo" TEXT,
    "email_externo" TEXT,
    "tipo_participante" "proyecto-1"."tipo_participante" NOT NULL,
    "confirmado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_confirmacion" TIMESTAMPTZ,
    "observaciones" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_participantes_pkey" PRIMARY KEY ("id_participante")
);

-- CreateTable
CREATE TABLE "proyecto-1"."evento_recursos" (
    "id_recurso" SERIAL NOT NULL,
    "id_evento" INTEGER NOT NULL,
    "tipo_recurso" "proyecto-1"."tipo_recurso" NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "costo" DECIMAL(10,2),
    "proveedor" TEXT,
    "estado" "proyecto-1"."estado_recurso" NOT NULL DEFAULT 'PENDIENTE',
    "fecha_reservado" TIMESTAMPTZ,
    "observaciones" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_recursos_pkey" PRIMARY KEY ("id_recurso")
);

-- CreateIndex
CREATE INDEX "notificaciones_id_usuario_leida_idx" ON "proyecto-1"."notificaciones"("id_usuario", "leida");

-- CreateIndex
CREATE INDEX "eventos_id_ie_fecha_inicio_idx" ON "proyecto-1"."eventos"("id_ie", "fecha_inicio");

-- CreateIndex
CREATE INDEX "eventos_tipo_evento_estado_idx" ON "proyecto-1"."eventos"("tipo_evento", "estado");

-- CreateIndex
CREATE INDEX "evento_participantes_id_evento_confirmado_idx" ON "proyecto-1"."evento_participantes"("id_evento", "confirmado");

-- CreateIndex
CREATE UNIQUE INDEX "evento_participantes_id_evento_id_usuario_key" ON "proyecto-1"."evento_participantes"("id_evento", "id_usuario");

-- CreateIndex
CREATE INDEX "evento_recursos_id_evento_tipo_recurso_idx" ON "proyecto-1"."evento_recursos"("id_evento", "tipo_recurso");

-- AddForeignKey
ALTER TABLE "proyecto-1"."notificaciones" ADD CONSTRAINT "notificaciones_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "proyecto-1"."usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."eventos" ADD CONSTRAINT "eventos_id_ie_fkey" FOREIGN KEY ("id_ie") REFERENCES "proyecto-1"."ie"("id_ie") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."eventos" ADD CONSTRAINT "eventos_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "proyecto-1"."usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."evento_participantes" ADD CONSTRAINT "evento_participantes_id_evento_fkey" FOREIGN KEY ("id_evento") REFERENCES "proyecto-1"."eventos"("id_evento") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."evento_participantes" ADD CONSTRAINT "evento_participantes_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "proyecto-1"."usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."evento_recursos" ADD CONSTRAINT "evento_recursos_id_evento_fkey" FOREIGN KEY ("id_evento") REFERENCES "proyecto-1"."eventos"("id_evento") ON DELETE CASCADE ON UPDATE CASCADE;
