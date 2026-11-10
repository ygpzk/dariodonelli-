// Visualizzatore delle tavole (./SheetViewer.jsx): si sfoglia un disegno
// come in un programma CAD. Trascina per spostarti, Ctrl + rotella o due
// dita per ingrandire, doppio clic per avvicinarti, frecce per cambiare
// tavola (o per spostarti, quando la tavola è ingrandita), + e − per lo
// zoom, F o 0 per adattarla allo schermo. Niente barra degli strumenti,
// niente schermo intero e niente scaricamento: lo studio non li vuole.
//
// Il foglio è .viewer__sheet: sotto c'è la miniatura, sopra due canvas
// disegnati leggendo il file originale, il DWG (./dwg-sheet.js) o il PDF
// (./pdf-sheet.js). Durante i gesti il foglio si muove solo con transform,
// che la GPU applica senza ridisegnare; quando la vista si ferma prende la
// misura vera e la parte visibile si ridisegna nitida a quella scala.
//
// Dentro la pagina la rotella scorre la pagina finché la tavola non è
// ingrandita e sul telefono un dito scorre la pagina: servono due dita.
//
// Viene dal visualizzatore di albertopecchini.it; qui `setupViewer`
// restituisce la funzione che lo smonta, per l'effetto di React.

import { createDwgLayer } from './dwg-sheet.js'
import { createPdfLayer } from './pdf-sheet.js'

const SETTLE_MS = 180 // quanto dopo l'ultimo movimento la vista si considera ferma
const BASE = 1000 // larghezza del foglio a zoom 1, in px CSS
const DOUBLE_TAP_MS = 320

const $ = (selector, root) => root.querySelector(selector)
const $$ = (selector, root) => [...root.querySelectorAll(selector)]
const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

/**
 * @param {HTMLElement} root la sezione [data-viewer]
 * @returns {() => void} smonta il visualizzatore
 */
export function setupViewer(root) {
  const stage = $('[data-viewer-stage]', root)
  const sheetEl = $('[data-viewer-sheet]', root)
  const thumb = $('[data-viewer-thumb]', root)
  // Ogni tavola può avere più bottoni (la striscia sopra il piano e
  // l'elenco sotto): si raggruppano per identificativo, il primo porta i dati.
  const buttons = $$('[data-viewer-go]', root)
  if (!stage || !sheetEl || !thumb || !buttons.length) return () => {}
  const ids = [...new Set(buttons.map((b) => b.dataset.viewerGo))]

  const ac = new AbortController()
  const on = (target, type, fn, o = {}) => target.addEventListener(type, fn, { ...o, signal: ac.signal })

  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const status = $('[data-viewer-status]', root)
  const hint = $('[data-viewer-hint]', root)
  const live = $('[data-viewer-live]', root)
  const el = {
    meta: $('[data-viewer-meta]', root),
    name: $('[data-viewer-name]', root),
    note: $('[data-viewer-note]', root),
  }

  const sheets = ids.map((id, i) => {
    const all = buttons.filter((b) => b.dataset.viewerGo === id)
    const a = all[0]
    return { a, all, ...a.dataset, w: Number(a.dataset.w), h: Number(a.dataset.h), max: Number(a.dataset.max), pos: i + 1 }
  })

  // ── Stato ─────────────────────────────────────────────────────────────────
  // `view` è ciò che si vede, `target` dove si sta andando (coincidono durante
  // trascinamento, rotella e pizzico). `zc` è lo zoom a cui il foglio è stato
  // ridisegnato: il transform applica solo il rapporto view.z / zc.

  let cur = -1
  let base = { w: BASE, h: BASE }
  let sw = stage.clientWidth
  let sh = stage.clientHeight
  let fitZ = 1
  let minZ = 0.5
  let maxZ = 16
  let zc = 1
  const view = { x: 0, y: 0, z: 1 }
  const target = { x: 0, y: 0, z: 1 }
  let raf = null
  let layer = null // i canvas della tavola corrente, letti dal DWG o dal PDF
  let pending = null
  let lastT = 0
  let settleTimer = 0
  let moving = false

  const zoomed = () => view.z > fitZ * 1.02

  // Lo scorrimento morbido (Lenis) lascia la rotella al visualizzatore
  // quando è lui a usarla: con la tavola ingrandita.
  const syncWheel = () => stage.toggleAttribute('data-lenis-prevent-wheel', zoomed())

  const fit = () => {
    const pad = Math.min(24, sw * 0.03)
    const z = Math.min((sw - pad * 2) / base.w, (sh - pad * 2) / base.h)
    return { z, x: (sw - base.w * z) / 2, y: (sh - base.h * z) / 2 }
  }

  // Il foglio non esce mai del tutto: ne resta visibile almeno una striscia.
  const bound = (v) => {
    const w = base.w * v.z
    const h = base.h * v.z
    const mx = Math.min(sw * 0.3, w)
    const my = Math.min(sh * 0.3, h)
    return { z: v.z, x: clamp(v.x, mx - w, sw - mx), y: clamp(v.y, my - h, sh - my) }
  }

  const scaleTo = (z, px, py) => {
    const f = z / target.z
    return { z, x: px - (px - target.x) * f, y: py - (py - target.y) * f }
  }

  // ── Disegno ───────────────────────────────────────────────────────────────

  let applied = ''
  let wasZoomed = null

  const commit = () => {
    if (Math.abs(view.z / zc - 1) < 0.002) return
    zc = view.z
    sheetEl.style.width = `${(base.w * zc).toFixed(2)}px`
    sheetEl.style.height = `${(base.h * zc).toFixed(2)}px`
    applied = ''
    apply()
  }

  // a vista ferma la tavola ridisegna la parte visibile alla scala vera
  const renderLayer = () => layer?.render({ x: view.x, y: view.y, w: base.w * zc, h: base.h * zc, sw, sh })

  const settle = () => {
    moving = false
    root.classList.remove('is-moving')
    commit()
    renderLayer()
  }

  function apply() {
    const transform = `translate3d(${view.x.toFixed(2)}px, ${view.y.toFixed(2)}px, 0) scale(${(view.z / zc).toFixed(5)})`
    if (transform !== applied) {
      sheetEl.style.transform = applied = transform
      if (!moving) root.classList.add('is-moving')
      moving = true
      clearTimeout(settleTimer)
      settleTimer = setTimeout(settle, SETTLE_MS)
    }
    const z = zoomed()
    if (z !== wasZoomed) {
      root.classList.toggle('is-zoomed', (wasZoomed = z))
      syncWheel()
    }
  }

  const schedule = () => {
    pending ??= requestAnimationFrame(() => {
      pending = null
      apply()
    })
  }

  // Avvicinamento esponenziale al bersaglio
  const tick = (now) => {
    const dt = lastT ? Math.min(now - lastT, 64) : 1000 / 60
    lastT = now
    const k = 1 - Math.pow(0.78, dt / (1000 / 60))
    view.x += (target.x - view.x) * k
    view.y += (target.y - view.y) * k
    view.z += (target.z - view.z) * k
    const done = Math.abs(target.x - view.x) < 0.3 && Math.abs(target.y - view.y) < 0.3 && Math.abs(target.z / view.z - 1) < 0.001
    if (done) {
      Object.assign(view, target)
      raf = null
      lastT = 0
    } else {
      raf = requestAnimationFrame(tick)
    }
    apply()
  }

  const go = (to, { animate = true } = {}) => {
    const z = clamp(to.z ?? target.z, minZ, maxZ)
    Object.assign(target, bound({ x: to.x ?? target.x, y: to.y ?? target.y, z }))
    if (!animate || still) {
      Object.assign(view, target)
      if (raf) cancelAnimationFrame(raf)
      raf = null
      lastT = 0
      schedule()
      return
    }
    raf ??= requestAnimationFrame(tick)
  }

  const zoomAt = (factor, px, py, animate = false) => go(scaleTo(clamp(target.z * factor, minZ, maxZ), px, py), { animate })
  const center = () => ({ x: sw / 2, y: sh / 2 })

  // ── Misure ────────────────────────────────────────────────────────────────

  // posizione dello stage nella finestra: letta a inizio gesto, non a ogni evento
  let sx = 0
  let sy = 0
  const origin = () => {
    const r = stage.getBoundingClientRect()
    sx = r.left
    sy = r.top
  }
  const measure = () => {
    origin()
    sw = stage.clientWidth || 1
    sh = stage.clientHeight || 1
    const wasFit = Math.abs(target.z / fitZ - 1) < 0.01
    fitZ = fit().z
    minZ = fitZ * 0.6
    maxZ = Math.max(fitZ * 2, (cur >= 0 ? sheets[cur].max : 16000) / base.w)
    return wasFit
  }

  // Il foglio torna adattato, senza animazione, ed è ridisegnato subito a quella scala
  const reset = () => {
    go(fit(), { animate: false })
    settle()
  }

  // ── Tavola corrente ───────────────────────────────────────────────────────

  let token = 0
  let statusTimer = 0
  const setStatus = (text, delay = 0) => {
    clearTimeout(statusTimer)
    if (!status) return
    if (!text) {
      status.hidden = true
      return
    }
    statusTimer = setTimeout(() => {
      status.textContent = text
      status.hidden = false
    }, delay)
  }

  const announce = (message) => {
    if (!live) return
    live.textContent = ''
    requestAnimationFrame(() => (live.textContent = message))
  }

  const loadLayer = (s) => {
    const mine = ++token
    layer?.destroy()
    layer = null
    const make = s.kind === 'dwg' ? createDwgLayer : s.kind === 'pdf' ? createPdfLayer : null
    if (!make) return setStatus('')
    layer = make(sheetEl, s, { onStatus: (t) => mine === token && setStatus(t, t ? 250 : 0) })
    layer.ready.then(() => mine === token && renderLayer())
  }

  // l'elenco (o la striscia) scorre fino alla tavola corrente senza muovere la pagina
  const reveal = (a) => {
    const list = a.closest('[data-viewer-list], [data-viewer-strip]')
    if (!list) return
    requestAnimationFrame(() => {
      const lr = list.getBoundingClientRect()
      const ar = a.getBoundingClientRect()
      const behavior = still ? 'auto' : 'smooth'
      if (list.scrollHeight > list.clientHeight + 1 && (ar.top < lr.top || ar.bottom > lr.bottom)) {
        list.scrollTo({ top: list.scrollTop + ar.top - lr.top - lr.height / 2 + ar.height / 2, behavior })
      }
      if (list.scrollWidth > list.clientWidth + 1 && (ar.left < lr.left || ar.right > lr.right)) {
        list.scrollTo({ left: list.scrollLeft + ar.left - lr.left - lr.width / 2 + ar.width / 2, behavior })
      }
    })
  }

  const show = (i, { say = true } = {}) => {
    i = (i + sheets.length) % sheets.length
    if (i === cur) return
    cur = i
    const s = sheets[i]
    base = { w: BASE, h: (BASE * s.h) / s.w }

    thumb.src = s.thumb
    thumb.width = s.w
    thumb.height = s.h
    thumb.alt = s.alt
    loadLayer(s)

    sheets.forEach((x, k) => x.all.forEach((a) => (k === i ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'))))
    if (el.meta) el.meta.replaceChildren(...s.meta.split('|').map((m) => Object.assign(document.createElement('span'), { textContent: m })))
    if (el.name) el.name.textContent = s.title
    if (el.note) el.note.textContent = s.note

    measure()
    reset()
    s.all.forEach(reveal)
    if (say) announce(`${s.title}`)
  }

  const step = (d) => show(cur + d)

  // ── Rotella ───────────────────────────────────────────────────────────────

  let hintTimer = 0
  const flashHint = () => {
    if (!hint) return
    root.classList.add('is-hinting')
    clearTimeout(hintTimer)
    hintTimer = setTimeout(() => root.classList.remove('is-hinting'), 1400)
  }

  on(
    stage,
    'wheel',
    (e) => {
      const pinch = e.ctrlKey || e.metaKey
      if (!pinch && !zoomed()) return flashHint()
      e.preventDefault()
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? sh : 1
      if (pinch) {
        origin()
        const dy = clamp(e.deltaY * unit, -60, 60)
        zoomAt(Math.exp(-dy * 0.0045), e.clientX - sx, e.clientY - sy)
        return
      }
      let dx = e.deltaX * unit
      let dy = e.deltaY * unit
      if (e.shiftKey && !dx) {
        dx = dy
        dy = 0
      }
      go({ x: target.x - dx, y: target.y - dy }, { animate: false })
    },
    { passive: false },
  )

  // ── Puntatori: un dito o il mouse spostano, due dita ingrandiscono ────────

  const pointers = new Map()
  let drag = null
  let pinch = null
  let lastTap = null
  let lastType = 'mouse'
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)

  on(stage, 'pointerdown', (e) => {
    if (e.button !== 0 && e.button !== 1) return
    measure()
    lastType = e.pointerType
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, type: e.pointerType })
    stage.setPointerCapture?.(e.pointerId)
    if (pointers.size === 1) {
      drag = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, moved: false, type: e.pointerType }
      pinch = null
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()]
      pinch = { d: dist(a, b), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }
      drag = null
    }
    if (e.button === 1) e.preventDefault()
  })

  on(stage, 'pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, type: e.pointerType })
    if (pinch && pointers.size >= 2) {
      const [a, b] = [...pointers.values()]
      const d = dist(a, b)
      const mx = (a.x + b.x) / 2
      const my = (a.y + b.y) / 2
      const s = scaleTo(clamp((target.z * d) / pinch.d, minZ, maxZ), pinch.mx - sx, pinch.my - sy)
      go({ z: s.z, x: s.x + (mx - pinch.mx), y: s.y + (my - pinch.my) }, { animate: false })
      pinch = { d, mx, my }
      return
    }
    if (!drag) return
    const dx = e.clientX - drag.x
    const dy = e.clientY - drag.y
    if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 4) {
      drag.moved = true
      root.classList.add('is-dragging')
    }
    if (!drag.moved) return
    // al dito, con la tavola adattata, il gesto orizzontale sfoglia le tavole
    if (drag.type === 'touch' && !zoomed()) return
    go({ x: target.x + dx, y: target.y + dy }, { animate: false })
    drag.x = e.clientX
    drag.y = e.clientY
  })

  // doppio clic: più vicino; da molto vicino si torna alla tavola intera
  const closer = (px, py) => (view.z > fitZ * 3.5 ? go(fit()) : zoomAt(2.5, px, py, true))

  const release = (e) => {
    if (!pointers.has(e.pointerId)) return
    pointers.delete(e.pointerId)
    const d = drag
    if (pointers.size === 0) {
      drag = null
      pinch = null
      root.classList.remove('is-dragging')
    } else if (pointers.size === 1) {
      const [p] = pointers.values()
      drag = { x: p.x, y: p.y, x0: p.x, y0: p.y, moved: true, type: p.type }
      pinch = null
    }
    if (!d || e.type === 'pointercancel') return
    const dx = e.clientX - d.x0
    const dy = e.clientY - d.y0
    // sfoglio col dito: uno scatto orizzontale netto sulla tavola adattata
    if (d.type === 'touch' && d.moved && !zoomed() && Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      step(dx < 0 ? 1 : -1)
      return
    }
    // doppio tocco (il doppio clic del mouse ha il suo evento)
    if (d.type === 'touch' && !d.moved) {
      const now = performance.now()
      if (lastTap && now - lastTap.t < DOUBLE_TAP_MS && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 30) {
        lastTap = null
        closer(e.clientX - sx, e.clientY - sy)
      } else lastTap = { t: now, x: e.clientX, y: e.clientY }
    }
  }
  on(stage, 'pointerup', release)
  on(stage, 'pointercancel', release)
  on(stage, 'dragstart', (e) => e.preventDefault())
  on(stage, 'dblclick', (e) => {
    if (lastType === 'touch') return // il doppio tocco è già gestito sopra
    measure()
    closer(e.clientX - sx, e.clientY - sy)
  })

  // ── Tastiera ──────────────────────────────────────────────────────────────
  // Il visualizzatore ascolta solo quando ha il fuoco.

  on(document, 'keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return
    if (!root.contains(document.activeElement)) return
    const c = center()
    const pan = 90
    switch (e.key) {
      case '+':
      case '=':
        zoomAt(1.4, c.x, c.y, true)
        break
      case '-':
      case '_':
        zoomAt(1 / 1.4, c.x, c.y, true)
        break
      case '0':
      case 'f':
      case 'F':
        go(fit())
        break
      case 'ArrowLeft':
        if (zoomed()) go({ x: target.x + pan })
        else step(-1)
        break
      case 'ArrowRight':
        if (zoomed()) go({ x: target.x - pan })
        else step(1)
        break
      case 'ArrowUp':
        if (!zoomed()) return
        go({ y: target.y + pan })
        break
      case 'ArrowDown':
        if (!zoomed()) return
        go({ y: target.y - pan })
        break
      case 'PageUp':
        step(-1)
        break
      case 'PageDown':
        step(1)
        break
      default:
        return
    }
    e.preventDefault()
  })

  // ── Elenco e file ─────────────────────────────────────────────────────────
  // Le voci dell'elenco sono bottoni, senza collegamento al file; il menu
  // del tasto destro sul piano è spento, così non offre «Salva immagine».

  on(stage, 'contextmenu', (e) => e.preventDefault())
  buttons.forEach((a) =>
    on(a, 'click', () => {
      show(ids.indexOf(a.dataset.viewerGo))
      if (innerWidth < 768) stage.scrollIntoView?.({ block: 'nearest', behavior: still ? 'auto' : 'smooth' })
    }),
  )

  // Sopra la striscia la rotella la fa scorrere di lato, come la timeline di
  // un programma di montaggio, e la pagina resta ferma. Va bene sia la rotella
  // verticale sia lo scorrimento orizzontale del trackpad.
  const strip = $('[data-viewer-strip]', root)
  if (strip) {
    on(
      strip,
      'wheel',
      (e) => {
        if (e.ctrlKey) return // il pizzico del trackpad resta al browser
        e.preventDefault()
        const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
        strip.scrollLeft += e.deltaMode === 1 ? d * 32 : e.deltaMode === 2 ? d * strip.clientWidth : d
      },
      { passive: false },
    )
  }

  // ── Avvio ─────────────────────────────────────────────────────────────────

  root.classList.add('is-ready')
  show(0, { say: false })

  // Ridimensionamento: se la tavola era adattata si riadatta, altrimenti la
  // vista resta dov'è e cambiano solo i limiti dello zoom.
  const onResize = () => {
    const wasFit = measure()
    if (wasFit) reset()
    else go(target, { animate: false })
  }
  const observer = 'ResizeObserver' in window ? new ResizeObserver(onResize) : null
  if (observer) observer.observe(stage)
  else on(window, 'resize', onResize)

  return () => {
    ac.abort()
    observer?.disconnect()
    if (raf) cancelAnimationFrame(raf)
    if (pending) cancelAnimationFrame(pending)
    clearTimeout(settleTimer)
    clearTimeout(statusTimer)
    clearTimeout(hintTimer)
    layer?.destroy()
    root.classList.remove('is-ready', 'is-moving', 'is-zoomed', 'is-dragging', 'is-hinting')
  }
}
