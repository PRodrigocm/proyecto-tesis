import { PrismaClient } from '@prisma/client'
import { 
  crearNotificacion, 
  notificacionesRetiro, 
  notificacionesAsistencia,
  notificacionesJustificacion 
} from '../src/lib/notificaciones-utils'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔔 Inicializando notificaciones de prueba...')

    // Obtener algunos usuarios para crear notificaciones de prueba
    const usuarios = await prisma.usuario.findMany({
      take: 5,
      include: {
        roles: {
          include: {
            rol: true
          }
        }
      }
    })

    if (usuarios.length === 0) {
      console.log('❌ No se encontraron usuarios en la base de datos')
      return
    }

    console.log(`📋 Encontrados ${usuarios.length} usuarios`)

    let notificacionesCreadas = 0

    // Crear notificaciones de bienvenida para cada usuario
    for (const usuario of usuarios) {
      const rolPrincipal = usuario.roles[0]?.rol?.nombre || 'Usuario'
      
      await crearNotificacion({
        idUsuario: usuario.idUsuario,
        titulo: '¡Bienvenido al Sistema!',
        mensaje: `Hola ${usuario.nombre || 'Usuario'}, bienvenido al sistema de gestión escolar. Tu rol principal es: ${rolPrincipal}.`,
        tipo: 'INFO',
        origen: 'Sistema de Inicialización'
      })
      notificacionesCreadas++

      // Crear notificación informativa sobre funcionalidades
      await crearNotificacion({
        idUsuario: usuario.idUsuario,
        titulo: 'Funcionalidades Disponibles',
        mensaje: 'Ya puedes acceder a todas las funcionalidades del sistema: gestión de asistencias, retiros, justificaciones y más.',
        tipo: 'INFO',
        origen: 'Sistema de Inicialización'
      })
      notificacionesCreadas++
    }

    // Crear algunas notificaciones específicas si hay usuarios con roles específicos
    const apoderados = usuarios.filter(u => 
      u.roles.some(r => r.rol.nombre.toLowerCase().includes('apoderado'))
    )

    const docentes = usuarios.filter(u => 
      u.roles.some(r => r.rol.nombre.toLowerCase().includes('docente'))
    )

    // Notificaciones para apoderados
    for (const apoderado of apoderados.slice(0, 2)) {
      await notificacionesRetiro.solicitudCreada(
        apoderado.idUsuario,
        'Juan Pérez',
        '2024-10-15'
      )
      notificacionesCreadas++

      await notificacionesAsistencia.tardanzaRegistrada(
        apoderado.idUsuario,
        'Juan Pérez',
        '2024-10-14',
        '08:15'
      )
      notificacionesCreadas++
    }

    // Notificaciones para docentes
    for (const docente of docentes.slice(0, 2)) {
      await crearNotificacion({
        idUsuario: docente.idUsuario,
        titulo: 'Recordatorio: Registro de Asistencias',
        mensaje: 'Recuerda registrar las asistencias de tus estudiantes antes de las 10:00 AM.',
        tipo: 'RECORDATORIO',
        origen: 'Sistema Académico'
      })
      notificacionesCreadas++

      await crearNotificacion({
        idUsuario: docente.idUsuario,
        titulo: 'Nueva Justificación Pendiente',
        mensaje: 'Tienes una nueva justificación pendiente de revisión en tu bandeja.',
        tipo: 'JUSTIFICACION',
        origen: 'Módulo de Justificaciones'
      })
      notificacionesCreadas++
    }

    // Crear algunas notificaciones de alerta
    const usuariosParaAlertas = usuarios.slice(0, 3)
    for (const usuario of usuariosParaAlertas) {
      await crearNotificacion({
        idUsuario: usuario.idUsuario,
        titulo: 'Mantenimiento Programado',
        mensaje: 'El sistema tendrá mantenimiento programado el próximo sábado de 2:00 AM a 6:00 AM. Durante este tiempo el sistema no estará disponible.',
        tipo: 'ALERTA',
        origen: 'Administración del Sistema'
      })
      notificacionesCreadas++
    }

    console.log(`✅ Se crearon ${notificacionesCreadas} notificaciones de prueba`)

    // Mostrar estadísticas
    const totalNotificaciones = await prisma.notificacion.count()
    const notificacionesNoLeidas = await prisma.notificacion.count({
      where: { leida: false }
    })

    console.log(`📊 Estadísticas:`)
    console.log(`   - Total de notificaciones: ${totalNotificaciones}`)
    console.log(`   - Notificaciones no leídas: ${notificacionesNoLeidas}`)
    console.log(`   - Usuarios con notificaciones: ${usuarios.length}`)

    // Mostrar algunas notificaciones por tipo
    const tiposNotificaciones = await prisma.notificacion.groupBy({
      by: ['tipo'],
      _count: {
        tipo: true
      }
    })

    console.log(`📋 Notificaciones por tipo:`)
    tiposNotificaciones.forEach(tipo => {
      console.log(`   - ${tipo.tipo}: ${tipo._count.tipo}`)
    })

  } catch (error) {
    console.error('❌ Error al inicializar notificaciones:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .then(() => {
    console.log('🎉 Inicialización de notificaciones completada')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })
