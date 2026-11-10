/**
 * Le pagine del sito e i loro metadati.
 *
 * Il sito resta una pagina sola per tutto ciò che riguarda lo studio; ogni
 * lavoro dell'archivio ha però un suo indirizzo, /lavori/<id>, così che si
 * possa condividere, ritrovare e indicizzare. Qui si decide quale pagina
 * corrisponde a un percorso e quali titolo, descrizione e immagine di
 * anteprima le spettano: li usano App.jsx (titolo della scheda aperta nel
 * browser) e plugins/prerender.js (HTML statico di ogni pagina, sitemap).
 */

import { siteUrl, studio } from './content.js'
import { lavori, lavoriById } from './lavori.js'

export const HOME = {
  kind: 'home',
  path: '/',
  title: 'Ing. Dario Donelli | Studio tecnico a Rivalta sul Mincio (MN)',
  description:
    'Studio tecnico dell’Ing. Dario Donelli a Rivalta sul Mincio (Mantova): progettazione architettonica e strutturale, sicurezza sismica, riqualificazione energetica e direzione lavori. Archivio dei lavori dal 2010.',
  image: `${siteUrl}/images/hero-targa-og.jpg`,
}

/** Percorso → pagina. Un lavoro inesistente dà la pagina «non trovato». */
export function resolve(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/') return HOME
  const m = path.match(/^\/lavori\/([a-z0-9-]+)$/)
  if (m) {
    const work = lavoriById[m[1]]
    if (work) {
      return {
        kind: 'work',
        path: work.path,
        work,
        title: `${work.title} (${work.year}) | ${studio.name}`,
        description: work.summary,
        image: `${siteUrl}${work.cover.mini}`,
      }
    }
  }
  return {
    kind: 'missing',
    path,
    title: `Pagina non trovata | ${studio.name}`,
    description: HOME.description,
    image: HOME.image,
  }
}

/** Tutti i percorsi da prerenderizzare e da mettere in sitemap. */
export const routes = ['/', ...lavori.map((w) => w.path)]
