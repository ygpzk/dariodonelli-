import { Fragment, createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import './App.css'
import './lavori.css'
import { prefersReducedMotion, scrollToTarget, useReveal, useSmoothScroll } from './motion.js'
import SheetViewer from './viewer/SheetViewer.jsx'
import {
  ambiti,
  disciplines,
  infoline,
  mapEmbedSrc,
  method,
  profile,
  sections,
  serviceAreas,
  serviceIndex,
  studio,
} from './content.js'
import { categories, lavori, lavoriById, lavoriInEvidenza, neighbours } from './lavori.js'
import { resolve } from './routes.js'

/* ---------------------------------------------------------------------------
   Marchio
   Il logo della targa ridisegnato in vettoriale: una "D" a doppio profilo,
   in nero, sovrapposta alla sua immagine speculare in grigio.
   --------------------------------------------------------------------------- */

const LOGO_OUTER = 'M64 64H520A456 456 0 0 1 520 976H64Z'
const LOGO_INNER = 'M164 164H520A356 356 0 0 1 520 876H164Z'

function Logo({ className = '', ...props }) {
  return (
    <svg viewBox="0 0 1040 1040" fill="none" aria-hidden="true" className={`logo ${className}`} {...props}>
      <g className="logo__ghost" stroke="#b9b5ae" strokeWidth="48" transform="matrix(-1 0 0 1 1040 0)">
        <path d={LOGO_OUTER} />
        <path d={LOGO_INNER} />
      </g>
      <g stroke="currentColor" strokeWidth="48">
        <path d={LOGO_OUTER} />
        <path d={LOGO_INNER} />
      </g>
    </svg>
  )
}

/* ---------------------------------------------------------------------------
   Pagine e navigazione
   Il sito ha una pagina principale e una scheda per ogni lavoro
   (src/routes.js). Il percorso corrente sta in uno stato di React: i
   collegamenti interni lo cambiano con pushState, senza ricaricare, e il
   tasto indietro del browser lo riporta. Il prerender passa il percorso
   dall'esterno (`url`), così server e browser rendono la stessa pagina.
   --------------------------------------------------------------------------- */

const RouterContext = createContext({ path: '/', navigate: () => {} })

const useRouter = () => useContext(RouterContext)

const isPlainClick = (e) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey

const pad2 = (n) => String(n).padStart(2, '0')

/**
 * Collegamento a una pagina del sito. Resta un <a> con l'href vero: con il
 * tasto centrale, Ctrl o senza JavaScript funziona come sempre.
 */
function RouteLink({ to, hash, className, children, ...props }) {
  const { navigate } = useRouter()
  return (
    <a
      href={hash ? `${to}#${hash}` : to}
      className={className}
      onClick={(e) => {
        if (!isPlainClick(e)) return
        e.preventDefault()
        navigate(to, hash)
      }}
      {...props}
    >
      {children}
    </a>
  )
}

/* ---------------------------------------------------------------------------
   Hook di supporto
   --------------------------------------------------------------------------- */

/**
 * Stato dell'header: dopo i primi pixel prende il filetto; scorrendo verso
 * il basso si ritira, risalendo torna.
 */
function useHeaderState() {
  const [state, setState] = useState({ scrolled: false, hidden: false })
  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      const down = y > last + 6
      const up = y < last - 6
      setState((s) => ({ scrolled: y > 24, hidden: y > 360 && down ? true : up || y <= 360 ? false : s.hidden }))
      last = y
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return state
}

/**
 * Un testo parola per parola, ognuna dentro la sua maschera: i titoli
 * salgono da sotto quando entrano nello schermo (o subito, con `now`).
 * Per i lettori di schermo resta il testo intero.
 */
function Split({ text, now = false }) {
  const words = text.split(' ')
  return (
    <>
      <span className="sr-only">{text}</span>
      <span className={now ? 'split split--now' : 'split'} aria-hidden="true">
        {words.map((w, i) => (
          <Fragment key={i}>
            <span className="w">
              <span className="w__in" style={{ '--w': i }}>
                {w}
              </span>
            </span>
            {i < words.length - 1 ? ' ' : ''}
          </Fragment>
        ))}
      </span>
    </>
  )
}

function scrollToSection(id) {
  if (!document.getElementById(id)) return
  scrollToTarget(id)
  window.history.replaceState(null, '', `#${id}`)
}

/**
 * Ancore della pagina principale (#servizi, #contatti…). Dalla pagina
 * principale si scorre; da una scheda si torna prima alla principale e poi
 * si scorre alla sezione.
 */
function useAnchorNav() {
  const { path, navigate } = useRouter()
  return useCallback(
    (event) => {
      if (!isPlainClick(event)) return
      const id = event.currentTarget.getAttribute('href').split('#')[1]
      event.preventDefault()
      if (path === '/') scrollToSection(id)
      else navigate('/', id)
    },
    [path, navigate],
  )
}

/* ---------------------------------------------------------------------------
   Header
   --------------------------------------------------------------------------- */

function Brand() {
  return (
    <span className="brand__inner">
      <Logo className="brand__mark" />
      <span className="brand__copy">
        <span className="brand__name">{studio.name}</span>
        <span className="brand__role">{studio.role}</span>
      </span>
    </span>
  )
}

/* Il marchio e, a destra, le sezioni come collegamenti testuali: tutto il
   sito è raggiungibile dalla prima riga. Nelle schede dei lavori le voci
   riportano alla pagina principale. */
function Header() {
  const { scrolled, hidden } = useHeaderState()
  const { path, navigate } = useRouter()
  const onNav = useAnchorNav()

  return (
    <header className={`header${scrolled ? ' header--scrolled' : ''}${hidden ? ' header--hidden' : ''}`}>
      <div className="container header__inner">
        <a
          href="/"
          className="brand"
          aria-label={`${studio.name}, torna all'inizio`}
          onClick={(e) => {
            if (!isPlainClick(e)) return
            e.preventDefault()
            if (path !== '/') return navigate('/')
            scrollToTarget(0)
            window.history.replaceState(null, '', ' ')
          }}
        >
          <Brand />
        </a>
        <nav className="header__nav" aria-label="Sezioni">
          {sections.map((s) => (
            <a key={s.id} href={`/#${s.id}`} onClick={onNav}>
              {s.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}

/* ---------------------------------------------------------------------------
   Blocchi riutilizzabili
   --------------------------------------------------------------------------- */

/**
 * Intestazione di sezione: numero ed etichetta sul filetto, poi il titolo.
 * Il filetto sottile è l'unico segno grafico che attraversa il sito.
 */
function SectionHead({ id, title, text, children }) {
  const section = sections.find((s) => s.id === id)
  return (
    <div className="section-head reveal">
      <div className="section-head__meta">
        <span className="section-head__index">{section.num}</span>
        <span className="label">{section.label}</span>
      </div>
      <div className="section-head__body">
        <h2 className="headline">
          <Split text={title} />
        </h2>
        {text && <p className="lead">{text}</p>}
        {children}
      </div>
    </div>
  )
}

function Photo({ base, ext = 'jpg', alt, width, height, eager = false, className = '' }) {
  return (
    <picture className={`photo ${className}`}>
      <source srcSet={`${base}.webp`} type="image/webp" />
      <img
        src={`${base}.${ext}`}
        alt={alt}
        width={width}
        height={height}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        {...(eager && { fetchPriority: 'high' })}
      />
    </picture>
  )
}

/**
 * Un file dell'archivio (fotografia o pagina di tavola) come immagine:
 * la miniatura da 480 px per le griglie, il file grande quando il riquadro
 * è largo. Le misure sono quelle del file grande: il rapporto resta.
 */
function ArchiveImage({ item, sizes = '(max-width: 720px) 100vw, 33vw', eager = false, className = '', position }) {
  return (
    <img
      className={className}
      style={position ? { objectPosition: position } : undefined}
      src={item.mini}
      srcSet={`${item.mini} 480w, ${item.thumb} ${item.width}w`}
      sizes={sizes}
      alt={item.alt}
      width={item.width}
      height={item.height}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      {...(eager && { fetchPriority: 'high' })}
    />
  )
}

/** Un file dell'archivio indicato per lavoro e voce (vedi serviceAreas). */
const archiveItem = ({ work, item }) => lavoriById[work]?.items.find((it) => it.id === item)

/** Collegamento testuale con la sottolineatura sottile: l'unica "azione" del sito. */
function TextLink({ href, onClick, children, ...props }) {
  return (
    <a className="text-link" href={href} onClick={onClick} {...props}>
      {children}
    </a>
  )
}

/* ---------------------------------------------------------------------------
   Intro: tutto nella prima schermata
   Il nome, le due righe della targa, i recapiti e il carosello dei lavori
   in evidenza. Scorrendo si approfondisce: servizi, archivio, studio,
   metodo, contatti.
   --------------------------------------------------------------------------- */

const SLIDE_MS = 6500

function HeroCarousel() {
  const slides = lavoriInEvidenza
  const total = slides.length
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const go = useCallback((to) => setIndex(((to % total) + total) % total), [total])

  // Avanza da sé; si ferma sotto il puntatore o con il fuoco, e con il
  // movimento ridotto non si muove affatto.
  useEffect(() => {
    if (paused || prefersReducedMotion()) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % total), SLIDE_MS)
    return () => clearInterval(timer)
  }, [paused, total])

  const current = slides[index]

  /* Sul desktop l'immagine è divisa in tre zone: a sinistra si torna
     indietro, a destra si va avanti, al centro si apre la scheda. Il
     cursore di sistema lascia il posto a un'etichetta che segue il mouse
     e dice cosa farà il clic. La posizione si scrive direttamente nello
     stile, senza passare da React: solo il cambio di zona ridisegna. */
  const cursorRef = useRef(null)
  const [zone, setZone] = useState(null)
  const zoneOf = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const f = (e.clientX - r.left) / r.width
    return { zone: f < 0.3 ? 'prev' : f > 0.7 ? 'next' : 'open', x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const onStageMove = (e) => {
    if (e.pointerType !== 'mouse') return
    const z = zoneOf(e)
    if (cursorRef.current) cursorRef.current.style.transform = `translate3d(${z.x}px, ${z.y}px, 0)`
    if (z.zone !== zone) setZone(z.zone)
  }
  // Il clic su una zona laterale non apre la scheda: cambia lavoro.
  const onStageClick = (e) => {
    if (!zone || zone === 'open' || e.target.closest('.hero__dots')) return
    e.preventDefault()
    e.stopPropagation()
    go(index + (zone === 'next' ? 1 : -1))
  }

  /* Sul telefono: un trascinamento orizzontale netto cambia lavoro. */
  const touch = useRef(null)
  const onTouchStart = (e) => {
    const t = e.touches[0]
    touch.current = { x: t.clientX, y: t.clientY }
    setPaused(true)
  }
  const onTouchEnd = (e) => {
    const start = touch.current
    touch.current = null
    setPaused(false)
    if (!start) return
    const t = e.changedTouches[0]
    const dx = t.clientX - start.x
    const dy = t.clientY - start.y
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      e.preventDefault() // niente clic dopo uno scorrimento
      go(index + (dx < 0 ? 1 : -1))
    }
  }

  const cursorLabel = zone === 'prev' ? '← Precedente' : zone === 'next' ? 'Successivo →' : 'Apri il lavoro'

  return (
    <section
      className="hero"
      aria-roledescription="carosello"
      aria-label="Lavori in evidenza"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(index + 1)
        if (e.key === 'ArrowLeft') go(index - 1)
      }}
    >
      <div
        className={zone ? `hero__stage has-cursor is-${zone}` : 'hero__stage'}
        onPointerMove={onStageMove}
        onPointerLeave={() => setZone(null)}
        onClickCapture={onStageClick}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {slides.map((w, k) => (
          <RouteLink
            to={w.path}
            key={w.id}
            className={k === index ? 'hero__slide is-active' : 'hero__slide'}
            aria-hidden={k !== index}
            tabIndex={k === index ? 0 : -1}
            aria-label={`${w.title}, ${w.year}: apri la scheda`}
          >
            <ArchiveImage item={w.heroCover} sizes="(max-width: 860px) 100vw, 72rem" eager={k < 2} position={w.heroPos} />
          </RouteLink>
        ))}
        {/* l'etichetta che segue il mouse: ←, → o Apri */}
        <span className="hero__cursor" ref={cursorRef} aria-hidden="true">
          <span className="hero__cursor-label">{cursorLabel}</span>
        </span>
        {/* la barra di avanzamento: un filetto per ogni lavoro */}
        <ol className="hero__dots" role="list">
          {slides.map((w, k) => (
            <li key={w.id}>
              <button type="button" className={k === index ? 'hero__dot is-active' : 'hero__dot'} onClick={() => go(k)} aria-label={`Vai a ${w.title}`} aria-current={k === index ? 'true' : undefined} />
            </li>
          ))}
        </ol>
      </div>

      <div className="hero__bar" aria-live="polite">
        <div className="hero__caption">
          <p className="hero__meta label">
            <span>{current.categoryLabel}</span>
            <span>{current.place ? `${current.place} · ${current.year}` : current.year}</span>
          </p>
          <RouteLink to={current.path} className="hero__title">
            <Split text={current.title} now key={index} />
          </RouteLink>
          <p className="hero__text">{current.kicker}</p>
        </div>
        {/* Le frecce: caratteri, non icone, nello stesso disegno dei titoli. */}
        <div className="hero__nav">
          <span className="hero__count">
            <span className="hero__count-now">{pad2(index + 1)}</span> / {pad2(total)}
          </span>
          <button type="button" className="hero__arrow" onClick={() => go(index - 1)} aria-label="Lavoro precedente">
            <span aria-hidden="true">←</span>
          </button>
          <button type="button" className="hero__arrow" onClick={() => go(index + 1)} aria-label="Lavoro successivo">
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </section>
  )
}

function Intro() {
  const onNav = useAnchorNav()

  return (
    <section className="intro" id="top">
      <div className="container">
        <div className="intro__head">
          <h1 className="masthead">
            <span className="masthead__pre">Ing.</span>
            <span className="masthead__name">
              <Split text="Dario Donelli" now />
            </span>
          </h1>
          <div className="intro__aside">
            <p className="intro__plate-lines">
              {studio.plate.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </p>
            <p className="intro__contacts">
              <a href={studio.phoneHref}>{studio.phoneDisplay}</a>
              <a href={studio.emailHref}>{studio.email}</a>
            </p>
          </div>
        </div>

        <p className="infoline">
          {/* Il separatore sta nel CSS, legato alla voce: così il "·" non
              resta mai orfano quando la riga va a capo. */}
          {infoline.map((item) => (
            <span className="infoline__item" key={item}>
              {item}
            </span>
          ))}
        </p>

        <HeroCarousel />

        {/* L'indice in una riga: i servizi, l'archivio, lo studio. */}
        <nav className="intro__index" aria-label="In breve">
          <div className="intro__index-group">
            <span className="label">Servizi</span>
            <p>
              {serviceAreas.map((area) => (
                <TextLink key={area.id} href="#servizi" onClick={onNav}>
                  {area.title}
                </TextLink>
              ))}
            </p>
          </div>
          <div className="intro__index-group">
            <span className="label">Lavori</span>
            <p>
              {categories.map((c) => (
                <TextLink key={c.id} href="#lavori" onClick={onNav}>
                  {c.label}
                </TextLink>
              ))}
            </p>
          </div>
          <div className="intro__index-group">
            <span className="label">Studio</span>
            <p>
              <TextLink href="#studio" onClick={onNav}>
                Chi sono
              </TextLink>
              <TextLink href="#metodo" onClick={onNav}>
                Come lavoro
              </TextLink>
              <TextLink href="#contatti" onClick={onNav}>
                Parliamo del progetto
              </TextLink>
            </p>
          </div>
        </nav>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------------------
   01 Servizi
   --------------------------------------------------------------------------- */

function ServicesSection() {
  const onNav = useAnchorNav()

  return (
    <section className="section" id="servizi">
      <div className="container">
        <SectionHead
          id="servizi"
          title="Tre aree di competenza, un unico interlocutore."
          text="Lo studio copre il percorso completo di un intervento edilizio. In base alle esigenze si può attivare una singola prestazione oppure affidare l'intera gestione tecnica."
        />

        <div className="service-blocks">
          {serviceAreas.map((area, i) => {
            const item = archiveItem(area.cover)
            const work = lavoriById[area.cover.work]
            return (
              <article key={area.id} className={`service-block reveal${i % 2 === 1 ? ' service-block--flip' : ''}`}>
                {/* La fotografia è un lavoro vero dell'archivio e porta alla sua scheda. */}
                <figure className="service-block__media media-reveal">
                  <RouteLink to={work.path} className="service-block__link" aria-label={`${work.title}: apri la scheda`}>
                    <ArchiveImage item={item} sizes="(max-width: 860px) 100vw, 36rem" />
                  </RouteLink>
                  <figcaption className="service-block__caption">
                    <span className="label">Dall’archivio</span>
                    <RouteLink to={work.path}>
                      {work.title}, {work.year}
                    </RouteLink>
                  </figcaption>
                </figure>

                <div className="service-block__copy">
                  <span className="service-block__num" aria-hidden="true">
                    {area.num}
                  </span>
                  <h3 className="service-block__title">{area.title}</h3>
                  <p className="body-text">{area.text}</p>

                  {/* role="list": il reset list-style:none toglie ad alcuni
                      lettori di schermo la semantica di elenco; così resta. */}
                  <ul className="service-block__list" role="list">
                    {area.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>

                  <TextLink href="#contatti" onClick={onNav}>
                    Parliamo del progetto
                  </TextLink>
                </div>
              </article>
            )
          })}
        </div>

        <div className="service-index reveal">
          <div className="service-index__head">
            <span className="label">Tutte le prestazioni</span>
          </div>
          <ol className="index-list" role="list">
            {serviceIndex.map((item, i) => (
              <li key={item}>
                <span className="index-list__num">{pad2(i + 1)}</span>
                {item}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------------------
   02 Lavori
   L'archivio dei lavori dello studio (src/lavori.js): le quattro categorie,
   gli ambiti, poi l'elenco completo che si filtra per categoria. Ogni
   voce porta alla scheda del lavoro.
   --------------------------------------------------------------------------- */

function Archive() {
  const [filter, setFilter] = useState('all')
  const list = filter === 'all' ? lavori : lavori.filter((w) => w.category === filter)
  // quanti lavori per categoria, come nell'elenco dello studio («Strutture (11)»)
  const countOf = (id) => lavori.filter((w) => w.category === id).length

  /* Cambiando filtro le righe della nuova lista sono elementi nuovi, che
     l'osservatore della rivelazione (motion.js) non conosce: resterebbero
     trasparenti. Si mostrano qui, al fotogramma dopo, così la loro entrata
     scaglionata parte dallo stato nascosto invece di saltarlo. */
  const listRef = useRef(null)
  const shownFilter = useRef(filter)
  useEffect(() => {
    if (shownFilter.current === filter) return
    shownFilter.current = filter
    const frame = requestAnimationFrame(() => {
      listRef.current?.querySelectorAll('.reveal:not(.is-visible)').forEach((row) => row.classList.add('is-visible'))
    })
    return () => cancelAnimationFrame(frame)
  }, [filter])

  return (
    <div className="archive">
      <dl className="categories reveal">
        {categories.map((c) => (
          <div className="categories__item" key={c.id}>
            <dt className="categories__label">
              {c.label} <span className="categories__n">{countOf(c.id)}</span>
            </dt>
            <dd>{c.text}</dd>
          </div>
        ))}
      </dl>

      <p className="ambiti-inline reveal">
        <span className="label">Ambiti</span>
        {ambiti.map((item) => (
          <span className="ambiti-inline__item" key={item}>
            {item}
          </span>
        ))}
      </p>

      {/* Il filtro: bottoni per semantica, collegamenti testuali per aspetto. */}
      <div className="archive__filter reveal" role="group" aria-label="Filtra per categoria">
        <button type="button" className="filter-link" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
          Tutti <span className="filter-link__n">{lavori.length}</span>
        </button>
        {categories.map((c) => (
          <button type="button" key={c.id} className="filter-link" aria-pressed={filter === c.id} onClick={() => setFilter(c.id)}>
            {c.label} <span className="filter-link__n">{countOf(c.id)}</span>
          </button>
        ))}
      </div>

      <ol className="archive-list" role="list" aria-live="polite" ref={listRef}>
        {list.map((w, i) => (
          <li key={w.id} className="archive-row reveal" style={{ '--i': i % 6 }}>
            <RouteLink to={w.path} className="archive-row__link">
              <span className="archive-row__year">{w.year}</span>
              <span className="archive-row__figure">
                <img src={w.cover.mini} alt="" width="96" height="72" loading="lazy" decoding="async" />
              </span>
              <span className="archive-row__body">
                <span className="archive-row__title">{w.title}</span>
                <span className="archive-row__kicker">{w.kicker}</span>
              </span>
              <span className="archive-row__cat">{w.categoryLabel}</span>
              <span className="archive-row__place">{w.place || ''}</span>
            </RouteLink>
          </li>
        ))}
      </ol>
    </div>
  )
}

function LavoriSection() {
  return (
    <section className="section section--surface" id="lavori">
      <div className="container">
        <SectionHead
          id="lavori"
          title="I lavori dello studio, dal 2010 a oggi."
          text="Strutture in cemento armato e acciaio, case ristrutturate con il prima e il dopo, vasche e magazzini per l’agricoltura, depositi e scale per l’industria. Ogni lavoro ha una scheda con le tavole originali e le fotografie, da sfogliare e ingrandire."
        />
        <Archive />
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------------------
   03 Lo Studio
   --------------------------------------------------------------------------- */

function StudioSection() {
  return (
    <section className="section" id="studio">
      <div className="container">
        <SectionHead id="studio" title="Un riferimento tecnico diretto." />

        <div className="studio-layout">
          <aside className="studio__rail">
            {/* La targa vera, quella all'ingresso dello studio: porta già
                marchio, nome e le due righe di specializzazione. */}
            <figure className="studio__plate reveal">
              <Photo
                base="/images/hero-targa"
                ext="png"
                alt="La targa dello studio: Ing. Dario Donelli, ingegneria, architettura, ambiente, progettazione integrale e coordinata"
                width="1489"
                height="967"
              />
              <figcaption className="studio__plate-caption">
                <span className="label">La targa dello studio</span>
                <span>Via Filippo Turati 1, Rivalta sul Mincio</span>
              </figcaption>
            </figure>
            <h3 className="label">Discipline</h3>
            <ol className="rail-list" role="list">
              {disciplines.map((item, i) => (
                <li key={item}>
                  <span className="rail-list__num">{pad2(i + 1)}</span>
                  {item}
                </li>
              ))}
            </ol>
          </aside>

          <div className="studio__main">
            <p className="studio__intro reveal">
              Dietro allo studio c’è una persona sola: chi valuta il progetto è la stessa che poi
              segue il cantiere.
            </p>

            <div className="studio__bio">
              {profile.bio.map((paragraph) => (
                <p className="body-text" key={paragraph.slice(0, 32)}>
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Profilo tecnico impostato come scheda, non come paragrafo. */}
            <dl className="datasheet reveal">
              {profile.credentials.map((row) => (
                <div className="datasheet__row" key={row.label}>
                  <dt className="label">{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
              <div className="datasheet__row">
                <dt className="label">Sede</dt>
                <dd>{studio.address}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* La sede: fotografia larga, ferma, con la didascalia sul filetto. */}
      <div className="container">
        <figure className="studio-photo reveal media-reveal">
          <Photo
            base="/images/studio-esterno"
            alt="L'edificio d'angolo che ospita lo studio, con la vetrina e l'ingresso su strada"
            width="1600"
            height="1067"
          />
          <figcaption className="studio-photo__caption">
            <span className="label">La sede</span>
            <span>
              Via Filippo Turati 1, Rivalta sul Mincio — alle porte del Parco del Mincio, attività in
              tutta la provincia di Mantova.
            </span>
          </figcaption>
        </figure>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------------------
   04 Metodo
   --------------------------------------------------------------------------- */

function MethodSection() {
  return (
    <section className="section section--surface" id="metodo">
      <div className="container">
        <SectionHead
          id="metodo"
          title="Come si sviluppa un incarico."
          text="Quattro fasi, con un punto di verifica alla fine di ciascuna: si procede alla successiva solo quando il quadro è chiaro."
        />
        <ol className="method reveal" role="list">
          {method.map((step) => (
            <li key={step.num} className="method__step">
              <span className="method__num" aria-hidden="true">
                {step.num}
              </span>
              <h3 className="method__title">{step.title}</h3>
              <p className="method__text">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------------------
   05 Contatti
   --------------------------------------------------------------------------- */

function ContactSection() {
  return (
    <section className="section" id="contatti">
      <div className="container">
        <SectionHead
          id="contatti"
          title="Parliamo del progetto."
          text="Il primo contatto serve a capire se e come posso essere utile. Una telefonata o una mail sono sufficienti per fissare un sopralluogo."
        />

        <div className="contact-grid">
          <ul className="contact-list reveal" role="list">
            <li className="contact-item">
              <span className="label">Telefono</span>
              <a className="contact-item__value" href={studio.phoneHref}>
                {studio.phoneDisplay}
              </a>
              <span className="contact-item__note">Risponde direttamente lo studio</span>
            </li>
            <li className="contact-item">
              <span className="label">Email</span>
              <a className="contact-item__value contact-item__value--break" href={studio.emailHref}>
                {studio.email}
              </a>
              <span className="contact-item__note">Descriva l&rsquo;immobile e cosa ha in mente</span>
            </li>
            <li className="contact-item">
              <span className="label">Studio</span>
              <span className="contact-item__value">
                Via Filippo Turati, 1<br />
                46040 Rivalta sul Mincio (MN)
              </span>
              <span className="contact-item__note">All&rsquo;angolo tra via Turati e vicolo Zibramonda</span>
            </li>
          </ul>

          <div className="contact__map-col reveal">
            {/* La carta è virata in bianco e nero dal CSS: resta una mappa
                leggibile, senza colori che stonano con la pagina. */}
            <div className="map">
              <iframe
                className="map__frame"
                src={mapEmbedSrc}
                title="Mappa della posizione dello studio a Rivalta sul Mincio"
                loading="lazy"
              />
            </div>
            <p className="map__links">
              <TextLink href={studio.mapsHref} target="_blank" rel="noreferrer">
                Itinerario su Google Maps
              </TextLink>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------------------
   Footer
   --------------------------------------------------------------------------- */

function Footer() {
  const year = new Date().getFullYear()
  const onNav = useAnchorNav()

  return (
    <footer className="footer">
      <div className="container">
        {/* Quattro colonne uguali, ognuna aperta dalla sua etichetta: le
            righe partono tutte alla stessa altezza, e la riga in fondo
            usa la stessa griglia, così le voci cadono sulle colonne. */}
        <div className="footer__grid">
          <div className="footer__col">
            <h2 className="label">Studio</h2>
            <ul role="list">
              <li className="footer__name">{studio.name}</li>
              <li>Via Filippo Turati 1</li>
              <li>46040 Rivalta sul Mincio (MN)</li>
            </ul>
          </div>

          <div className="footer__col">
            <h2 className="label">Recapiti</h2>
            <ul role="list">
              <li>
                <a href={studio.phoneHref}>{studio.phoneDisplay}</a>
              </li>
              <li>
                <a className="footer__break" href={studio.emailHref}>
                  {studio.email}
                </a>
              </li>
              <li>
                <a href={studio.mapsHref} target="_blank" rel="noreferrer">
                  Itinerario
                </a>
              </li>
            </ul>
          </div>

          <div className="footer__col">
            <h2 className="label">Iscrizione</h2>
            <ul role="list">
              <li>Ordine degli Ingegneri di Mantova</li>
              <li>n. 1495 · dal 24 maggio 2010</li>
              <li>Settore a) civile e ambientale</li>
            </ul>
          </div>

          <div className="footer__col">
            <h2 className="label">Sezioni</h2>
            <ul role="list">
              {sections.map((item) => (
                <li key={item.id}>
                  <a href={`/#${item.id}`} onClick={onNav}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="footer__meta">
          <span>
            © {year} <span className="footer__meta-name">{studio.name}</span>
          </span>
          <span className="footer__meta-wide">Privacy e cookie policy in preparazione</span>
          <span>
            Sito{' '}
            <a href="https://www.albertopecchini.it" target="_blank" rel="noreferrer">
              Alberto Pecchini
            </a>
          </span>
        </div>
      </div>
    </footer>
  )
}

/* ---------------------------------------------------------------------------
   Scheda di un lavoro
   Titolo e sottotitolo, la copertina, la scheda tecnica accanto al testo,
   poi il visualizzatore con tutte le tavole e le fotografie e, sotto,
   l'indice visivo: ogni miniatura apre il suo file nel visualizzatore.
   In fondo, il lavoro precedente e il successivo nell'archivio.
   --------------------------------------------------------------------------- */

function WorkPage({ work }) {
  const { prev, next } = neighbours(work.id)
  const rows = [
    ['Anno', String(work.year)],
    ['Categoria', work.categoryLabel],
    work.client && ['Committente', work.client],
    work.place && ['Luogo', work.place],
    ['Prestazione', work.role],
  ].filter(Boolean)

  return (
    <article className="work">
      <header className="work__head">
        <div className="container">
          <p className="work__crumbs label">
            <RouteLink to="/" hash="lavori">
              Lavori
            </RouteLink>
            <span aria-hidden="true">/</span>
            <span>{work.categoryLabel}</span>
            <span aria-hidden="true">/</span>
            <span>{work.year}</span>
          </p>
          <h1 className="work__title">
            <Split text={work.title} now />
          </h1>
          <p className="work__kicker lead">{work.kicker}</p>
        </div>
      </header>

      <div className="container">
        <figure className="work__cover media-reveal media-reveal--now">
          <ArchiveImage item={work.cover} sizes="(max-width: 860px) 100vw, 72rem" eager />
          <figcaption className="work__cover-caption">
            <span className="label">{work.cover.tag === 'Foto' ? 'Fotografia' : 'Tavola'}</span>
            <span>{work.cover.title}</span>
          </figcaption>
        </figure>

        <div className="work__grid">
          <dl className="datasheet work__sheet reveal">
            {rows.map(([label, value]) => (
              <div className="datasheet__row" key={label}>
                <dt className="label">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <div className="work__text">
            {work.text.map((paragraph) => (
              <p className="body-text" key={paragraph.slice(0, 40)}>
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="container">
        <div className="drawings work__viewer">
          <div className="drawings__head reveal">
            <span className="label">Tavole e fotografie</span>
            <h2 className="drawings__title">
              {work.counts.pages > 0 ? 'Le tavole originali e le fotografie, da sfogliare qui.' : 'Le fotografie, da sfogliare qui.'}
            </h2>
            <p className="body-text">
              {work.counts.pages > 0 && 'Le tavole sono i PDF così come sono stati stampati, con i dati personali del cartiglio oscurati: si ingrandiscono fino al singolo ferro e alla singola quota. '}
              Le fotografie si ingrandiscono allo stesso modo. Ctrl e rotella o due dita per avvicinarsi, frecce per cambiare file.
            </p>
          </div>
          <SheetViewer sheets={work.items} label={`Tavole e fotografie: ${work.title}`} />
        </div>

        <nav className="work__nav reveal" aria-label="Altri lavori">
          {prev ? (
            <RouteLink to={prev.path} className="work__nav-link">
              <span className="label">Precedente · {prev.year}</span>
              <span className="work__nav-title">{prev.title}</span>
            </RouteLink>
          ) : (
            <span />
          )}
          <RouteLink to="/" hash="lavori" className="work__nav-all text-link">
            Tutti i lavori
          </RouteLink>
          {next ? (
            <RouteLink to={next.path} className="work__nav-link work__nav-link--next">
              <span className="label">Successivo · {next.year}</span>
              <span className="work__nav-title">{next.title}</span>
            </RouteLink>
          ) : (
            <span />
          )}
        </nav>
      </div>
    </article>
  )
}

function MissingPage({ path }) {
  return (
    <section className="work work--missing">
      <div className="container">
        <p className="label">Pagina non trovata</p>
        <h1 className="work__title">Qui non c’è nulla.</h1>
        <p className="lead">
          L’indirizzo <code>{path}</code> non corrisponde a nessuna pagina del sito.
        </p>
        <p className="work__missing-links">
          <RouteLink to="/" className="text-link">
            Torna all’inizio
          </RouteLink>
          <RouteLink to="/" hash="lavori" className="text-link">
            Tutti i lavori
          </RouteLink>
        </p>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------------------
   Composizione
   --------------------------------------------------------------------------- */

const legacyPaths = {
  '/servizi': 'servizi',
  '/progetti': 'lavori',
  '/studio': 'studio',
  '/contatti': 'contatti',
}

const legacyHashes = { progetti: 'lavori', territorio: 'lavori', ambiti: 'lavori' }

function Home() {
  return (
    <>
      <Intro />
      <ServicesSection />
      <LavoriSection />
      <StudioSection />
      <MethodSection />
      <ContactSection />
    </>
  )
}

function Layout({ url }) {
  const [path, setPath] = useState(() => resolve(url).path)
  const pendingHash = useRef(null)
  const page = resolve(path)

  useSmoothScroll()
  useReveal(path)

  const navigate = useCallback((to, hash = null) => {
    const target = resolve(to).path
    pendingHash.current = hash
    window.history.pushState(null, '', hash ? `${target}#${hash}` : target)
    setPath(target)
  }, [])

  // Il tasto indietro: la pagina torna quella dell'indirizzo.
  useEffect(() => {
    const onPop = () => {
      pendingHash.current = window.location.hash.slice(1) || null
      setPath(resolve(window.location.pathname).path)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // Primo arrivo: gli indirizzi della versione precedente del sito restano
  // vivi, e un'ancora nell'indirizzo porta alla sua sezione.
  useEffect(() => {
    const legacy = legacyPaths[window.location.pathname.replace(/\/$/, '')]
    const hash = window.location.hash.slice(1)
    const target = legacy || legacyHashes[hash] || hash
    if (legacy) window.history.replaceState(null, '', `/#${legacy}`)
    if (!target) return
    const frame = window.requestAnimationFrame(() => {
      if (document.getElementById(target)) scrollToTarget(target, { immediate: true })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  // A ogni cambio di pagina: titolo della scheda del browser e posizione.
  // Si va in cima, o alla sezione chiesta (dal footer di una scheda).
  const first = useRef(true)
  useEffect(() => {
    document.title = page.title
    if (first.current) {
      first.current = false
      return
    }
    const hash = pendingHash.current
    pendingHash.current = null
    const frame = window.requestAnimationFrame(() => {
      if (hash && document.getElementById(hash)) scrollToTarget(hash, { immediate: true })
      else scrollToTarget(0, { immediate: true })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [path, page.title])

  return (
    <RouterContext.Provider value={{ path, navigate }}>
      <a className="skip-link" href="#contenuto">
        Salta al contenuto
      </a>

      <Header />

      <main className="site-main" id="contenuto">
        {page.kind === 'work' ? <WorkPage work={page.work} key={page.work.id} /> : page.kind === 'missing' ? <MissingPage path={page.path} /> : <Home key="home" />}
      </main>

      <Footer />
    </RouterContext.Provider>
  )
}

/**
 * @param {{ url?: string }} props `url`: percorso della pagina da mostrare,
 *   quello dell'indirizzo nel browser o quello chiesto dal prerender
 */
export default function App({ url = '/' }) {
  return <Layout url={url} />
}
