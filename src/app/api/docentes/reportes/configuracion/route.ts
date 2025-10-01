import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// GET /api/docentes/reportes/configuracion - Obtener configuración de reportes automáticos
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded: any

    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Verificar que sea docente o administrador
    if (!['DOCENTE', 'ADMINISTRATIVO'].includes(decoded.rol)) {
      return NextResponse.json({ error: 'No tienes permisos para acceder a la configuración' }, { status: 403 })
    }

    // Buscar configuración existente (simulada para desarrollo)
    // En producción, esto estaría en una tabla de configuraciones
    const configuracionDefault = {
      exportacionAutomatica: {
        habilitada: false,
        frecuencia: 'mensual', // semanal, mensual
        formato: 'pdf', // pdf, excel, word
        diaDelMes: 1, // Para reportes mensuales
        diaDeLaSemana: 1, // Para reportes semanales (1=Lunes)
        hora: '08:00',
        incluirResumen: true,
        incluirDetalle: true,
        incluirGraficos: false,
        email: decoded.email || '',
        notificarPorEmail: true
      },
      formatosDisponibles: [
        { value: 'pdf', label: 'PDF', descripcion: 'Documento portable con formato APA' },
        { value: 'excel', label: 'Excel', descripcion: 'Hoja de cálculo para análisis' },
        { value: 'word', label: 'Word', descripcion: 'Documento de texto editable' }
      ],
      frecuenciasDisponibles: [
        { value: 'semanal', label: 'Semanal', descripcion: 'Cada semana' },
        { value: 'mensual', label: 'Mensual', descripcion: 'Cada mes' }
      ]
    }

    return NextResponse.json({
      success: true,
      data: configuracionDefault
    })

  } catch (error) {
    console.error('❌ Error al obtener configuración:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

// POST /api/docentes/reportes/configuracion - Guardar configuración de reportes automáticos
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded: any

    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Verificar que sea docente o administrador
    if (!['DOCENTE', 'ADMINISTRATIVO'].includes(decoded.rol)) {
      return NextResponse.json({ error: 'No tienes permisos para modificar la configuración' }, { status: 403 })
    }

    // Debug: Mostrar información del token
    console.log('🔍 Token decoded en POST configuración:', {
      idUsuario: decoded.idUsuario,
      id: decoded.id,
      nombre: decoded.nombre,
      apellido: decoded.apellido,
      rol: decoded.rol,
      email: decoded.email
    })

    const body = await request.json()
    const { exportacionAutomatica } = body

    // Validar datos
    if (!exportacionAutomatica) {
      return NextResponse.json({ 
        error: 'Configuración de exportación automática requerida' 
      }, { status: 400 })
    }

    const formatosValidos = ['pdf', 'excel', 'word']
    const frecuenciasValidas = ['semanal', 'mensual']

    if (!formatosValidos.includes(exportacionAutomatica.formato)) {
      return NextResponse.json({ 
        error: 'Formato no válido' 
      }, { status: 400 })
    }

    if (!frecuenciasValidas.includes(exportacionAutomatica.frecuencia)) {
      return NextResponse.json({ 
        error: 'Frecuencia no válida' 
      }, { status: 400 })
    }

    // Validar hora
    const horaRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!horaRegex.test(exportacionAutomatica.hora)) {
      return NextResponse.json({ 
        error: 'Formato de hora no válido (HH:MM)' 
      }, { status: 400 })
    }

    // Validar email si está habilitada la notificación
    if (exportacionAutomatica.notificarPorEmail && !exportacionAutomatica.email) {
      return NextResponse.json({ 
        error: 'Email requerido para notificaciones' 
      }, { status: 400 })
    }

    console.log('💾 Guardando configuración de reportes automáticos:', {
      usuarioId: decoded.idUsuario || decoded.id || 'NO_ID',
      usuarioNombre: `${decoded.nombre || 'SIN_NOMBRE'} ${decoded.apellido || 'SIN_APELLIDO'}`.trim(),
      usuarioRol: decoded.rol || 'SIN_ROL',
      usuarioEmail: decoded.email || 'SIN_EMAIL',
      habilitada: exportacionAutomatica.habilitada,
      formato: exportacionAutomatica.formato,
      frecuencia: exportacionAutomatica.frecuencia,
      tokenCompleto: Object.keys(decoded)
    })

    // Por ahora simulamos el guardado exitoso

    return NextResponse.json({
      success: true,
      message: 'Configuración guardada exitosamente',
      data: {
        exportacionAutomatica: {
          ...exportacionAutomatica,
          fechaActualizacion: new Date().toISOString(),
          actualizadoPor: decoded.idUsuario || decoded.id || decoded.userId || 'USUARIO_DESCONOCIDO',
          actualizadoPorNombre: `${decoded.nombre || decoded.name || 'Usuario'} ${decoded.apellido || decoded.lastName || ''}`.trim(),
          usuarioRol: decoded.rol || decoded.role || 'ROL_DESCONOCIDO',
          usuarioEmail: decoded.email || 'email@desconocido.com'
        }
      }
    })

  } catch (error) {
    console.error('❌ Error al guardar configuración:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

// PUT /api/docentes/reportes/configuracion - Actualizar configuración existente
export async function PUT(request: NextRequest) {
  return POST(request) // Reutilizar la lógica del POST
}

// DELETE /api/docentes/reportes/configuracion - Deshabilitar exportación automática
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded: any

    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Verificar que sea docente o administrador
    if (!['DOCENTE', 'ADMINISTRATIVO'].includes(decoded.rol)) {
      return NextResponse.json({ error: 'No tienes permisos para modificar la configuración' }, { status: 403 })
    }

    console.log('🗑️ Deshabilitando exportación automática para usuario:', {
      usuarioId: decoded.idUsuario || decoded.id || 'NO_ID',
      usuarioNombre: `${decoded.nombre || 'SIN_NOMBRE'} ${decoded.apellido || 'SIN_APELLIDO'}`.trim(),
      usuarioRol: decoded.rol || 'SIN_ROL',
      tokenKeys: Object.keys(decoded)
    })

    // En producción, aquí se actualizaría la base de datos
    // Por ahora simulamos la deshabilitación exitosa

    return NextResponse.json({
      success: true,
      message: 'Exportación automática deshabilitada exitosamente'
    })

  } catch (error) {
    console.error('❌ Error al deshabilitar configuración:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
