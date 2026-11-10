import { useEffect, useRef } from 'react'
import './viewer.css'

/* ---------------------------------------------------------------------------
   Visualizzatore delle tavole
   Sopra, la striscia con tutte le miniature a tutta larghezza (come la
   timeline di un programma di montaggio): si scorre e si sceglie. Sotto, il
   piano con zoom e spostamento, poi la riga dati della tavola e l'elenco con
   le miniature. Per scelta dello studio non c'è la barra degli strumenti e i
   file non si scaricano: nessun collegamento all'originale, le voci sono
   bottoni e il menu del tasto destro sul piano è spento. Si ingrandisce con
   Ctrl + rotella, due dita o doppio clic; da tastiera + e −, 0 per adattare,
   frecce per cambiare tavola.
   Lo strumento vero (./viewer.js, con i lettori di DWG e PDF) si scarica
   a parte, quando il visualizzatore sta per entrare nello schermo.
   --------------------------------------------------------------------------- */

// Larghezza massima del foglio sullo schermo, in px CSS: DWG e PDF si
// ridisegnano nitidi a qualunque scala, un'immagine si ferma al quadruplo.
const MAX_DRAWN = 40000

const kindOf = (s) => (s.dwg ? 'dwg' : s.src.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image')

const pad2 = (n) => String(n).padStart(2, '0')

/** Riga dati: numero, scala, formato, tipo di file. */
const metaOf = (s, i, total) =>
  [`${s.tag || 'Tav.'} ${pad2(i + 1)} / ${pad2(total)}`, s.scale && `Scala ${s.scale}`, s.paper, kindOf(s) === 'image' ? null : kindOf(s).toUpperCase()].filter(Boolean)

/**
 * Gli attributi che viewer.js legge da ogni bottone. Una tavola ha due
 * bottoni (striscia ed elenco): portano entrambi gli stessi dati.
 */
function dataAttrs(sheet, index, total) {
  const kind = kindOf(sheet)
  return {
    'data-viewer-go': sheet.id,
    'data-kind': kind,
    'data-src': sheet.src,
    'data-thumb': sheet.thumb,
    'data-w': sheet.width,
    'data-h': sheet.height,
    'data-max': kind === 'image' ? sheet.width * 4 : MAX_DRAWN,
    'data-dwg': sheet.dwg || undefined,
    'data-box': sheet.box ? sheet.box.join(',') : undefined,
    'data-darken': sheet.darken ? '1' : undefined,
    'data-paper': sheet.paper || undefined,
    'data-page': sheet.page || undefined,
    'data-title': sheet.title,
    'data-alt': sheet.alt,
    'data-note': sheet.note,
    'data-meta': metaOf(sheet, index, total).join('|'),
  }
}

const STRIP_H = 72

function Chip({ sheet, index, total }) {
  return (
    <li>
      <button
        type="button"
        className="viewer__chip"
        aria-current={index === 0 ? 'true' : undefined}
        aria-label={`${pad2(index + 1)}: ${sheet.title}`}
        {...dataAttrs(sheet, index, total)}
      >
        <img src={sheet.mini || sheet.thumb} alt="" height={STRIP_H} width={Math.round((STRIP_H * sheet.width) / sheet.height)} loading="lazy" decoding="async" draggable="false" />
        <span className="viewer__chip-n" aria-hidden="true">
          {pad2(index + 1)}
        </span>
      </button>
    </li>
  )
}

function Item({ sheet, index, total }) {
  const kind = kindOf(sheet)
  return (
    <li>
      <button type="button" className="viewer__item" aria-current={index === 0 ? 'true' : undefined} {...dataAttrs(sheet, index, total)}>
        <span className="viewer__item-figure">
          <img src={sheet.mini || sheet.thumb} alt="" width="96" height="72" loading="lazy" decoding="async" draggable="false" />
        </span>
        <span className="viewer__item-copy">
          <span className="viewer__item-n">
            {pad2(index + 1)} · {kind === 'image' ? 'Foto' : kind.toUpperCase()}
          </span>
          <span className="viewer__item-title">{sheet.title}</span>
        </span>
      </button>
    </li>
  )
}

/**
 * @param {{ sheets: object[], label?: string }} props
 *   `sheets`: le tavole, vedi `items` in lavori.js (id, title, alt, note,
 *   src, thumb, mini, width, height, e per i PDF page e paper)
 */
export default function SheetViewer({ sheets, label = 'Visualizzatore delle tavole' }) {
  const ref = useRef(null)
  const first = sheets[0]
  const total = sheets.length

  useEffect(() => {
    const root = ref.current
    if (!root) return
    let destroy = null
    let cancelled = false

    const start = () => {
      import('./viewer.js').then(({ setupViewer }) => {
        if (!cancelled) destroy = setupViewer(root)
      })
    }

    // Lo strumento si scarica solo quando il visualizzatore si avvicina.
    let observer = null
    if (typeof IntersectionObserver === 'undefined') start()
    else {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return
          observer.disconnect()
          start()
        },
        { rootMargin: '600px 0px' },
      )
      observer.observe(root)
    }

    return () => {
      cancelled = true
      observer?.disconnect()
      destroy?.()
    }
  }, [])

  return (
    <section className="viewer" data-viewer aria-label={label} ref={ref}>
      {/* La striscia e il piano escono dalla colonna del testo e vanno da
          margine a margine; sotto, i dati e l'elenco tornano in colonna. */}
      <div className="viewer__bleed">
        <nav className="viewer__strip" aria-label="Tutte le tavole e le fotografie" data-viewer-strip>
          <ol role="list">
            {sheets.map((sheet, i) => (
              <Chip key={sheet.id} sheet={sheet} index={i} total={total} />
            ))}
          </ol>
        </nav>

        <div
          className="viewer__stage"
          data-viewer-stage
          tabIndex={0}
          role="region"
          aria-roledescription="visualizzatore"
          aria-label="Tavola: trascina per spostarti, Ctrl e rotella o due dita per ingrandire, frecce per cambiare tavola"
        >
          <div className="viewer__sheet" data-viewer-sheet style={{ '--ratio': `${first.width}/${first.height}` }}>
            <img
              className="viewer__img"
              src={first.thumb}
              width={first.width}
              height={first.height}
              alt={first.alt}
              decoding="async"
              loading="lazy"
              draggable="false"
              data-viewer-thumb
            />
          </div>
          <p className="viewer__status" data-viewer-status aria-live="polite" hidden />
          <p className="viewer__hint" data-viewer-hint aria-hidden="true">
            Ctrl + rotella per ingrandire
          </p>
        </div>
      </div>

      <div className="viewer__foot">
        <div className="viewer__info">
          <p className="viewer__meta" data-viewer-meta>
            {metaOf(first, 0, total).map((m) => (
              <span key={m}>{m}</span>
            ))}
          </p>
          <p className="viewer__title" data-viewer-name>
            {first.title}
          </p>
          <p className="viewer__note" data-viewer-note>
            {first.note}
          </p>
        </div>

        {/* data-lenis-prevent: sopra l'elenco la rotella scorre l'elenco, non la
            pagina (lo scorrimento morbido di motion.js lo lascia stare) */}
        <nav className="viewer__list" aria-label="Elenco delle tavole" data-viewer-list data-lenis-prevent>
          <ol role="list">
            {sheets.map((sheet, i) => (
              <Item key={sheet.id} sheet={sheet} index={i} total={total} />
            ))}
          </ol>
        </nav>
      </div>

      <p className="sr-only" aria-live="polite" data-viewer-live />
    </section>
  )
}
