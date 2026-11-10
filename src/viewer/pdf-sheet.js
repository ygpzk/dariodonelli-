// Una pagina letta direttamente dal PDF, dentro il visualizzatore
// (./viewer.js). Stessa logica della tavola DWG (./dwg-sheet.js): il file
// resta il PDF originale, lo legge pdf.js nel browser. La libreria si
// scarica solo quando serve, la prima volta che si apre un PDF.
//
// Due canvas dentro il foglio: la «base» è l'intera pagina a una
// risoluzione fissa, il «dettaglio» copre la parte visibile quando si
// ingrandisce oltre. Ogni disegno avviene su un canvas di appoggio e passa
// sul foglio solo finito, così non si vede mai una pagina a metà.

const BASE_PX = 2048 // larghezza della base, in pixel del dispositivo (fino al doppio su schermi densi)
const MAX_PIXELS = 12e6 // area massima di un canvas di dettaglio
const MARGIN = 0.3 // quanto disegnare oltre la parte visibile, per lato

let lib = null
const docs = new Map() // url → Promise<PDFDocumentProxy>

/** pdf.js e il suo worker, caricati una volta sola. */
function pdfjs() {
  lib ??= Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')]).then(([m, worker]) => {
    m.GlobalWorkerOptions.workerSrc = worker.default
    return m
  })
  return lib
}

/** Apre (una volta) il PDF. */
export function loadPdf(url) {
  let p = docs.get(url)
  if (!p) {
    p = pdfjs().then((m) => m.getDocument({ url }).promise)
    p.catch(() => docs.delete(url))
    docs.set(url, p)
  }
  return p
}

const dpr = () => Math.min(3, window.devicePixelRatio || 1)

/**
 * @param {HTMLElement} sheetEl il foglio (.viewer__sheet)
 * @param {{ pdf: string, page?: string }} s dati della tavola
 * @param {{ onStatus?: (text: string) => void }} [o]
 */
export function createPdfLayer(sheetEl, s, o = {}) {
  const url = s.src
  const pageNo = Number(s.page) || 1
  let alive = true
  let page = null
  let baseDone = false
  let lastKey = ''
  let renderSeq = 0
  let task = null

  const make = (cls) => {
    const c = document.createElement('canvas')
    c.className = `viewer__layer ${cls}`
    c.setAttribute('aria-hidden', 'true')
    return c
  }
  const base = make('viewer__layer--base')
  const detail = make('viewer__layer--detail')
  detail.hidden = true
  sheetEl.append(base, detail)

  const say = (t) => o.onStatus?.(t)

  /**
   * Disegna la pagina alla larghezza `fullW` (px del dispositivo), tagliata
   * al riquadro (ox, oy, w, h) in pixel, dentro `canvas`.
   */
  const paint = async (canvas, fullW, ox, oy, w, h) => {
    task?.cancel()
    const scratch = document.createElement('canvas')
    scratch.width = w
    scratch.height = h
    const viewport = page.getViewport({ scale: fullW / page.getViewport({ scale: 1 }).width })
    const mine = (task = page.render({ canvas: scratch, viewport, transform: [1, 0, 0, 1, -ox, -oy] }))
    try {
      await mine.promise
    } catch {
      return false // annullato da un disegno più recente
    } finally {
      if (task === mine) task = null
    }
    if (!alive) return false
    canvas.width = w
    canvas.height = h
    canvas.getContext('2d').drawImage(scratch, 0, 0)
    return true
  }

  say('Apro il PDF…')
  const ready = loadPdf(url)
    .then((doc) => doc.getPage(pageNo))
    .then(async (p) => {
      if (!alive) return
      page = p
      // Le misure vengono dal viewport e non da p.view: il viewport tiene
      // conto della rotazione della pagina (le stampe da CAD sono spesso
      // salvate ruotate di 270°) e senza di essa il foglio uscirebbe
      // schiacciato.
      const v1 = p.getViewport({ scale: 1 })
      const w = Math.round(Math.min(BASE_PX * Math.min(dpr(), 2), 4096))
      const h = Math.round((w * v1.height) / v1.width)
      if (!(await paint(base, w, 0, 0, w, h))) return
      baseDone = true
      base.classList.add('is-in')
      say('')
    })
    .catch((err) => {
      if (!alive) return
      say(`Non riesco a leggere il PDF (${err.message})`)
    })

  /**
   * La vista si è fermata: se il foglio è più grande della base, si disegna
   * la parte visibile (con un margine) alla risoluzione dello schermo.
   * @param {{ x: number, y: number, w: number, h: number, sw: number, sh: number }} v
   */
  const render = async (v) => {
    if (!alive || !page || !baseDone) return
    const d = dpr()
    if (v.w * d <= base.width * 1.05) {
      detail.hidden = true
      lastKey = ''
      return
    }
    const fx0 = Math.max(0, (-v.x - v.sw * MARGIN) / v.w)
    const fy0 = Math.max(0, (-v.y - v.sh * MARGIN) / v.h)
    const fx1 = Math.min(1, (-v.x + v.sw * (1 + MARGIN)) / v.w)
    const fy1 = Math.min(1, (-v.y + v.sh * (1 + MARGIN)) / v.h)
    if (fx1 <= fx0 || fy1 <= fy0) return
    let scale = d
    let w = Math.round((fx1 - fx0) * v.w * scale)
    let h = Math.round((fy1 - fy0) * v.h * scale)
    if (w * h > MAX_PIXELS) {
      scale *= Math.sqrt(MAX_PIXELS / (w * h))
      w = Math.round((fx1 - fx0) * v.w * scale)
      h = Math.round((fy1 - fy0) * v.h * scale)
    }
    const key = [fx0, fy0, fx1, fy1, w, h].map((n) => n.toFixed(4)).join('|')
    if (key === lastKey && !detail.hidden) return
    const mine = ++renderSeq
    const fullW = v.w * scale
    const ok = await paint(detail, fullW, fx0 * fullW, fy0 * v.h * scale, w, h)
    if (!ok || mine !== renderSeq || !alive) return
    detail.style.left = `${(fx0 * 100).toFixed(4)}%`
    detail.style.top = `${(fy0 * 100).toFixed(4)}%`
    detail.style.width = `${((fx1 - fx0) * 100).toFixed(4)}%`
    detail.style.height = `${((fy1 - fy0) * 100).toFixed(4)}%`
    detail.hidden = false
    lastKey = key
  }

  const destroy = () => {
    alive = false
    task?.cancel()
    base.remove()
    detail.remove()
  }

  return { ready, render, destroy }
}
