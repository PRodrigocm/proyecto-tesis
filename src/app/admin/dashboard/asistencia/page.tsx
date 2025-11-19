import { redirect } from 'next/navigation'

export default function AdminAsistenciaRedirectPage() {
  // Redirigir siempre al dashboard principal del administrador
  redirect('/admin')
}
