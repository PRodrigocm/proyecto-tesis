import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// POST - Enviar notificaciones de evento a padres de familia
export async function POST(request: NextRequest) {
  try {
    console.log('📧 POST /api/notificaciones/evento - Enviando notificaciones')
    
    // Verificar token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded: any

    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const ieId = decoded.ieId || 1
    const body = await request.json()
    
    console.log('📋 Datos recibidos:', body)
    
    const { 
      eventoId, 
      titulo, 
      mensaje, 
      alcance, 
      idGradoSeccion, 
      nivel, 
      gradoInicio, 
      gradoFin 
    } = body

    // Obtener los apoderados según el alcance
    let apoderadosData: Array<{ idApoderado: number; usuario: { idUsuario: number } | null }> = []

    if (alcance === 'INDIVIDUAL' && idGradoSeccion) {
      // Notificar solo a los apoderados de un grado/sección específico
      const estudiantes = await prisma.estudiante.findMany({
        where: {
          idGradoSeccion: idGradoSeccion
        },
        include: {
          apoderados: {
            include: {
              apoderado: {
                include: {
                  usuario: true
                }
              }
            }
          }
        }
      })

      apoderadosData = estudiantes.flatMap(e => 
        e.apoderados.map((a: any) => a.apoderado)
      ).filter((a: any, index: number, self: any[]) => 
        index === self.findIndex((t: any) => t.idApoderado === a.idApoderado)
      )
    } else if (alcance === 'RANGO' && nivel && gradoInicio && gradoFin) {
      // Notificar a un rango de grados
      const gradosSecciones = await prisma.gradoSeccion.findMany({
        where: {
          grado: {
            nivel: {
              nombre: nivel
            },
            nombre: {
              gte: gradoInicio,
              lte: gradoFin
            }
          }
        },
        select: { idGradoSeccion: true }
      })

      const idsGradoSeccion = gradosSecciones.map(gs => gs.idGradoSeccion)

      const estudiantes = await prisma.estudiante.findMany({
        where: {
          idGradoSeccion: { in: idsGradoSeccion }
        },
        include: {
          apoderados: {
            include: {
              apoderado: {
                include: {
                  usuario: true
                }
              }
            }
          }
        }
      })

      apoderadosData = estudiantes.flatMap(e => 
        e.apoderados.map((a: any) => a.apoderado)
      ).filter((a: any, index: number, self: any[]) => 
        index === self.findIndex((t: any) => t.idApoderado === a.idApoderado)
      )
    } else {
      // Notificar a todos los apoderados de la IE
      const estudiantes = await prisma.estudiante.findMany({
        where: {
          gradoSeccion: {
            grado: {
              nivel: {
                idIe: ieId
              }
            }
          }
        },
        include: {
          apoderados: {
            include: {
              apoderado: {
                include: {
                  usuario: true
                }
              }
            }
          }
        }
      })

      apoderadosData = estudiantes.flatMap(e => 
        e.apoderados.map((a: any) => a.apoderado)
      ).filter((a: any, index: number, self: any[]) => 
        index === self.findIndex((t: any) => t.idApoderado === a.idApoderado)
      )
    }

    console.log(`📊 Apoderados encontrados: ${apoderadosData.length}`)

    // Crear notificaciones para cada apoderado
    const notificaciones = []
    for (const apoderado of apoderadosData) {
      if (apoderado.usuario?.idUsuario) {
        try {
          const notif = await prisma.notificacion.create({
            data: {
              idUsuario: apoderado.usuario.idUsuario,
              titulo: `📅 ${titulo}`,
              mensaje: mensaje,
              tipo: 'EVENTO',
              leida: false,
              origen: 'CALENDARIO'
            }
          })
          notificaciones.push(notif)
        } catch (err) {
          console.error(`Error creando notificación para apoderado ${apoderado.idApoderado}:`, err)
        }
      }
    }

    console.log(`✅ Notificaciones creadas: ${notificaciones.length}`)

    return NextResponse.json({
      success: true,
      message: `Se enviaron ${notificaciones.length} notificaciones`,
      data: {
        totalApoderados: apoderadosData.length,
        notificacionesEnviadas: notificaciones.length
      }
    })

  } catch (error) {
    console.error('❌ Error enviando notificaciones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
