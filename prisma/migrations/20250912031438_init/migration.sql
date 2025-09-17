-- CreateTable
CREATE TABLE "proyecto-1"."modalidad" (
    "id_modalidad" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "modalidad_pkey" PRIMARY KEY ("id_modalidad")
);

-- CreateTable
CREATE TABLE "proyecto-1"."ie" (
    "id_ie" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo_ie" VARCHAR(10) NOT NULL,
    "id_modalidad" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,

    CONSTRAINT "ie_pkey" PRIMARY KEY ("id_ie")
);

-- CreateTable
CREATE TABLE "proyecto-1"."nivel" (
    "id_nivel" SERIAL NOT NULL,
    "id_ie" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "nivel_pkey" PRIMARY KEY ("id_nivel")
);

-- CreateTable
CREATE TABLE "proyecto-1"."grado" (
    "id_grado" SERIAL NOT NULL,
    "id_nivel" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "grado_pkey" PRIMARY KEY ("id_grado")
);

-- CreateTable
CREATE TABLE "proyecto-1"."seccion" (
    "id_seccion" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "seccion_pkey" PRIMARY KEY ("id_seccion")
);

-- CreateTable
CREATE TABLE "proyecto-1"."grado_seccion" (
    "id_grado_seccion" SERIAL NOT NULL,
    "id_grado" INTEGER NOT NULL,
    "id_seccion" INTEGER NOT NULL,

    CONSTRAINT "grado_seccion_pkey" PRIMARY KEY ("id_grado_seccion")
);

-- CreateTable
CREATE TABLE "proyecto-1"."usuarios" (
    "id_usuario" SERIAL NOT NULL,
    "nombre" TEXT,
    "apellido" TEXT,
    "dni" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "password_hash" TEXT,
    "estado" TEXT,
    "id_ie" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "proyecto-1"."roles" (
    "id_rol" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id_rol")
);

-- CreateTable
CREATE TABLE "proyecto-1"."usuario_rol" (
    "id_usuario" INTEGER NOT NULL,
    "id_rol" INTEGER NOT NULL,

    CONSTRAINT "usuario_rol_pkey" PRIMARY KEY ("id_usuario","id_rol")
);

-- CreateTable
CREATE TABLE "proyecto-1"."estudiante" (
    "id_estudiante" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_ie" INTEGER,
    "id_grado_seccion" INTEGER,
    "qr" TEXT NOT NULL,
    "codigo" VARCHAR(32),
    "fecha_nacimiento" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,

    CONSTRAINT "estudiante_pkey" PRIMARY KEY ("id_estudiante")
);

-- CreateTable
CREATE TABLE "proyecto-1"."apoderado" (
    "id_apoderado" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "codigo" VARCHAR(32),
    "ocupacion" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,

    CONSTRAINT "apoderado_pkey" PRIMARY KEY ("id_apoderado")
);

-- CreateTable
CREATE TABLE "proyecto-1"."docente" (
    "id_docente" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "codigo" VARCHAR(32),
    "especialidad" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,

    CONSTRAINT "docente_pkey" PRIMARY KEY ("id_docente")
);

-- CreateTable
CREATE TABLE "proyecto-1"."estudiante_apoderado" (
    "id_estudiante" INTEGER NOT NULL,
    "id_apoderado" INTEGER NOT NULL,
    "relacion" TEXT NOT NULL,
    "es_titular" BOOLEAN NOT NULL DEFAULT false,
    "puede_retirar" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "estudiante_apoderado_pkey" PRIMARY KEY ("id_estudiante","id_apoderado")
);

-- CreateTable
CREATE TABLE "proyecto-1"."tipos_asignacion" (
    "id_tipo_asignacion" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "tipos_asignacion_pkey" PRIMARY KEY ("id_tipo_asignacion")
);

-- CreateTable
CREATE TABLE "proyecto-1"."docente_aula" (
    "id_docente_aula" SERIAL NOT NULL,
    "id_docente" INTEGER NOT NULL,
    "id_grado_seccion" INTEGER NOT NULL,
    "id_tipo_asignacion" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,

    CONSTRAINT "docente_aula_pkey" PRIMARY KEY ("id_docente_aula")
);

-- CreateTable
CREATE TABLE "proyecto-1"."calendario_escolar" (
    "id_cal" SERIAL NOT NULL,
    "id_ie" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "es_lectivo" BOOLEAN NOT NULL DEFAULT true,
    "motivo" TEXT,

    CONSTRAINT "calendario_escolar_pkey" PRIMARY KEY ("id_cal")
);

-- CreateTable
CREATE TABLE "proyecto-1"."horarios_grado_seccion" (
    "id_horario" SERIAL NOT NULL,
    "id_grado_seccion" INTEGER NOT NULL,
    "dia_semana" INTEGER NOT NULL,
    "hora_entrada" TIME NOT NULL,
    "hora_salida" TIME NOT NULL,
    "tolerancia_min" INTEGER NOT NULL DEFAULT 10,
    "sesiones" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "horarios_grado_seccion_pkey" PRIMARY KEY ("id_horario")
);

-- CreateTable
CREATE TABLE "proyecto-1"."talleres" (
    "id_taller" SERIAL NOT NULL,
    "id_ie" INTEGER NOT NULL,
    "codigo" VARCHAR(32),
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "talleres_pkey" PRIMARY KEY ("id_taller")
);

-- CreateTable
CREATE TABLE "proyecto-1"."inscripcion_taller" (
    "id_inscripcion" SERIAL NOT NULL,
    "id_estudiante" INTEGER NOT NULL,
    "id_taller" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "fecha_inscripcion" DATE NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'activa',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inscripcion_taller_pkey" PRIMARY KEY ("id_inscripcion")
);

-- CreateTable
CREATE TABLE "proyecto-1"."horarios_taller" (
    "id_horario_taller" SERIAL NOT NULL,
    "id_taller" INTEGER NOT NULL,
    "dia_semana" INTEGER NOT NULL,
    "hora_inicio" TIME NOT NULL,
    "hora_fin" TIME NOT NULL,
    "tolerancia_min" INTEGER NOT NULL DEFAULT 10,
    "lugar" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "horarios_taller_pkey" PRIMARY KEY ("id_horario_taller")
);

-- CreateTable
CREATE TABLE "proyecto-1"."estados_asistencia" (
    "id_estado_asistencia" SERIAL NOT NULL,
    "nombre_estado" TEXT NOT NULL,

    CONSTRAINT "estados_asistencia_pkey" PRIMARY KEY ("id_estado_asistencia")
);

-- CreateTable
CREATE TABLE "proyecto-1"."asistencias" (
    "id_asistencia" SERIAL NOT NULL,
    "id_estudiante" INTEGER NOT NULL,
    "id_ie" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "sesion" TEXT NOT NULL DEFAULT 'AM',
    "id_inscripcion_taller" INTEGER,
    "hora_entrada" TIME,
    "hora_salida" TIME,
    "id_estado_asistencia" INTEGER,
    "fuente" TEXT,
    "observaciones" TEXT,
    "registrado_por" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,

    CONSTRAINT "asistencias_pkey" PRIMARY KEY ("id_asistencia")
);

-- CreateTable
CREATE TABLE "proyecto-1"."historico_estados_asistencia" (
    "id_historico" SERIAL NOT NULL,
    "id_asistencia" INTEGER NOT NULL,
    "id_estado_asistencia" INTEGER NOT NULL,
    "fecha_cambio" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cambiado_por" INTEGER,

    CONSTRAINT "historico_estados_asistencia_pkey" PRIMARY KEY ("id_historico")
);

-- CreateTable
CREATE TABLE "proyecto-1"."tipo_retiro" (
    "id_tipo_retiro" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "tipo_retiro_pkey" PRIMARY KEY ("id_tipo_retiro")
);

-- CreateTable
CREATE TABLE "proyecto-1"."estados_retiro" (
    "id_estado_retiro" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 1,
    "es_final" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estados_retiro_pkey" PRIMARY KEY ("id_estado_retiro")
);

-- CreateTable
CREATE TABLE "proyecto-1"."autorizaciones_retiro" (
    "id_aut" SERIAL NOT NULL,
    "id_estudiante" INTEGER NOT NULL,
    "id_apoderado" INTEGER NOT NULL,
    "vigente_desde" DATE,
    "vigente_hasta" DATE,
    "observacion" TEXT,

    CONSTRAINT "autorizaciones_retiro_pkey" PRIMARY KEY ("id_aut")
);

-- CreateTable
CREATE TABLE "proyecto-1"."retiros" (
    "id_retiro" SERIAL NOT NULL,
    "id_estudiante" INTEGER NOT NULL,
    "id_ie" INTEGER NOT NULL,
    "id_grado_seccion" INTEGER,
    "fecha" DATE NOT NULL,
    "hora" TIME NOT NULL,
    "id_tipo_retiro" INTEGER,
    "origen" TEXT,
    "reportado_por_docente" INTEGER,
    "apoderado_contactado" INTEGER,
    "hora_contacto" TIMESTAMPTZ,
    "medio_contacto" TEXT,
    "apoderado_que_retira" INTEGER,
    "dni_verificado" TEXT,
    "verificado_por" INTEGER,
    "id_estado_retiro" INTEGER,
    "observaciones" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,

    CONSTRAINT "retiros_pkey" PRIMARY KEY ("id_retiro")
);

-- CreateTable
CREATE TABLE "proyecto-1"."consecutivos" (
    "tabla" TEXT NOT NULL,
    "id_ie" INTEGER NOT NULL,
    "ultimo_num" INTEGER NOT NULL DEFAULT 0,
    "ancho" INTEGER NOT NULL DEFAULT 2,
    "prefijo_fijo" VARCHAR(10),

    CONSTRAINT "consecutivos_pkey" PRIMARY KEY ("tabla","id_ie")
);

-- CreateIndex
CREATE UNIQUE INDEX "modalidad_nombre_key" ON "proyecto-1"."modalidad"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "ie_nombre_key" ON "proyecto-1"."ie"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "ie_codigo_ie_key" ON "proyecto-1"."ie"("codigo_ie");

-- CreateIndex
CREATE UNIQUE INDEX "nivel_id_ie_nombre_key" ON "proyecto-1"."nivel"("id_ie", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "grado_id_nivel_nombre_key" ON "proyecto-1"."grado"("id_nivel", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "grado_seccion_id_grado_id_seccion_key" ON "proyecto-1"."grado_seccion"("id_grado", "id_seccion");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_dni_key" ON "proyecto-1"."usuarios"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_key" ON "proyecto-1"."roles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "estudiante_id_usuario_key" ON "proyecto-1"."estudiante"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "estudiante_qr_key" ON "proyecto-1"."estudiante"("qr");

-- CreateIndex
CREATE UNIQUE INDEX "estudiante_codigo_key" ON "proyecto-1"."estudiante"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "apoderado_id_usuario_key" ON "proyecto-1"."apoderado"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "apoderado_codigo_key" ON "proyecto-1"."apoderado"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "docente_id_usuario_key" ON "proyecto-1"."docente"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "docente_codigo_key" ON "proyecto-1"."docente"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_asignacion_nombre_key" ON "proyecto-1"."tipos_asignacion"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "docente_aula_id_docente_id_grado_seccion_id_tipo_asignacion_key" ON "proyecto-1"."docente_aula"("id_docente", "id_grado_seccion", "id_tipo_asignacion");

-- CreateIndex
CREATE UNIQUE INDEX "calendario_escolar_id_ie_fecha_key" ON "proyecto-1"."calendario_escolar"("id_ie", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "horarios_grado_seccion_id_grado_seccion_dia_semana_key" ON "proyecto-1"."horarios_grado_seccion"("id_grado_seccion", "dia_semana");

-- CreateIndex
CREATE UNIQUE INDEX "talleres_codigo_key" ON "proyecto-1"."talleres"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "talleres_id_ie_nombre_key" ON "proyecto-1"."talleres"("id_ie", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "inscripcion_taller_id_estudiante_id_taller_anio_key" ON "proyecto-1"."inscripcion_taller"("id_estudiante", "id_taller", "anio");

-- CreateIndex
CREATE UNIQUE INDEX "horarios_taller_id_taller_dia_semana_hora_inicio_key" ON "proyecto-1"."horarios_taller"("id_taller", "dia_semana", "hora_inicio");

-- CreateIndex
CREATE UNIQUE INDEX "estados_asistencia_nombre_estado_key" ON "proyecto-1"."estados_asistencia"("nombre_estado");

-- CreateIndex
CREATE INDEX "asistencias_fecha_idx" ON "proyecto-1"."asistencias"("fecha");

-- CreateIndex
CREATE INDEX "asistencias_id_ie_fecha_idx" ON "proyecto-1"."asistencias"("id_ie", "fecha");

-- CreateIndex
CREATE INDEX "asistencias_id_inscripcion_taller_idx" ON "proyecto-1"."asistencias"("id_inscripcion_taller");

-- CreateIndex
CREATE UNIQUE INDEX "asistencias_id_estudiante_fecha_sesion_key" ON "proyecto-1"."asistencias"("id_estudiante", "fecha", "sesion");

-- CreateIndex
CREATE UNIQUE INDEX "tipo_retiro_nombre_key" ON "proyecto-1"."tipo_retiro"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "estados_retiro_codigo_key" ON "proyecto-1"."estados_retiro"("codigo");

-- CreateIndex
CREATE INDEX "autorizaciones_retiro_id_estudiante_id_apoderado_vigente_de_idx" ON "proyecto-1"."autorizaciones_retiro"("id_estudiante", "id_apoderado", "vigente_desde");

-- CreateIndex
CREATE INDEX "retiros_id_estudiante_fecha_idx" ON "proyecto-1"."retiros"("id_estudiante", "fecha");

-- CreateIndex
CREATE INDEX "retiros_id_ie_fecha_idx" ON "proyecto-1"."retiros"("id_ie", "fecha");

-- CreateIndex
CREATE INDEX "retiros_id_estado_retiro_idx" ON "proyecto-1"."retiros"("id_estado_retiro");

-- AddForeignKey
ALTER TABLE "proyecto-1"."ie" ADD CONSTRAINT "ie_id_modalidad_fkey" FOREIGN KEY ("id_modalidad") REFERENCES "proyecto-1"."modalidad"("id_modalidad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."nivel" ADD CONSTRAINT "nivel_id_ie_fkey" FOREIGN KEY ("id_ie") REFERENCES "proyecto-1"."ie"("id_ie") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."grado" ADD CONSTRAINT "grado_id_nivel_fkey" FOREIGN KEY ("id_nivel") REFERENCES "proyecto-1"."nivel"("id_nivel") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."grado_seccion" ADD CONSTRAINT "grado_seccion_id_grado_fkey" FOREIGN KEY ("id_grado") REFERENCES "proyecto-1"."grado"("id_grado") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."grado_seccion" ADD CONSTRAINT "grado_seccion_id_seccion_fkey" FOREIGN KEY ("id_seccion") REFERENCES "proyecto-1"."seccion"("id_seccion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."usuarios" ADD CONSTRAINT "usuarios_id_ie_fkey" FOREIGN KEY ("id_ie") REFERENCES "proyecto-1"."ie"("id_ie") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."usuario_rol" ADD CONSTRAINT "usuario_rol_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "proyecto-1"."usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."usuario_rol" ADD CONSTRAINT "usuario_rol_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "proyecto-1"."roles"("id_rol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."estudiante" ADD CONSTRAINT "estudiante_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "proyecto-1"."usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."estudiante" ADD CONSTRAINT "estudiante_id_ie_fkey" FOREIGN KEY ("id_ie") REFERENCES "proyecto-1"."ie"("id_ie") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."estudiante" ADD CONSTRAINT "estudiante_id_grado_seccion_fkey" FOREIGN KEY ("id_grado_seccion") REFERENCES "proyecto-1"."grado_seccion"("id_grado_seccion") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."apoderado" ADD CONSTRAINT "apoderado_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "proyecto-1"."usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."docente" ADD CONSTRAINT "docente_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "proyecto-1"."usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."estudiante_apoderado" ADD CONSTRAINT "estudiante_apoderado_id_estudiante_fkey" FOREIGN KEY ("id_estudiante") REFERENCES "proyecto-1"."estudiante"("id_estudiante") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."estudiante_apoderado" ADD CONSTRAINT "estudiante_apoderado_id_apoderado_fkey" FOREIGN KEY ("id_apoderado") REFERENCES "proyecto-1"."apoderado"("id_apoderado") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."docente_aula" ADD CONSTRAINT "docente_aula_id_docente_fkey" FOREIGN KEY ("id_docente") REFERENCES "proyecto-1"."docente"("id_docente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."docente_aula" ADD CONSTRAINT "docente_aula_id_grado_seccion_fkey" FOREIGN KEY ("id_grado_seccion") REFERENCES "proyecto-1"."grado_seccion"("id_grado_seccion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."docente_aula" ADD CONSTRAINT "docente_aula_id_tipo_asignacion_fkey" FOREIGN KEY ("id_tipo_asignacion") REFERENCES "proyecto-1"."tipos_asignacion"("id_tipo_asignacion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."calendario_escolar" ADD CONSTRAINT "calendario_escolar_id_ie_fkey" FOREIGN KEY ("id_ie") REFERENCES "proyecto-1"."ie"("id_ie") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."horarios_grado_seccion" ADD CONSTRAINT "horarios_grado_seccion_id_grado_seccion_fkey" FOREIGN KEY ("id_grado_seccion") REFERENCES "proyecto-1"."grado_seccion"("id_grado_seccion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."talleres" ADD CONSTRAINT "talleres_id_ie_fkey" FOREIGN KEY ("id_ie") REFERENCES "proyecto-1"."ie"("id_ie") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."inscripcion_taller" ADD CONSTRAINT "inscripcion_taller_id_estudiante_fkey" FOREIGN KEY ("id_estudiante") REFERENCES "proyecto-1"."estudiante"("id_estudiante") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."inscripcion_taller" ADD CONSTRAINT "inscripcion_taller_id_taller_fkey" FOREIGN KEY ("id_taller") REFERENCES "proyecto-1"."talleres"("id_taller") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."horarios_taller" ADD CONSTRAINT "horarios_taller_id_taller_fkey" FOREIGN KEY ("id_taller") REFERENCES "proyecto-1"."talleres"("id_taller") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."asistencias" ADD CONSTRAINT "asistencias_id_estudiante_fkey" FOREIGN KEY ("id_estudiante") REFERENCES "proyecto-1"."estudiante"("id_estudiante") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."asistencias" ADD CONSTRAINT "asistencias_id_ie_fkey" FOREIGN KEY ("id_ie") REFERENCES "proyecto-1"."ie"("id_ie") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."asistencias" ADD CONSTRAINT "asistencias_id_inscripcion_taller_fkey" FOREIGN KEY ("id_inscripcion_taller") REFERENCES "proyecto-1"."inscripcion_taller"("id_inscripcion") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."asistencias" ADD CONSTRAINT "asistencias_id_estado_asistencia_fkey" FOREIGN KEY ("id_estado_asistencia") REFERENCES "proyecto-1"."estados_asistencia"("id_estado_asistencia") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."asistencias" ADD CONSTRAINT "asistencias_registrado_por_fkey" FOREIGN KEY ("registrado_por") REFERENCES "proyecto-1"."usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."historico_estados_asistencia" ADD CONSTRAINT "historico_estados_asistencia_id_asistencia_fkey" FOREIGN KEY ("id_asistencia") REFERENCES "proyecto-1"."asistencias"("id_asistencia") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."historico_estados_asistencia" ADD CONSTRAINT "historico_estados_asistencia_id_estado_asistencia_fkey" FOREIGN KEY ("id_estado_asistencia") REFERENCES "proyecto-1"."estados_asistencia"("id_estado_asistencia") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."historico_estados_asistencia" ADD CONSTRAINT "historico_estados_asistencia_cambiado_por_fkey" FOREIGN KEY ("cambiado_por") REFERENCES "proyecto-1"."usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."autorizaciones_retiro" ADD CONSTRAINT "autorizaciones_retiro_id_estudiante_fkey" FOREIGN KEY ("id_estudiante") REFERENCES "proyecto-1"."estudiante"("id_estudiante") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."autorizaciones_retiro" ADD CONSTRAINT "autorizaciones_retiro_id_apoderado_fkey" FOREIGN KEY ("id_apoderado") REFERENCES "proyecto-1"."apoderado"("id_apoderado") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."retiros" ADD CONSTRAINT "retiros_id_estudiante_fkey" FOREIGN KEY ("id_estudiante") REFERENCES "proyecto-1"."estudiante"("id_estudiante") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."retiros" ADD CONSTRAINT "retiros_id_ie_fkey" FOREIGN KEY ("id_ie") REFERENCES "proyecto-1"."ie"("id_ie") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."retiros" ADD CONSTRAINT "retiros_id_grado_seccion_fkey" FOREIGN KEY ("id_grado_seccion") REFERENCES "proyecto-1"."grado_seccion"("id_grado_seccion") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."retiros" ADD CONSTRAINT "retiros_id_tipo_retiro_fkey" FOREIGN KEY ("id_tipo_retiro") REFERENCES "proyecto-1"."tipo_retiro"("id_tipo_retiro") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."retiros" ADD CONSTRAINT "retiros_reportado_por_docente_fkey" FOREIGN KEY ("reportado_por_docente") REFERENCES "proyecto-1"."docente"("id_docente") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."retiros" ADD CONSTRAINT "retiros_apoderado_contactado_fkey" FOREIGN KEY ("apoderado_contactado") REFERENCES "proyecto-1"."apoderado"("id_apoderado") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."retiros" ADD CONSTRAINT "retiros_apoderado_que_retira_fkey" FOREIGN KEY ("apoderado_que_retira") REFERENCES "proyecto-1"."apoderado"("id_apoderado") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."retiros" ADD CONSTRAINT "retiros_verificado_por_fkey" FOREIGN KEY ("verificado_por") REFERENCES "proyecto-1"."usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."retiros" ADD CONSTRAINT "retiros_id_estado_retiro_fkey" FOREIGN KEY ("id_estado_retiro") REFERENCES "proyecto-1"."estados_retiro"("id_estado_retiro") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto-1"."consecutivos" ADD CONSTRAINT "consecutivos_id_ie_fkey" FOREIGN KEY ("id_ie") REFERENCES "proyecto-1"."ie"("id_ie") ON DELETE RESTRICT ON UPDATE CASCADE;
