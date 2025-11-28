import { redirect } from 'next/navigation'

export default function AdminAsistenciaRedirectPage() {
  // Redirigir a la página de asistencia del auxiliar
  redirect('/auxiliar/asistencia')
}
