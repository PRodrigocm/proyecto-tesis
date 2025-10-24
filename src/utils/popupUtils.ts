interface TabOptions {
  focus?: boolean
}

export const openTomarAsistenciaTab = (
  claseId: string,
  fecha: string,
  options: TabOptions = {}
): Window | null => {
  const { focus = true } = options

  // Construir URL con parámetros
  const url = `/docente/asistencia/tab?claseId=${encodeURIComponent(claseId)}&fecha=${encodeURIComponent(fecha)}`

  // Abrir nueva pestaña
  const newTab = window.open(url, '_blank')

  if (newTab) {
    if (focus) {
      newTab.focus()
    }
  } else {
    alert('❌ No se pudo abrir la nueva pestaña. Verifica que no esté bloqueada por el navegador.')
  }

  return newTab
}

export const closeTabAndRefresh = (targetWindow?: Window) => {
  if (targetWindow && !targetWindow.closed) {
    targetWindow.close()
  }
  
  // Refrescar la pestaña padre si existe
  if (window.opener && !window.opener.closed) {
    window.opener.location.reload()
  }
  
  // Cerrar la pestaña actual
  window.close()
}
