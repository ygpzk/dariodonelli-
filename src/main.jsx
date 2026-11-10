import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const container = document.getElementById('root')

// La pagina da mostrare è quella dell'indirizzo: la stessa che il prerender
// ha scritto nell'HTML, così l'hydration trova il markup che si aspetta.
const app = (
  <StrictMode>
    <App url={window.location.pathname} />
  </StrictMode>
)

// In produzione il markup arriva già dal prerender: React ci si aggancia
// sopra invece di ricostruirlo. In sviluppo il contenitore è vuoto, quindi
// si crea la radice come sempre.
if (container.hasChildNodes()) {
  hydrateRoot(container, app)
} else {
  createRoot(container).render(app)
}
