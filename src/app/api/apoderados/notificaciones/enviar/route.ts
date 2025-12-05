import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación (puede ser llamada por el sistema)
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    const body = await request.json()
    const { 
      estudianteId, 
      tipoEvento, // 'ENTRADA_IE', 'SALIDA_IE', 'ASISTENCIA_AULA', 'ASISTENCIA_TALLER'
      mensaje,
      datos // información adicional del evento
    } = body

    if (!estudianteId || !tipoEvento || !mensaje) {
      return NextResponse.json(
        { error: 'Parámetros requeridos: estudianteId, tipoEvento, mensaje' },
        { status: 400 }
      )
    }

    // Obtener apoderados del estudiante
    const apoderados = await prisma.estudianteApoderado.findMany({
      where: {
        idEstudiante: parseInt(estudianteId)
      },
      include: {
        apoderado: {
          include: {
            usuario: true
          }
        },
        estudiante: {
          include: {
            usuario: true,
            gradoSeccion: {
              include: {
                grado: true,
                seccion: true
              }
            }
          }
        }
      }
    })

    if (apoderados.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron apoderados para este estudiante' },
        { status: 404 }
      )
    }

    const notificacionesEnviadas: any[] = []

    for (const apoderadoRel of apoderados) {
      // TODO: Obtener configuración real de notificaciones del apoderado
      // Por ahora simulamos que todas las notificaciones están habilitadas
      const configuracion = {
        entradaIE: { email: true, telefono: true },
        salidaIE: { email: true, telefono: true },
        asistenciaAulas: { email: true, telefono: false },
        asistenciaTalleres: { email: true, telefono: false }
      }

      let debeNotificar = false
      let configTipo: { email: boolean; telefono: boolean } | null = null

      switch (tipoEvento) {
        case 'ENTRADA_IE':
          configTipo = configuracion.entradaIE
          debeNotificar = true
          break
        case 'SALIDA_IE':
          configTipo = configuracion.salidaIE
          debeNotificar = true
          break
        case 'ASISTENCIA_AULA':
          configTipo = configuracion.asistenciaAulas
          debeNotificar = true
          break
        case 'ASISTENCIA_TALLER':
          configTipo = configuracion.asistenciaTalleres
          debeNotificar = true
          break
      }

      if (debeNotificar && configTipo) {
        const estudiante = apoderadoRel.estudiante
        const apoderado = apoderadoRel.apoderado

        // Personalizar mensaje
        const mensajePersonalizado = mensaje.replace(
          '{estudiante}',
          `${estudiante.usuario.nombre} ${estudiante.usuario.apellido}`
        ).replace(
          '{grado}',
          `${estudiante.gradoSeccion?.grado.nombre || ''}° ${estudiante.gradoSeccion?.seccion.nombre || ''}`
        )

        // Enviar notificación por email si está habilitado
        if (configTipo.email) {
          // TODO: Implementar envío real de email
          console.log('📧 Enviando email a:', apoderado.usuario.email)
          console.log('Mensaje:', mensajePersonalizado)
          
          notificacionesEnviadas.push({
            tipo: 'EMAIL',
            destinatario: apoderado.usuario.email,
            mensaje: mensajePersonalizado,
            enviado: true
          })
        }

        // Enviar notificación por SMS si está habilitado
        if (configTipo.telefono && apoderado.usuario.telefono) {
          // TODO: Implementar envío real de SMS
          console.log('📱 Enviando SMS a:', apoderado.usuario.telefono)
          console.log('Mensaje:', mensajePersonalizado)
          
          notificacionesEnviadas.push({
            tipo: 'SMS',
            destinatario: apoderado.usuario.telefono,
            mensaje: mensajePersonalizado,
            enviado: true
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Notificaciones procesadas',
      notificacionesEnviadas,
      total: notificacionesEnviadas.length
    })

  } catch (error) {
    console.error('Error sending notifications:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
