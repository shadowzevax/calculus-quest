import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Cuando se publica una nueva versión mientras alguien sigue con la pestaña abierta, Vite
// dispara este evento si falla la precarga de un archivo de una ruta que aún no había
// visitado (el archivo viejo ya no existe en el servidor). Recargar la página lo resuelve
// solo, en vez de dejar al usuario con una pantalla en blanco que solo se arregla a mano.
window.addEventListener('vite:preloadError', () => {
  window.location.reload()
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
