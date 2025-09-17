import express from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

const router = express.Router();

/**
 * GET /api/instituciones
 * Obtener todas las instituciones educativas
 */
router.get('/', async (req, res) => {
  try {
    const instituciones = await prisma.ie.findMany({
      select: {
        idIe: true,
        nombre: true,
        codigoIe: true
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    // Formatear para el frontend
    const formattedInstituciones = instituciones.map((ie: any) => ({
      id: ie.idIe.toString(),
      nombre: ie.nombre
    }));

    res.json({
      success: true,
      data: formattedInstituciones
    });
  } catch (error) {
    console.error('Error fetching instituciones:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * GET /api/instituciones/roles
 * Obtener roles disponibles para el login desde la base de datos
 */
router.get('/roles', async (req, res) => {
  try {
    const roles = await prisma.rol.findMany({
      select: {
        idRol: true,
        nombre: true
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    // Formatear para el frontend
    const formattedRoles = roles.map((rol: any) => ({
      id: rol.nombre,
      nombre: rol.nombre === 'ADMIN' ? 'Administrador' :
              rol.nombre === 'ADMINISTRATIVO' ? 'Administrativo' :
              rol.nombre === 'DOCENTE' ? 'Docente' :
              rol.nombre === 'APODERADO' ? 'Apoderado' :
              rol.nombre === 'ESTUDIANTE' ? 'Estudiante' :
              rol.nombre
    }));

    res.json({
      success: true,
      data: formattedRoles
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

export default router;
