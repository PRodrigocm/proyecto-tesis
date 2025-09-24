import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const ieId = url.searchParams.get('ieId')

    if (!ieId) {
      return NextResponse.json(
        { error: 'Institution ID is required' },
        { status: 400 }
      )
    }

    const auxiliares = await prisma.usuario.findMany({
      where: {
        idIe: parseInt(ieId),
        roles: {
          some: {
            rol: {
              nombre: 'AUXILIAR'
            }
          }
        }
      },
      include: {
        ie: true,
        roles: {
          include: {
            rol: true
          }
        }
      },
      orderBy: [
        { apellido: 'asc' },
        { nombre: 'asc' }
      ]
    })

    return NextResponse.json({
      data: auxiliares,
      total: auxiliares.length
    })

  } catch (error) {
    console.error('Error fetching auxiliares:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
