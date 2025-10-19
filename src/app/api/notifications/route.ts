import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    console.log('🔔 GET /api/notifications - Obteniendo notificaciones')
    
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded: any

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') || decoded.rol
    const userIdParam = searchParams.get('userId') || decoded.userId
    const userId = parseInt(userIdParam) // Convertir a número entero

    // Validar que userId sea un número válido
    if (isNaN(userId)) {
      console.error('❌ userId inválido:', userIdParam)
      return NextResponse.json({ error: 'ID de usuario inválido' }, { status: 400 })
    }

    console.log('👤 Usuario:', userId, 'Rol:', role, 'Tipo:', typeof userId)

    // Generar notificaciones basadas en el rol
    const notifications = await generateNotificationsByRole(role, userId)

    console.log('🔔 Notificaciones generadas:', notifications.length)

    return NextResponse.json({
      success: true,
      notifications
    })

  } catch (error) {
    console.error('❌ Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

async function generateNotificationsByRole(role: string, userId: number) {
  const notifications: any[] = []
  const now = new Date()

  try {
    switch (role) {
      case 'ADMINISTRATIVO':
        // Notificaciones para administradores
        
        // 1. Retiros pendientes de autorización
        const retirosPendientes = await prisma.retiro.count({
          where: {
            estadoRetiro: {
              codigo: 'PENDIENTE'
            },
            fecha: {
              gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
            }
          }
        })

        if (retirosPendientes > 0) {
          notifications.push({
            id: 'retiros-pendientes',
            title: 'Retiros pendientes',
            message: `Hay ${retirosPendientes} retiro${retirosPendientes > 1 ? 's' : ''} pendiente${retirosPendientes > 1 ? 's' : ''} de autorización`,
            type: 'warning',
            isRead: false,
            createdAt: now.toISOString(),
            relatedTo: 'Gestión de retiros',
            actionUrl: '/admin/dashboard/retiros'
          })
        }

        // 2. Justificaciones pendientes
        const justificacionesPendientes = await prisma.justificacion.count({
          where: {
            // Agregar filtro por estado cuando esté disponible
            createdAt: {
              gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) // Últimas 24 horas
            }
          }
        })

        if (justificacionesPendientes > 0) {
          notifications.push({
            id: 'justificaciones-pendientes',
            title: 'Justificaciones nuevas',
            message: `${justificacionesPendientes} justificación${justificacionesPendientes > 1 ? 'es' : ''} recibida${justificacionesPendientes > 1 ? 's' : ''} en las últimas 24 horas`,
            type: 'info',
            isRead: false,
            createdAt: now.toISOString(),
            relatedTo: 'Gestión académica'
          })
        }

        // 3. Nuevos usuarios registrados por tipo
        const fechaLimite = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // Última semana
        
        // Contar estudiantes nuevos
        const nuevosEstudiantes = await prisma.estudiante.count({
          where: {
            usuario: {
              createdAt: { gte: fechaLimite }
            }
          }
        })

        // Contar apoderados nuevos
        const nuevosApoderados = await prisma.apoderado.count({
          where: {
            usuario: {
              createdAt: { gte: fechaLimite }
            }
          }
        })

        // Contar docentes nuevos
        const nuevosDocentes = await prisma.docente.count({
          where: {
            usuario: {
              createdAt: { gte: fechaLimite }
            }
          }
        })

        // Contar otros usuarios (administrativos y auxiliares)
        const otrosUsuarios = await prisma.usuario.count({
          where: {
            createdAt: { gte: fechaLimite },
            AND: [
              { estudiante: null },
              { apoderado: null },
              { docente: null }
            ]
          }
        })

        // Determinar qué tipo de usuario es más frecuente y crear notificación específica
        const tiposUsuarios = [
          { tipo: 'estudiantes', count: nuevosEstudiantes, url: '/admin/dashboard/usuarios/estudiantes', label: 'estudiante' },
          { tipo: 'apoderados', count: nuevosApoderados, url: '/admin/dashboard/usuarios/apoderados', label: 'apoderado' },
          { tipo: 'docentes', count: nuevosDocentes, url: '/admin/dashboard/usuarios/docentes', label: 'docente' },
          { tipo: 'otros', count: otrosUsuarios, url: '/admin/dashboard/usuarios', label: 'usuario' }
        ]

        const tipoMasFrecuente = tiposUsuarios.reduce((max, current) => 
          current.count > max.count ? current : max
        )

        const totalNuevos = nuevosEstudiantes + nuevosApoderados + nuevosDocentes + otrosUsuarios

        // Logging para verificar datos reales de BD
        console.log('📊 Conteo de nuevos usuarios (última semana):')
        console.log(`   Estudiantes: ${nuevosEstudiantes}`)
        console.log(`   Apoderados: ${nuevosApoderados}`)
        console.log(`   Docentes: ${nuevosDocentes}`)
        console.log(`   Otros (Admin/Auxiliar): ${otrosUsuarios}`)
        console.log(`   Total: ${totalNuevos}`)

        if (totalNuevos > 0) {
          let mensaje = ''
          let actionUrl = '/admin/dashboard/usuarios'

          if (tipoMasFrecuente.count === totalNuevos) {
            // Solo un tipo de usuario registrado
            mensaje = `${tipoMasFrecuente.count} nuevo${tipoMasFrecuente.count > 1 ? 's' : ''} ${tipoMasFrecuente.label}${tipoMasFrecuente.count > 1 ? 's' : ''} registrado${tipoMasFrecuente.count > 1 ? 's' : ''} esta semana`
            actionUrl = tipoMasFrecuente.url
          } else {
            // Múltiples tipos de usuarios - crear mensaje detallado
            const tiposConUsuarios = tiposUsuarios.filter(tipo => tipo.count > 0)
            
            if (tiposConUsuarios.length === 1) {
              // Solo un tipo pero usar mensaje genérico si es confuso
              const tipo = tiposConUsuarios[0]
              mensaje = `${tipo.count} nuevo${tipo.count > 1 ? 's' : ''} ${tipo.label}${tipo.count > 1 ? 's' : ''} registrado${tipo.count > 1 ? 's' : ''} esta semana`
              actionUrl = tipo.url
            } else if (tiposConUsuarios.length === 2) {
              // Dos tipos - mostrar ambos
              const [tipo1, tipo2] = tiposConUsuarios
              mensaje = `${tipo1.count} ${tipo1.label}${tipo1.count > 1 ? 's' : ''} y ${tipo2.count} ${tipo2.label}${tipo2.count > 1 ? 's' : ''} registrados esta semana`
              actionUrl = tipoMasFrecuente.url
            } else {
              // Tres o más tipos - mostrar resumen con el más frecuente
              mensaje = `${totalNuevos} nuevos usuarios registrados esta semana (principalmente ${tipoMasFrecuente.label}s)`
              actionUrl = tipoMasFrecuente.url
            }
          }

          console.log('📝 Mensaje de notificación generado:', mensaje)
          console.log('🔗 URL de acción:', actionUrl)

          notifications.push({
            id: 'nuevos-usuarios',
            title: 'Nuevos usuarios',
            message: mensaje,
            type: 'success',
            isRead: false,
            createdAt: now.toISOString(),
            relatedTo: 'Gestión de usuarios',
            actionUrl: actionUrl
          })
        }
        break

      case 'DOCENTE':
        // Notificaciones para docentes
        console.log('👨‍🏫 Generando notificaciones para docente con userId:', userId, 'tipo:', typeof userId)
        
        // Obtener información del docente
        const docente = await prisma.docente.findFirst({
          where: { idUsuario: userId },
          include: {
            docenteAulas: {
              include: {
                gradoSeccion: true
              }
            }
          }
        })

        console.log('👨‍🏫 Docente encontrado:', docente ? 'Sí' : 'No')
        
        if (docente) {
          const gradosSeccionesIds = docente.docenteAulas.map(da => da.idGradoSeccion)
          console.log('📚 Grados-Secciones del docente:', gradosSeccionesIds)

          // 1. Retiros de sus estudiantes
          const retirosEstudiantes = await prisma.retiro.count({
            where: {
              estudiante: {
                idGradoSeccion: {
                  in: gradosSeccionesIds
                }
              },
              fecha: {
                gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
              }
            }
          })
          console.log('🚪 Retiros de estudiantes hoy:', retirosEstudiantes)

          if (retirosEstudiantes > 0) {
            notifications.push({
              id: 'retiros-estudiantes',
              title: 'Retiros de estudiantes',
              message: `${retirosEstudiantes} estudiante${retirosEstudiantes > 1 ? 's' : ''} de tus clases ${retirosEstudiantes > 1 ? 'han' : 'ha'} solicitado retiro hoy`,
              type: 'info',
              isRead: false,
              createdAt: now.toISOString(),
              relatedTo: 'Tus estudiantes',
              actionUrl: '/docente/retiros'
            })
          }

          // 2. Asistencias pendientes
          const hoy = new Date()
          const inicioDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
          
          const clasesHoy = await prisma.horarioClase.count({
            where: {
              idDocente: docente.idDocente,
              diaSemana: hoy.getDay(),
              activo: true
            }
          })
          console.log('📅 Clases programadas hoy (día', hoy.getDay() + '):', clasesHoy)

          if (clasesHoy > 0) {
            const asistenciasHoy = await prisma.asistencia.count({
              where: {
                registradoPor: userId,
                fecha: {
                  gte: inicioDelDia
                }
              }
            })
            console.log('✅ Asistencias registradas hoy:', asistenciasHoy)

            if (asistenciasHoy === 0) {
              notifications.push({
                id: 'asistencia-pendiente',
                title: 'Asistencia pendiente',
                message: 'No has registrado asistencia hoy. Recuerda tomar asistencia en tus clases.',
                type: 'warning',
                isRead: false,
                createdAt: now.toISOString(),
                relatedTo: 'Control de asistencia',
                actionUrl: '/docente/asistencias'
              })
            }
          }

          // 3. Notificación de bienvenida/recordatorio para docentes
          notifications.push({
            id: 'docente-dashboard',
            title: 'Panel de Docente',
            message: 'Revisa tus horarios, registra asistencias y mantente al día con tus clases.',
            type: 'info',
            isRead: false,
            createdAt: now.toISOString(),
            relatedTo: 'Dashboard',
            actionUrl: '/docente/dashboard'
          })

          // 4. Recordatorio de horarios si es día de semana
          if (hoy.getDay() >= 1 && hoy.getDay() <= 5) {
            notifications.push({
              id: 'horarios-hoy',
              title: 'Horarios de hoy',
              message: 'Revisa tus horarios programados para hoy y prepárate para tus clases.',
              type: 'info',
              isRead: false,
              createdAt: now.toISOString(),
              relatedTo: 'Horarios',
              actionUrl: '/docente/horarios'
            })
          }
        } else {
          // Si no se encuentra el docente, notificación de configuración
          notifications.push({
            id: 'docente-no-encontrado',
            title: 'Perfil incompleto',
            message: 'Tu perfil de docente necesita ser configurado. Contacta al administrador.',
            type: 'warning',
            isRead: false,
            createdAt: now.toISOString(),
            relatedTo: 'Configuración',
            actionUrl: '/docente/perfil'
          })
        }
        break

      case 'AUXILIAR':
        // Notificaciones para auxiliares
        
        // 1. Retiros del día
        const retirosHoy = await prisma.retiro.count({
          where: {
            fecha: {
              gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
              lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
            }
          }
        })

        if (retirosHoy > 0) {
          notifications.push({
            id: 'retiros-hoy',
            title: 'Retiros programados',
            message: `Hay ${retirosHoy} retiro${retirosHoy > 1 ? 's' : ''} programado${retirosHoy > 1 ? 's' : ''} para hoy`,
            type: 'info',
            isRead: false,
            createdAt: now.toISOString(),
            relatedTo: 'Control de retiros',
            actionUrl: '/auxiliar/retiros'
          })
        }

        // 2. Estudiantes con inasistencias frecuentes
        const hace7Dias = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const estudiantesInasistentes = await prisma.asistencia.groupBy({
          by: ['idEstudiante'],
          where: {
            fecha: {
              gte: hace7Dias
            },
            estadoAsistencia: {
              codigo: 'AUSENTE'
            }
          },
          having: {
            idEstudiante: {
              _count: {
                gte: 3 // 3 o más ausencias en la semana
              }
            }
          }
        })

        if (estudiantesInasistentes.length > 0) {
          notifications.push({
            id: 'inasistencias-frecuentes',
            title: 'Inasistencias frecuentes',
            message: `${estudiantesInasistentes.length} estudiante${estudiantesInasistentes.length > 1 ? 's' : ''} con 3+ ausencias esta semana`,
            type: 'warning',
            isRead: false,
            createdAt: now.toISOString(),
            relatedTo: 'Control de asistencia'
          })
        }
        break

      case 'APODERADO':
        // Notificaciones para apoderados
        
        // Obtener estudiantes del apoderado
        const estudiantesApoderado = await prisma.estudianteApoderado.findMany({
          where: {
            apoderado: {
              idUsuario: userId
            }
          },
          include: {
            estudiante: {
              include: {
                usuario: true
              }
            }
          }
        })

        const estudiantesIds = estudiantesApoderado.map(ea => ea.idEstudiante)

        if (estudiantesIds.length > 0) {
          // 1. Asistencias de hoy
          const asistenciasHoy = await prisma.asistencia.findMany({
            where: {
              idEstudiante: {
                in: estudiantesIds
              },
              fecha: {
                gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
              }
            },
            include: {
              estudiante: {
                include: {
                  usuario: true
                }
              },
              estadoAsistencia: true
            }
          })

          const ausenciasHoy = asistenciasHoy.filter(a => a.estadoAsistencia?.codigo === 'AUSENTE')
          
          if (ausenciasHoy.length > 0) {
            const nombresEstudiantes = ausenciasHoy.map(a => a.estudiante.usuario.nombre).join(', ')
            notifications.push({
              id: 'ausencias-hoy',
              title: 'Ausencias registradas',
              message: `${nombresEstudiantes} ${ausenciasHoy.length > 1 ? 'han faltado' : 'ha faltado'} hoy`,
              type: 'warning',
              isRead: false,
              createdAt: now.toISOString(),
              relatedTo: 'Asistencia de tus hijos'
            })
          }

          // 2. Retiros completados
          const retirosCompletados = await prisma.retiro.findMany({
            where: {
              idEstudiante: {
                in: estudiantesIds
              },
              fecha: {
                gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
              },
              estadoRetiro: {
                codigo: 'COMPLETADO'
              }
            },
            include: {
              estudiante: {
                include: {
                  usuario: true
                }
              }
            }
          })

          if (retirosCompletados.length > 0) {
            const nombresRetirados = retirosCompletados.map(r => r.estudiante.usuario.nombre).join(', ')
            notifications.push({
              id: 'retiros-completados',
              title: 'Retiros completados',
              message: `${nombresRetirados} ${retirosCompletados.length > 1 ? 'han sido retirados' : 'ha sido retirado'} exitosamente`,
              type: 'success',
              isRead: false,
              createdAt: now.toISOString(),
              relatedTo: 'Retiros de tus hijos'
            })
          }
        }
        break

      default:
        // Notificación genérica
        notifications.push({
          id: 'welcome',
          title: 'Bienvenido',
          message: 'Sistema de notificaciones activo',
          type: 'info',
          isRead: false,
          createdAt: now.toISOString(),
          relatedTo: 'Sistema'
        })
    }

  } catch (error) {
    console.error('Error generating notifications:', error)
  }

  return notifications
}
