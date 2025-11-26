import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

interface JWTPayload {
  userId: number
  email: string
  rol: string
  ieId?: number
}

function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as JWTPayload
    return decoded
  } catch (error) {
    console.error('Error verifying token:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const ieId = user.ieId || 1

    console.log('🔧 === CORRIGIENDO HORARIOS CON HORAS INCORRECTAS ===')

    // Obtener todos los horarios de la IE
    const horarios = await prisma.horarioClase.findMany({
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
        gradoSeccion: {
          include: {
            grado: true,
            seccion: true
          }
        }
      }
    })

    console.log(`📊 Encontrados ${horarios.length} horarios para revisar`)

    const horariosCorregidos = []

    for (const horario of horarios) {
      const horaInicioISO = horario.horaInicio.toISOString()
      const horaFinISO = horario.horaFin.toISOString()
      
      console.log(`🔍 Revisando horario ${horario.idHorarioClase}:`, {
        grado: `${horario.gradoSeccion.grado.nombre}° ${horario.gradoSeccion.seccion.nombre}`,
        horaInicioISO,
        horaFinISO
      })

      // Si las horas están mal (no son 07:45 y 13:45), corregirlas
      const horaInicioCorrecta = new Date('1970-01-01T07:45:00.000Z')
      const horaFinCorrecta = new Date('1970-01-01T13:45:00.000Z')

      if (horaInicioISO !== horaInicioCorrecta.toISOString() || 
          horaFinISO !== horaFinCorrecta.toISOString()) {
        
        console.log(`🔧 Corrigiendo horario ${horario.idHorarioClase}`)
        
        const horarioActualizado = await prisma.horarioClase.update({
          where: { idHorarioClase: horario.idHorarioClase },
          data: {
            horaInicio: horaInicioCorrecta,
            horaFin: horaFinCorrecta
          }
        })

        horariosCorregidos.push({
          id: horario.idHorarioClase,
          gradoSeccion: `${horario.gradoSeccion.grado.nombre}° ${horario.gradoSeccion.seccion.nombre}`,
          antes: {
            horaInicio: horaInicioISO,
            horaFin: horaFinISO
          },
          despues: {
            horaInicio: horarioActualizado.horaInicio.toISOString(),
            horaFin: horarioActualizado.horaFin.toISOString()
          }
        })
      }
    }

    console.log(`✅ Corrección completada. ${horariosCorregidos.length} horarios corregidos`)

    return NextResponse.json({
      success: true,
      message: `Se corrigieron ${horariosCorregidos.length} horarios`,
      horariosCorregidos,
      totalRevisados: horarios.length
    })

  } catch (error) {
    console.error('Error fixing horarios:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
