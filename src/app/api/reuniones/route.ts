import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { enviarEmail, enviarSMS } from '@/lib/notifications'

const prisma = new PrismaClient()

// GET - Obtener reuniones
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '').trim()
    if (!token || token === 'null' || token === 'undefined') {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const ieId = decoded.ieId || 1

    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo')
    const fecha = searchParams.get('fecha')
    const year = searchParams.get('year')

    const where: any = { idIe: ieId }
    
    if (tipo) {
      where.tipo = tipo
    }
    
    if (fecha) {
      where.fecha = new Date(fecha)
    }

    // Filtrar por año si se proporciona
    if (year) {
      const yearNum = parseInt(year)
      where.fecha = {
        gte: new Date(`${yearNum}-01-01`),
        lte: new Date(`${yearNum}-12-31`)
      }
    }

    const reuniones = await prisma.reunion.findMany({
      where,
      include: {
        ie: {
          select: {
            nombre: true
          }
        },
        grados: {
          include: {
            nivel: true
          }
        },
        secciones: true
      },
      orderBy: {
        fecha: 'desc'
      }
    })

    // Transformar fechas para el frontend
    const reunionesTransformadas = reuniones.map(reunion => ({
      ...reunion,
      fecha: reunion.fecha.toISOString().split('T')[0],
      horaInicio: reunion.horaInicio.toISOString().split('T')[1].substring(0, 5),
      horaFin: reunion.horaFin.toISOString().split('T')[1].substring(0, 5)
    }))

    return NextResponse.json({
      success: true,
      data: reunionesTransformadas
    })

  } catch (error) {
    console.error('Error fetching reuniones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear reunión
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '').trim()
    if (!token || token === 'null' || token === 'undefined') {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const ieId = decoded.ieId || 1
    const idUsuarioResponsable = decoded.userId || decoded.idUsuario

    const body = await request.json()
    const {
      titulo,
      descripcion,
      fecha,
      horaInicio,
      horaFin,
      tipo,
      gradosIds,
      seccionesIds
    } = body

    // Validar campos requeridos
    if (!titulo || !fecha || !horaInicio || !horaFin || !tipo) {
      return NextResponse.json({
        error: 'Campos requeridos: titulo, fecha, horaInicio, horaFin, tipo'
      }, { status: 400 })
    }

    // Preparar datos de la reunión
    const reunionData: any = {
      idIe: ieId,
      titulo,
      descripcion: descripcion || null,
      fecha: new Date(fecha),
      horaInicio: new Date(`1970-01-01T${horaInicio}:00`),
      horaFin: new Date(`1970-01-01T${horaFin}:00`),
      tipo
    }

    // Si se especifican grados, conectarlos
    if (gradosIds && Array.isArray(gradosIds) && gradosIds.length > 0) {
      reunionData.grados = {
        connect: gradosIds.map((id: number) => ({ idGrado: id }))
      }
    }

    // Si se especifican secciones, conectarlas
    if (seccionesIds && Array.isArray(seccionesIds) && seccionesIds.length > 0) {
      reunionData.secciones = {
        connect: seccionesIds.map((id: number) => ({ idSeccion: id }))
      }
    }

    // Crear la reunión
    const nuevaReunion = await prisma.reunion.create({
      data: reunionData,
      include: {
        ie: {
          select: {
            nombre: true
          }
        },
        grados: {
          include: {
            nivel: true
          }
        },
        secciones: true
      }
    })

    // Enviar notificaciones a padres de familia
    await enviarNotificacionesReunion(nuevaReunion, ieId)

    return NextResponse.json({
      success: true,
      message: 'Reunión programada exitosamente. Notificaciones enviadas a los padres de familia.',
      data: nuevaReunion
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating reunion:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Función para enviar notificaciones a padres de familia
async function enviarNotificacionesReunion(reunion: any, ieId: number) {
  try {
    console.log('📧 Enviando notificaciones para reunión:', reunion.titulo)

    // Obtener padres según el tipo de reunión
    let apoderados: any[] = []

    // Determinar qué padres notificar según grados y secciones
    const whereCondition: any = {
      estudiantes: {
        some: {
          estudiante: {
            idIe: ieId
          }
        }
      }
    }

    // Si hay grados específicos, filtrar por ellos
    if (reunion.grados && reunion.grados.length > 0) {
      const gradosIds = reunion.grados.map((g: any) => g.idGrado)
      whereCondition.estudiantes.some.estudiante.gradoSeccion = {
        idGrado: { in: gradosIds }
      }
    }

    // Si hay secciones específicas, agregar filtro
    if (reunion.secciones && reunion.secciones.length > 0) {
      const seccionesIds = reunion.secciones.map((s: any) => s.idSeccion)
      if (!whereCondition.estudiantes.some.estudiante.gradoSeccion) {
        whereCondition.estudiantes.some.estudiante.gradoSeccion = {}
      }
      whereCondition.estudiantes.some.estudiante.gradoSeccion.idSeccion = { in: seccionesIds }
    }

    apoderados = await prisma.apoderado.findMany({
      where: whereCondition,
      include: {
        usuario: {
          select: {
            nombre: true,
            apellido: true,
            email: true,
            telefono: true,
            idUsuario: true
          }
        }
      }
    })

    console.log(`📊 Total de padres a notificar: ${apoderados.length}`)
    
    // Debug: Verificar datos de padres
    apoderados.forEach((apoderado, index) => {
      console.log(`👤 Padre ${index + 1}:`)
      console.log(`   Nombre: ${apoderado.usuario.nombre} ${apoderado.usuario.apellido}`)
      console.log(`   Email: ${apoderado.usuario.email || '❌ Sin email'}`)
      console.log(`   Teléfono: ${apoderado.usuario.telefono || '❌ Sin teléfono'}`)
    })

    // Formatear fecha y hora
    const fechaFormateada = new Date(reunion.fecha).toLocaleDateString('es-PE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    const horaFormateada = new Date(reunion.horaInicio).toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit'
    })

    // Crear mensaje
    const mensajeSMS = `Reunión: ${reunion.titulo}. Fecha: ${fechaFormateada} a las ${horaFormateada}. ${reunion.descripcion || ''}`
    
    // Email con formato HTML profesional
    const mensajeEmail = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notificación de Reunión</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                ${reunion.titulo}
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <!-- Fecha -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="padding: 15px; background-color: #f8f9fa; border-left: 4px solid #667eea; border-radius: 4px;">
                    <p style="margin: 0; color: #666; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      📅 Fecha
                    </p>
                    <p style="margin: 5px 0 0 0; color: #333; font-size: 18px; font-weight: bold;">
                      ${fechaFormateada}
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Hora -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="padding: 15px; background-color: #f8f9fa; border-left: 4px solid #667eea; border-radius: 4px;">
                    <p style="margin: 0; color: #666; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      🕐 Hora
                    </p>
                    <p style="margin: 5px 0 0 0; color: #333; font-size: 18px; font-weight: bold;">
                      ${horaFormateada}
                    </p>
                  </td>
                </tr>
              </table>
              
              ${reunion.descripcion ? `
              <!-- Descripción -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="padding: 15px; background-color: #f8f9fa; border-left: 4px solid #667eea; border-radius: 4px;">
                    <p style="margin: 0; color: #666; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      📝 Descripción
                    </p>
                    <p style="margin: 10px 0 0 0; color: #555; font-size: 16px; line-height: 1.6;">
                      ${reunion.descripcion}
                    </p>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <!-- Mensaje importante -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                <tr>
                  <td style="padding: 20px; background-color: #fff3cd; border-radius: 4px; border-left: 4px solid #ffc107;">
                    <p style="margin: 0; color: #856404; font-size: 15px; line-height: 1.5;">
                      ⚠️ <strong>Su asistencia es importante.</strong>
                    </p>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #6c757d; font-size: 13px;">
                Sistema de Gestión Escolar
              </p>
              <p style="margin: 5px 0 0 0; color: #adb5bd; font-size: 12px;">
                Este es un mensaje automático, por favor no responder.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `

    // Enviar notificaciones
    let notificacionesCreadas = 0
    let smsEnviados = 0
    let emailsEnviados = 0

    for (const apoderado of apoderados) {
      try {
        // 1. Crear notificación en la base de datos (SISTEMA)
        await prisma.notificacion.create({
          data: {
            idUsuario: apoderado.usuario.idUsuario,
            titulo: `Reunión: ${reunion.titulo}`,
            mensaje: `Fecha: ${fechaFormateada} a las ${horaFormateada}. ${reunion.descripcion || ''}`,
            tipo: 'REUNION',
            leida: false
          }
        })
        notificacionesCreadas++
        console.log(`✅ Notificación en sistema creada para usuario ${apoderado.usuario.idUsuario}`)

        // 2. Enviar SMS (usando Twilio)
        if (apoderado.usuario.telefono) {
          const smsEnviado = await enviarSMS(
            apoderado.usuario.telefono,
            mensajeSMS
          )
          if (smsEnviado) {
            smsEnviados++
            console.log(`✅ SMS enviado a ${apoderado.usuario.telefono}`)
          } else {
            console.log(`⚠️ No se pudo enviar SMS a ${apoderado.usuario.telefono}`)
          }
        }

        // 3. Enviar Email (usando Gmail o cuenta de prueba)
        if (apoderado.usuario.email) {
          console.log(`📧 Intentando enviar email a: ${apoderado.usuario.email}`)
          const emailEnviado = await enviarEmail(
            apoderado.usuario.email,
            `Reunión: ${reunion.titulo}`,
            mensajeEmail
          )
          if (emailEnviado) {
            emailsEnviados++
            console.log(`✅ Email enviado exitosamente a ${apoderado.usuario.email}`)
          } else {
            console.log(`⚠️ No se pudo enviar email a ${apoderado.usuario.email}`)
          }
        } else {
          console.log(`⚠️ Padre ${apoderado.usuario.nombre} no tiene email registrado`)
        }
      } catch (error) {
        console.error(`❌ Error notificando a usuario ${apoderado.usuario.idUsuario}:`, error)
      }
    }

    console.log(`✅ Resumen de notificaciones:`)
    console.log(`   📱 ${notificacionesCreadas} notificaciones en sistema`)
    console.log(`   📱 ${smsEnviados} SMS enviados`)
    console.log(`   📧 ${emailsEnviados} emails enviados`)
    console.log(`   👥 Total de padres notificados: ${apoderados.length}`)
  } catch (error) {
    console.error('❌ Error enviando notificaciones:', error)
    // No lanzar error para no bloquear la creación de la reunión
  }
}
