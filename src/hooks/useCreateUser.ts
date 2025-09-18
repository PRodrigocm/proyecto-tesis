import { useState } from 'react'

export interface CreateUserData {
  dni: string
  nombres: string
  apellidos: string
  email: string
  telefono: string
  passwordHash: string
  confirmPassword: string
  ieId: string
  roleIds: string[]
  especialidad?: string // Para docentes
  ocupacion?: string // Para apoderados
  fechaNacimiento?: string // Para estudiantes
  estado?: string // Para administrativos
  grado?: string // Para estudiantes
  seccion?: string // Para estudiantes
  apoderadoId?: string // Para estudiantes
  relacionApoderado?: string // Para estudiantes
}

export interface CreatedUser {
  id: string
  nombre: string
  apellido: string
  dni: string
  email: string
  telefono: string
  estado: string
  institucion: string
  roles: string[]
}

export const useCreateUser = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const createUser = async (userData: CreateUserData): Promise<CreatedUser | null> => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    console.log('=== INICIO CREACIÓN DE USUARIO (FRONTEND) ===')
    console.log('Datos recibidos:', userData)

    try {
      // Validar que las contraseñas coincidan
      if (userData.passwordHash !== userData.confirmPassword) {
        console.log('ERROR: Las contraseñas no coinciden')
        throw new Error('Las contraseñas no coinciden')
      }
      console.log('✓ Contraseñas coinciden')

      // Validar longitud de contraseña
      if (userData.passwordHash.length < 6) {
        console.log('ERROR: Contraseña muy corta')
        throw new Error('La contraseña debe tener al menos 6 caracteres')
      }
      console.log('✓ Contraseña válida')

      // Validar DNI (8 dígitos)
      if (!/^\d{8}$/.test(userData.dni)) {
        console.log('ERROR: DNI inválido:', userData.dni)
        throw new Error('El DNI debe tener 8 dígitos')
      }
      console.log('✓ DNI válido')

      // Validar email solo si está presente (no requerido para estudiantes)
      if (userData.email && userData.email.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(userData.email)) {
          console.log('ERROR: Email inválido:', userData.email)
          throw new Error('El email no tiene un formato válido')
        }
        console.log('✓ Email válido')
      } else {
        console.log('✓ Email no requerido o vacío')
      }

      const requestBody = {
        dni: userData.dni,
        nombres: userData.nombres,
        apellidos: userData.apellidos,
        email: userData.email,
        telefono: userData.telefono,
        passwordHash: userData.passwordHash,
        ieId: userData.ieId,
        roleIds: userData.roleIds,
        especialidad: userData.especialidad,
        ocupacion: userData.ocupacion,
        fechaNacimiento: userData.fechaNacimiento,
        estado: userData.estado,
        grado: userData.grado,
        seccion: userData.seccion,
        apoderadoId: userData.apoderadoId,
        relacionApoderado: userData.relacionApoderado
      }

      console.log('Enviando petición a /api/usuarios con datos:', requestBody)

      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('Respuesta recibida - Status:', response.status)
      console.log('Respuesta recibida - OK:', response.ok)

      const data = await response.json()
      console.log('Datos de respuesta:', data)

      if (!response.ok) {
        console.log('ERROR en respuesta:', data.error)
        throw new Error(data.error || 'Error al crear el usuario')
      }

      console.log('✓ Usuario creado exitosamente')
      setSuccess(true)
      return data.user

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }

  const resetState = () => {
    setError(null)
    setSuccess(false)
  }

  return {
    createUser,
    loading,
    error,
    success,
    resetState
  }
}
