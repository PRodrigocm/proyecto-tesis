import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import path from 'path'
import fs from 'fs'

/**
 * GET - Descargar documento de justificación
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const documentoId = parseInt(params.id)

    if (isNaN(documentoId)) {
      return NextResponse.json({ error: 'ID de documento inválido' }, { status: 400 })
    }

    // Verificar autenticación
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const userInfo = verifyToken(token)
    if (!userInfo) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Buscar el documento
    const documento = await prisma.documentoJustificacion.findUnique({
      where: { idDocumento: documentoId },
      include: {
        justificacion: {
          include: {
            estudiante: {
              include: {
                usuario: true
              }
            }
          }
        }
      }
    })

    if (!documento) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
    }

    // Verificar que el archivo existe
    const filePath = documento.rutaArchivo
    
    // Si es una ruta relativa, construir la ruta completa
    let fullPath = filePath
    if (!path.isAbsolute(filePath)) {
      fullPath = path.join(process.cwd(), 'public', filePath)
    }

    // Verificar si el archivo existe
    if (!fs.existsSync(fullPath)) {
      // Intentar buscar en uploads
      const uploadsPath = path.join(process.cwd(), 'public', 'uploads', 'justificaciones', path.basename(filePath))
      if (fs.existsSync(uploadsPath)) {
        fullPath = uploadsPath
      } else {
        console.error('Archivo no encontrado:', { filePath, fullPath, uploadsPath })
        return NextResponse.json({ 
          error: 'Archivo no encontrado en el servidor',
          details: { rutaOriginal: filePath }
        }, { status: 404 })
      }
    }

    // Leer el archivo
    const fileBuffer = fs.readFileSync(fullPath)
    
    // Determinar el tipo MIME
    const extension = path.extname(documento.nombreArchivo || filePath).toLowerCase()
    const mimeTypes: { [key: string]: string } = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }
    
    const contentType = mimeTypes[extension] || 'application/octet-stream'

    // Devolver el archivo
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${documento.nombreArchivo || 'documento' + extension}"`,
        'Content-Length': fileBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('Error descargando documento:', error)
    return NextResponse.json(
      { error: 'Error al descargar el documento' },
      { status: 500 }
    )
  }
}
