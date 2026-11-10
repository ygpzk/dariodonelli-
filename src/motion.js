import Lenis from 'lenis'
import { useEffect } from 'react'

/* ---------------------------------------------------------------------------
   Movimento
   Lo scorrimento morbido della pagina e gli aiuti che fanno muovere il sito
   mentre si scorre. Il resto (come si muove) è negli stili di .reveal
   in App.css.
   --------------------------------------------------------------------------- */

/** Un'unica istanza per la pagina; resta null con il movimento ridotto. */
let lenis = null

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Parte piano, accelera, si posa: per i salti lunghi da un'ancora all'altra. */
const easeInOutQuart = (t) => (t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2)

/** Lo stesso scarto dell'header che usa scroll-padding-top in index.css. */
const HEADER_OFFSET = 88

/**
 * Scorrimento con inerzia (Lenis). La rotella non salta più a scatti di
 * cento pixel: la pagina scivola e si ferma morbida, e con lei tutte le
 * animazioni legate allo scroll. Il tocco resta nativo.
 */
export function useSmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return
    const instance = new Lenis({ lerp: 0.09, autoRaf: true })
    lenis = instance
    return () => {
      instance.destroy()
      if (lenis === instance) lenis = null
    }
  }, [])
}

/**
 * Porta la pagina a un punto: l'id di una sezione, un elemento o una quota
 * in pixel. La durata cresce con la distanza, così un salto breve non è
 * lento e uno lungo non è un lampo.
 */
export function scrollToTarget(target, { immediate = false } = {}) {
  const el = typeof target === 'string' ? document.getElementById(target) : target
  const top = typeof el === 'number' ? el : el ? el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET : 0

  if (lenis) {
    const duration = Math.min(2.2, Math.max(0.9, Math.abs(top - window.scrollY) / 2400))
    lenis.scrollTo(Math.max(0, top), { immediate, duration, easing: easeInOutQuart, force: true })
    return
  }
  window.scrollTo({ top, behavior: immediate || prefersReducedMotion() ? 'auto' : 'smooth' })
}

/**
 * Rivelazione allo scroll. Un solo observer per tutti gli elementi .reveal:
 * la linea di attivazione sta al 14% dal fondo dello schermo, così
 * l'animazione parte quando l'elemento si vede davvero. Arrivati in fondo
 * alla pagina quella linea non si raggiunge più: ciò che è sullo schermo
 * si mostra comunque, e non si perde nulla.
 */
/**
 * @param {string} [route] la pagina corrente: cambiando pagina il contenuto
 *   è nuovo e l'osservatore riparte sui nuovi elementi .reveal
 */
export function useReveal(route) {
  useEffect(() => {
    const nodes = [...document.querySelectorAll('.reveal:not(.is-visible)')]
    if (!nodes.length) return
    const show = (node) => node.classList.add('is-visible')
    if (typeof IntersectionObserver === 'undefined') {
      nodes.forEach(show)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            show(entry.target)
            observer.unobserve(entry.target)
          }
        })
      },
      { rootMargin: '0px 0px -14% 0px', threshold: 0 },
    )
    nodes.forEach((node) => observer.observe(node))

    // Tabulando, il focus può posarsi su un collegamento dentro un blocco
    // non ancora rivelato (il browser lo porta appena dentro la finestra,
    // sotto la linea di attivazione): il blocco si mostra subito.
    const onFocus = (event) => {
      const host = event.target.closest?.('.reveal:not(.is-visible)')
      if (host) {
        show(host)
        observer.unobserve(host)
      }
    }
    document.addEventListener('focusin', onFocus)

    let frame = 0
    const atBottom = () => {
      frame = 0
      if (window.innerHeight + window.scrollY < document.documentElement.scrollHeight - 8) return
      nodes.forEach((node) => {
        if (node.classList.contains('is-visible')) return
        if (node.getBoundingClientRect().top < window.innerHeight) {
          show(node)
          observer.unobserve(node)
        }
      })
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(atBottom)
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      observer.disconnect()
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('focusin', onFocus)
    }
  }, [route])
}
