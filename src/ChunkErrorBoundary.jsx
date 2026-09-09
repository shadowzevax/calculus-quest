import { Component } from 'react'

const RELOAD_FLAG = 'funcionlab_chunk_reload'

function isChunkLoadError(error) {
  const msg = String(error?.message || error || '')
  return /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload CSS/i.test(msg)
}

// Cada ruta se carga en su propio archivo (lazy import) — si mientras el usuario tenía la
// página abierta se publicó una nueva versión (redeploy), esos archivos ya no existen con el
// mismo nombre en el servidor, y al navegar a una ruta que aún no se había cargado, React
// truena con un error sin manejar y la pantalla queda en blanco (Suspense no atrapa errores,
// solo estados de carga). Este límite de error detecta justo ese caso y recarga la página
// automáticamente UNA sola vez (sessionStorage evita un bucle de recargas si el error es
// realmente otra cosa), en vez de dejar al usuario con una página muerta que solo se arregla
// refrescando a mano.
export default class ChunkErrorBoundary extends Component {
  state = { crashed: false }

  static getDerivedStateFromError() {
    return { crashed: true }
  }

  componentDidCatch(error) {
    if (isChunkLoadError(error)) {
      if (!sessionStorage.getItem(RELOAD_FLAG)) {
        sessionStorage.setItem(RELOAD_FLAG, '1')
        window.location.reload()
      }
    }
  }

  render() {
    if (this.state.crashed) return null
    return this.props.children
  }
}
