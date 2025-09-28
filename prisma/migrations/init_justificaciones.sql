-- ============================================================================
-- MIGRACIÓN: Sistema de Inasistencias y Justificaciones
-- ============================================================================

-- Actualizar estados de asistencia existentes
UPDATE estados_asistencia SET 
  codigo = 'PRESENTE',
  requiere_justificacion = false,
  afecta_asistencia = true
WHERE nombre_estado = 'Presente';

UPDATE estados_asistencia SET 
  codigo = 'TARDANZA',
  requiere_justificacion = false,
  afecta_asistencia = true
WHERE nombre_estado = 'Tardanza';

-- Insertar nuevos estados de asistencia
INSERT INTO estados_asistencia (nombre_estado, codigo, requiere_justificacion, afecta_asistencia, activo) VALUES
('Inasistencia', 'INASISTENCIA', true, false, true),
('Justificada', 'JUSTIFICADA', false, true, true),
('Falta Médica', 'FALTA_MEDICA', false, true, true),
('Permiso Especial', 'PERMISO_ESPECIAL', false, true, true)
ON CONFLICT (nombre_estado) DO NOTHING;

-- Insertar tipos de justificación
INSERT INTO tipos_justificacion (nombre, codigo, requiere_documento, dias_maximos, activo) VALUES
('Justificación Médica', 'MEDICA', true, 3, true),
('Asunto Familiar', 'FAMILIAR', false, 1, true),
('Asunto Personal', 'PERSONAL', false, 1, true),
('Actividad Académica', 'ACADEMICA', true, 5, true),
('Emergencia', 'EMERGENCIA', false, 7, true),
('Otro', 'OTRO', false, 2, true)
ON CONFLICT (nombre) DO NOTHING;

-- Insertar estados de justificación
INSERT INTO estados_justificacion (nombre, codigo, es_final, activo) VALUES
('Pendiente de Revisión', 'PENDIENTE', false, true),
('Aprobada', 'APROBADA', true, true),
('Rechazada', 'RECHAZADA', true, true),
('Requiere Documentación', 'REQUIERE_DOC', false, true),
('Vencida', 'VENCIDA', true, true),
('En Revisión', 'EN_REVISION', false, true)
ON CONFLICT (nombre) DO NOTHING;

-- Crear índices adicionales para performance
CREATE INDEX IF NOT EXISTS idx_justificaciones_fecha_presentacion ON justificaciones(fecha_presentacion);
CREATE INDEX IF NOT EXISTS idx_justificaciones_tipo_estado ON justificaciones(id_tipo_justificacion, id_estado_justificacion);
CREATE INDEX IF NOT EXISTS idx_documentos_justificacion ON documentos_justificacion(id_justificacion);
CREATE INDEX IF NOT EXISTS idx_asistencias_justificaciones ON asistencias_justificaciones(id_asistencia);

-- Comentarios para documentación
COMMENT ON TABLE justificaciones IS 'Registro de justificaciones de inasistencias presentadas por estudiantes o apoderados';
COMMENT ON TABLE tipos_justificacion IS 'Catálogo de tipos de justificación disponibles (médica, familiar, etc.)';
COMMENT ON TABLE estados_justificacion IS 'Estados del flujo de aprobación de justificaciones';
COMMENT ON TABLE documentos_justificacion IS 'Documentos de soporte adjuntos a las justificaciones';
COMMENT ON TABLE asistencias_justificaciones IS 'Relación entre asistencias y justificaciones aplicadas';

COMMENT ON COLUMN estados_asistencia.requiere_justificacion IS 'Indica si este estado requiere presentar justificación';
COMMENT ON COLUMN estados_asistencia.afecta_asistencia IS 'Indica si este estado cuenta para el cálculo del porcentaje de asistencia';
COMMENT ON COLUMN tipos_justificacion.dias_maximos IS 'Días máximos después de la inasistencia para presentar justificación';
COMMENT ON COLUMN justificaciones.fecha_inicio IS 'Fecha de inicio del período a justificar';
COMMENT ON COLUMN justificaciones.fecha_fin IS 'Fecha de fin del período a justificar (puede ser igual a fecha_inicio)';
