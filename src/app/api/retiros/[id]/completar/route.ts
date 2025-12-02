import { NextResponse } from 'next/server'

// Este endpoint ha sido deprecado - El estado COMPLETADO ya no existe
// Los estados válidos son: PENDIENTE, AUTORIZADO, RECHAZADO
export async function PATCH() {
  return NextResponse.json(
    { error: 'Este endpoint ha sido deprecado. Use /api/retiros/[id]/autorizar en su lugar.' },
    { status: 410 }
  )
}
