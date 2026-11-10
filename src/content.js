/**
 * Contenuti del sito.
 *
 * Tutti i testi derivano dai materiali già presenti nell'implementazione
 * precedente e dal documento di revisione dello studio: non sono state
 * introdotte specializzazioni, certificazioni, anni di esperienza, numeri
 * o referenze non verificate.
 */

/**
 * Indirizzo pubblico del sito, senza barra finale: alimenta i tag di
 * condivisione, i canonical e la sitemap generati dal prerender. Quando
 * arriverà il dominio definitivo si cambia qui (e in index.html, che vale
 * in sviluppo).
 */
export const siteUrl = 'https://dariodonelli.vercel.app'

export const studio = {
  /* Sulla pagina il nome compare sempre in maiuscolo, come sulla targa:
     lo fa il CSS (text-transform), così etichette, alt e lettori di
     schermo ricevono il nome normale e non lo compitano lettera per
     lettera. */
  name: 'Ing. Dario Donelli',
  role: 'Ingegnere',
  address: 'Via Filippo Turati, 1, 46040 Rivalta sul Mincio MN',
  phoneHref: 'tel:+393384007913',
  phoneDisplay: '+39 338 400 7913',
  email: 'ing.dario.donelli@hotmail.it',
  emailHref: 'mailto:ing.dario.donelli@hotmail.it',
  /* Si punta alle coordinate e non all'indirizzo: la ricerca testuale su
     Rivalta sul Mincio non porta sempre al civico giusto. */
  mapsHref: 'https://www.google.com/maps/search/?api=1&query=45.180182%2C10.677598',
  /** Coordinate dello studio: alimentano il riquadro della mappa. */
  geo: { lat: 45.180182, lng: 10.677598 },
  /** Le due righe incise sulla targa dello studio. */
  plate: ['Ingegneria · Architettura · Ambiente', 'Progettazione integrale e coordinata'],
}

/**
 * Sorgente del riquadro cartografico dei contatti: Google Maps, come
 * chiesto dallo studio. È l'embed pubblico senza chiave API, centrato sulle
 * coordinate dello studio con lo zoom sulla via; il CSS lo vira in bianco
 * e nero, così niente colori che stonano con la pagina.
 * Nota: l'embed di Google può installare cookie di terze parti; quando
 * arriverà la cookie policy va citato lì.
 */
export const mapEmbedSrc = (() => {
  const { lat, lng } = studio.geo
  return `https://maps.google.com/maps?q=${lat},${lng}&z=17&hl=it&output=embed`
})()

/**
 * Profilo professionale. I dati provengono dall'iscrizione all'albo:
 * laurea in Ingegneria Edile-Architettura (Bologna, 2008), abilitazione
 * 2009, iscrizione all'Ordine di Mantova n. 1495 dal 24/05/2010,
 * settore a) civile e ambientale.
 */
export const profile = {
  bio: [
    'Mi sono laureato in Ingegneria Edile-Architettura all’Università di Bologna nel 2008, ho conseguito l’abilitazione alla professione l’anno successivo e dal 2010 sono iscritto all’Ordine degli Ingegneri della Provincia di Mantova, settore civile e ambientale.',
    'È una formazione che unisce due sguardi che spesso restano separati: quello dell’architettura, attento allo spazio e a come viene vissuto, e quello dell’ingegneria, che deve rispondere della struttura e dei numeri. Progetto tenendoli insieme, perché un intervento riuscito è quello in cui la soluzione tecnica e l’uso quotidiano dell’edificio non si contraddicono.',
    'Lavoro come libero professionista sul territorio mantovano, con studio a Rivalta sul Mincio. Seguo personalmente ogni incarico dalla prima valutazione fino alla chiusura del cantiere: chi mi affida un lavoro parla sempre con la stessa persona, senza passaggi intermedi.',
    'Questo significa progettazione integrale e coordinata: architettura, strutture, impianti, prevenzione incendi, sicurezza in cantiere ed energia non sono pratiche separate da mettere in fila, ma discipline che vengono tenute insieme fin dall’inizio. È il modo più efficace per evitare che un problema emerga quando è ormai costoso risolverlo.',
  ],
  /** Scheda sintetica accanto alla biografia. */
  credentials: [
    { label: 'Titolo', value: 'Ingegneria Edile-Architettura' },
    { label: 'Ateneo', value: 'Università di Bologna, 2008' },
    { label: 'Abilitazione', value: 'Bologna, 2009' },
    { label: 'Ordine', value: 'Ingegneri di Mantova, n. 1495' },
    { label: 'Iscritto dal', value: '24 maggio 2010' },
    { label: 'Settore', value: 'a) Civile e ambientale' },
  ],
}

/**
 * Sezioni della pagina. Il sito è una pagina sola: ogni voce punta a una
 * sezione tramite ancora; l'elenco alimenta i numeri delle intestazioni e
 * i collegamenti del footer.
 */
export const sections = [
  { id: 'servizi', num: '01', label: 'Servizi' },
  { id: 'lavori', num: '02', label: 'Lavori' },
  { id: 'studio', num: '03', label: 'Lo Studio' },
  { id: 'metodo', num: '04', label: 'Metodo' },
  { id: 'contatti', num: '05', label: 'Contatti' },
]

/**
 * Riga informativa sotto la testata. L'anno è quello corrente: la riga
 * si legge come la data di una tavola, non come una scadenza.
 */
export const infoline = ['Rivalta sul Mincio', 'MN', String(new Date().getFullYear()), 'Ordine Ingegneri n. 1495']

/**
 * Tre macro-aree. Ognuna spiega cosa comprende, a chi serve e che problema
 * risolve, con un elenco delle prestazioni effettivamente offerte.
 * L'immagine è un file dell'archivio dei lavori (src/lavori.js): il lavoro
 * e la voce (una fotografia o una pagina di tavola) che la rappresenta.
 */
export const serviceAreas = [
  {
    id: 'progettazione',
    num: '01',
    cover: { work: 'casa-parolini', item: 'rendering' },
    title: 'Progettazione e pratiche edilizie',
    text: 'Dalla prima verifica di fattibilità fino al progetto esecutivo e alle autorizzazioni. Utile a chi deve costruire, ampliare o ristrutturare e ha bisogno di capire in anticipo cosa è possibile fare, con quali costi e con quali tempi.',
    items: [
      'Studi di fattibilità',
      'Progettazione preliminare, definitiva ed esecutiva',
      'Rendering e fotoinserimenti',
      'Pratiche catastali',
      'Pratiche antincendio',
    ],
  },
  {
    id: 'strutture',
    num: '02',
    cover: { work: 'vasca-salizzole', item: '22122010151' },
    title: 'Strutture e sicurezza sismica',
    text: 'Verifica e adeguamento di edifici esistenti, progettazione strutturale di nuove opere. Risponde a chi possiede un immobile datato e vuole sapere come si comporta in caso di sisma, o deve intervenire su un edificio vincolato.',
    items: [
      'Valutazione della sicurezza sismica',
      'Miglioramento e adeguamento sismico',
      'Riabilitazione strutturale e restauro',
      'Strutture antisismiche',
    ],
  },
  {
    id: 'cantiere',
    num: '03',
    cover: { work: 'passerella-volta-mantovana', item: 'img-20200312-133215' },
    title: 'Direzione lavori e consulenza',
    text: 'Presidio del cantiere e verifica di quanto viene realizzato rispetto al progetto. Serve a chi vuole un riferimento tecnico unico che segua l’intervento, controlli le lavorazioni e gestisca il rapporto con le imprese.',
    items: [
      'Direzione lavori e direzione operativa',
      'Coordinamento della sicurezza',
      'Riqualificazione e certificazione energetica',
      'Perizie, stime e consulenze tecniche',
    ],
  },
]

/** Elenco completo delle prestazioni. */
export const serviceIndex = [
  'Studi di fattibilità e progettazione preliminare',
  'Rendering e fotoinserimenti',
  'Progettazione definitiva',
  'Progettazione esecutiva',
  'Miglioramento e adeguamento sismico di edifici esistenti',
  'Riqualificazione e certificazione energetica',
  'Direzione lavori',
  'Direzione operativa',
  'Sicurezza',
  'Pratiche antincendio',
  'Pratiche catastali',
  'Perizie, stime e consulenze tecniche',
]

/**
 * Ambiti di intervento: l'elenco indicato dallo studio nel documento di
 * revisione, nell'ordine in cui è stato consegnato. Compare in testa
 * all'archivio dei lavori.
 */
export const ambiti = [
  'Nuove costruzioni',
  'Riqualificazione energetica',
  'Opere pubbliche',
  'Opere strutturali',
  'Opere industriali',
  'Ristrutturazione edilizia',
  'Restauro e risanamento conservativo',
]

/** Le quattro fasi del metodo di lavoro. */
export const method = [
  {
    num: '01',
    title: 'Sopralluogo',
    text: 'Verifica dello stato dei luoghi, della documentazione disponibile e dei vincoli che riguardano l’immobile.',
  },
  {
    num: '02',
    title: 'Fattibilità',
    text: 'Valutazione di cosa è realizzabile, con un quadro chiaro di tempi, procedure e ordine di spesa.',
  },
  {
    num: '03',
    title: 'Progetto',
    text: 'Sviluppo del progetto nei diversi livelli e predisposizione delle pratiche verso gli enti.',
  },
  {
    num: '04',
    title: 'Cantiere',
    text: 'Direzione lavori, controllo delle lavorazioni e rapporto diretto con le imprese fino alla chiusura.',
  },
]

export const disciplines = [
  'Progettazione architettonica e strutturale',
  'Valutazione della sicurezza sismica',
  'Riabilitazione strutturale e restauro',
  'Strutture antisismiche',
  'Energia',
  'Impianti',
  'Urbanistica',
  'Infrastrutture',
  'Idraulica e ambiente',
]
