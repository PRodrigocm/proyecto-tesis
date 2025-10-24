'use client'

export default function TabLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Este layout anula completamente el layout de docente
  // Usamos position fixed para cubrir toda la pantalla y ocultar el layout padre
  return (
    <div className="fixed inset-0 w-full h-full overflow-auto bg-gradient-to-br from-blue-50 to-indigo-100 z-50">
      {children}
    </div>
  )
}
