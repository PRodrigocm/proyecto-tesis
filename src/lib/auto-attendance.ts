import { prisma } from '@/lib/prisma'
import { enviarEmail } from '@/lib/notifications'

/**
 * Proceso automático para marcar faltas a estudiantes sin asistencia
 * Se ejecuta automáticamente después del horario de cierre de ingreso
 */
export async function procesarFaltasAutomaticas(ieId?: number) {
  console.log('🔄 Iniciando proceso automático de faltas...')
  
  const ahora = new Date()
  const fechaHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
  const horaActual = ahora.toTimeString().slice(0, 5)

  // Verificar día de la semana
  const diaSemana = ahora.getDay()
  const diasMap: Record<number, string> = {
    0: 'DOMINGO', 1: 'LUNES', 2: 'MARTES', 3: 'MIERCOLES',
    4: 'JUEVES', 5: 'VIERNES', 6: 'SABADO'
  }
  const diaActual = diasMap[diaSemana]

  // Obtener todas las IEs o una específica
  const ies = ieId 
    ? [{ idIe: ieId }]
    : await prisma.ie.findMany({ select: { idIe: true } })

  let totalFaltasMarcadas = 0
  let totalNotificaciones = 0

  for (const ie of ies) {
    // Obtener configuración de la IE
    const configuracion = await prisma.configuracionIE.findUnique({
      where: { idIe: ie.idIe }
    })

    const config = configuracion || {
      horaFinIngreso: '08:00',
      diasLaborables: ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES']
    }

    // Verificar si es día laborable
    if (!config.diasLaborables?.includes(diaActual)) {
      console.log(`📅 ${diaActual} no es día laborable para IE ${ie.idIe}`)
      continue
    }

    // Verificar si ya pasó la hora de cierre de ingreso
    const horaFinIngreso = config.horaFinIngreso || '08:00'
    if (horaActual <= horaFinIngreso) {
      console.log(`⏰ Aún no es hora de marcar faltas (actual: ${horaActual}, cierre: ${horaFinIngreso})`)
      continue
    }

    // Obtener estudiantes activos sin asistencia del día
    const estudiantes = await prisma.estudiante.findMany({
      where: {
        usuario: {
          idIe: ie.idIe,
          estado: 'ACTIVO'
        }
      },
      include: {
        usuario: true,
        gradoSeccion: {
          include: {
            grado: true,
            seccion: true
          }
        }
      }
    })

    for (const estudiante of estudiantes) {
      // Verificar si ya tiene asistencia del día
      const asistenciaExistente = await prisma.asistenciaIE.findFirst({
        where: {
          idEstudiante: estudiante.idEstudiante,
          fecha: {
            gte: fechaHoy,
            lt: new Date(fechaHoy.getTime() + 24 * 60 * 60 * 1000)
          }
        }
      })

      if (asistenciaExistente) {
        // Ya tiene registro, no marcar falta
        continue
      }

      // Crear registro de INASISTENCIA automática
      await prisma.asistenciaIE.create({
        data: {
          idEstudiante: estudiante.idEstudiante,
          idIe: ie.idIe,
          fecha: fechaHoy,
          estado: 'INASISTENCIA'
        }
      })

      totalFaltasMarcadas++
      console.log(`❌ Falta automática: ${estudiante.usuario.nombre} ${estudiante.usuario.apellido}`)

      // Buscar apoderado para notificar
      const apoderado = await prisma.apoderado.findFirst({
        where: {
          estudiantes: {
            some: { idEstudiante: estudiante.idEstudiante }
          }
        },
        include: { usuario: true }
      })

      if (apoderado) {
        // Crear notificación en el sistema
        try {
          await prisma.notificacion.create({
            data: {
              idUsuario: apoderado.usuario.idUsuario,
              titulo: '❌ Inasistencia Registrada',
              mensaje: `Su hijo/a ${estudiante.usuario.nombre} ${estudiante.usuario.apellido} no asistió a clases hoy ${fechaHoy.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}. Si tiene justificación, por favor comuníquese con la institución.`,
              tipo: 'ALERTA',
              leida: false
            }
          })
        } catch (notifError) {
          console.error('Error creando notificación en sistema:', notifError)
        }

        // Enviar email si tiene correo
        if (apoderado.usuario.email) {
          try {
            const emailEnviado = await enviarEmailInasistencia({
              estudianteNombre: estudiante.usuario.nombre || '',
              estudianteApellido: estudiante.usuario.apellido || '',
              estudianteDNI: estudiante.usuario.dni,
              grado: estudiante.gradoSeccion?.grado?.nombre || '',
              seccion: estudiante.gradoSeccion?.seccion?.nombre || '',
              fecha: fechaHoy.toISOString(),
              emailApoderado: apoderado.usuario.email,
              nombreApoderado: `${apoderado.usuario.nombre} ${apoderado.usuario.apellido}`
            })
            if (emailEnviado) {
              totalNotificaciones++
              console.log(`📧 Email enviado a ${apoderado.usuario.email}`)
            } else {
              console.warn(`⚠️ No se pudo enviar email a ${apoderado.usuario.email}`)
            }
          } catch (error) {
            console.error(`Error enviando email a ${apoderado.usuario.email}:`, error)
          }
        } else {
          console.log(`⚠️ Apoderado sin email para ${estudiante.usuario.nombre}`)
        }
      } else {
        console.log(`⚠️ No se encontró apoderado para ${estudiante.usuario.nombre}`)
      }
    }
  }

  console.log(`✅ Proceso completado: ${totalFaltasMarcadas} faltas, ${totalNotificaciones} emails`)
  
  return {
    faltasMarcadas: totalFaltasMarcadas,
    notificacionesEnviadas: totalNotificaciones,
    fecha: fechaHoy.toISOString().split('T')[0]
  }
}

/**
 * Enviar email de inasistencia al apoderado
 */
async function enviarEmailInasistencia(data: {
  estudianteNombre: string
  estudianteApellido: string
  estudianteDNI: string
  grado: string
  seccion: string
  fecha: string
  emailApoderado: string
  nombreApoderado: string
}): Promise<boolean> {
  // Parsear la fecha correctamente para evitar problemas de zona horaria
  // Si la fecha viene como "2025-12-10", crear la fecha en hora local
  const fechaParts = data.fecha.split('-')
  const fechaLocal = new Date(parseInt(fechaParts[0]), parseInt(fechaParts[1]) - 1, parseInt(fechaParts[2]))
  
  const fechaFormateada = fechaLocal.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const asunto = `❌ INASISTENCIA - ${data.estudianteNombre} ${data.estudianteApellido}`

  const contenido = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .alert-box { background: #fee2e2; border: 2px solid #ef4444; padding: 20px; margin: 15px 0; border-radius: 8px; text-align: center; }
        .info-box { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #ef4444; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❌ Alerta de Inasistencia</h1>
          <p>Sistema de Control de Asistencia</p>
        </div>
        
        <div class="content">
          <h2>Estimado/a ${data.nombreApoderado},</h2>
          
          <div class="alert-box">
            <h2 style="color: #ef4444; margin: 0;">INASISTENCIA REGISTRADA</h2>
            <p style="margin: 10px 0 0 0;">Su hijo/a no asistió a clases hoy</p>
          </div>

          <div class="info-box">
            <p><strong>Estudiante:</strong> ${data.estudianteNombre} ${data.estudianteApellido}</p>
            <p><strong>DNI:</strong> ${data.estudianteDNI}</p>
            <p><strong>Grado:</strong> ${data.grado}° ${data.seccion}</p>
            <p><strong>Fecha:</strong> ${fechaFormateada}</p>
          </div>

          <p style="background: #fef3c7; padding: 15px; border-radius: 8px;">
            <strong>📝 ¿Tiene justificación?</strong><br>
            Si la inasistencia fue por motivos justificados, comuníquese con la institución para presentar la documentación correspondiente.
          </p>
        </div>

        <div class="footer">
          <p>Este es un mensaje automático del Sistema de Control Escolar.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return await enviarEmail(data.emailApoderado, asunto, contenido)
}

/**
 * Verificar si se debe ejecutar el proceso de faltas
 * Retorna true si ya pasó la hora de cierre y hay estudiantes sin asistencia
 */
export async function debeEjecutarProcesoFaltas(ieId: number): Promise<boolean> {
  const ahora = new Date()
  const horaActual = ahora.toTimeString().slice(0, 5)

  // Obtener configuración
  const config = await prisma.configuracionIE.findUnique({
    where: { idIe: ieId }
  })

  const horaFinIngreso = config?.horaFinIngreso || '08:00'
  
  // Solo ejecutar si ya pasó la hora de cierre
  if (horaActual <= horaFinIngreso) {
    return false
  }

  // Verificar si es día laborable
  const diaSemana = ahora.getDay()
  const diasMap: Record<number, string> = {
    0: 'DOMINGO', 1: 'LUNES', 2: 'MARTES', 3: 'MIERCOLES',
    4: 'JUEVES', 5: 'VIERNES', 6: 'SABADO'
  }
  const diaActual = diasMap[diaSemana]
  
  if (!config?.diasLaborables?.includes(diaActual)) {
    return false
  }

  return true
}
