import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import App from './App.jsx'
import { resolve, routes } from './routes.js'

export { routes }

/**
 * Rende una pagina in HTML statico, per il prerender in fase di build.
 * @param {string} url percorso della pagina ('/', '/lavori/<id>')
 * @returns {{ html: string, head: object }} il markup e i metadati della pagina
 */
export function render(url = '/') {
  const page = resolve(url)
  const html = renderToString(
    <StrictMode>
      <App url={page.path} />
    </StrictMode>,
  )
  return { html, head: page }
}
