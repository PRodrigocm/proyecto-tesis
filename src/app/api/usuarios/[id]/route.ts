import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params
    const id = parseInt(paramId)
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID del usuario es requerido' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { dni, nombre, apellido, email, telefono, direccion, fechaNacimiento } = body

    // Buscar el usuario
    const usuario = await prisma.usuario.findUnique({
      where: { idUsuario: id }
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si el DNI ya existe (excluyendo el usuario actual)
    if (dni !== usuario.dni) {
      const existingUser = await prisma.usuario.findFirst({
        where: { 
          dni,
          idUsuario: { not: id }
        }
      })

      if (existingUser) {
        return NextResponse.json(
          { error: `El DNI ${dni} ya está registrado por otro usuario` },
          { status: 400 }
        )
      }
    }

    // Verificar si el email ya existe (excluyendo el usuario actual)
    if (email !== usuario.email) {
      const existingEmail = await prisma.usuario.findFirst({
        where: { 
          email,
          idUsuario: { not: id }
        }
      })

      if (existingEmail) {
        return NextResponse.json(
          { error: `El email ${email} ya está registrado por otro usuario` },
          { status: 400 }
        )
      }
    }

    // Actualizar usuario
    const updatedUser = await prisma.usuario.update({
      where: { idUsuario: id },
      data: {
        dni,
        nombre,
        apellido,
        email,
        telefono
      }
    })

    return NextResponse.json({
      message: 'Usuario actualizado exitosamente',
      id: id,
      usuario: updatedUser
    })

  } catch (error) {
    console.error('Error updating usuario:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params
    const id = parseInt(paramId)
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID del usuario es requerido' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { estado } = body

    if (!estado || !['ACTIVO', 'INACTIVO'].includes(estado)) {
      return NextResponse.json(
        { error: 'Estado inválido' },
        { status: 400 }
      )
    }

    // Buscar el usuario
    const usuario = await prisma.usuario.findUnique({
      where: { idUsuario: id }
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Actualizar el estado del usuario
    await prisma.usuario.update({
      where: { idUsuario: id },
      data: { estado }
    })

    return NextResponse.json({
      message: 'Estado actualizado exitosamente',
      id: id,
      nuevoEstado: estado
    })

  } catch (error) {
    console.error('Error updating usuario estado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params
    const id = parseInt(paramId)
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID del usuario es requerido' },
        { status: 400 }
      )
    }

    // Buscar el usuario
    const usuario = await prisma.usuario.findUnique({
      where: { idUsuario: id }
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // En lugar de eliminar, cambiar estado a INACTIVO
    await prisma.usuario.update({
      where: { idUsuario: id },
      data: { estado: 'INACTIVO' }
    })

    return NextResponse.json({
      message: 'Usuario desactivado exitosamente',
      id: id
    })

  } catch (error) {
    console.error('Error deleting usuario:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
