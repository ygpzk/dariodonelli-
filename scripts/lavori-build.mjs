// Prepara i materiali dei lavori per il sito.
//
//   node scripts/lavori-build.mjs <cartella-sorgente> [--contact <cartella>]
//
// La cartella sorgente è l'archivio consegnato dallo studio («Progetti x
// Sito»): una sottocartella per lavoro, dentro fotografie (jpg/png) e tavole
// (pdf). Quale sottocartella corrisponde a quale lavoro lo dice
// scripts/lavori-sources.json; scripts/lavori-fixes.json elenca le
// correzioni (file da saltare, foto da raddrizzare o rinominare) e le ZONE DA
// OSCURARE: dati sensibili nei cartigli delle tavole (committenti, indirizzi,
// codici fiscali, partite IVA, telefoni, riferimenti catastali, firme) e nelle
// foto (targhe, numeri civici, volti). Lo script:
//
// - per ogni PDF incorpora le sfumature DENTRO il file (pdf-lib): la zona
//   viene disegnata da pdf.js, resa illeggibile e rimessa sulla pagina come
//   immagine; poi il PDF, rinominato tavola-<n>.pdf, va in public/lavori/<id>/
//   (il visualizzatore lo legge direttamente, pagina per pagina) e per ogni
//   pagina si salvano due anteprime webp dal PDF già oscurato:
//   tavola-<n>-p<N>.webp (1200 px) e tavola-<n>-p<N>-mini.webp (320 px);
// - riduce ogni fotografia a 1800 px sul lato lungo (<nome>.webp) e a 480 px
//   (<nome>-mini.webp), raddrizzata secondo l'EXIF, con le zone sfumate e
//   SENZA metadati: le foto dei telefoni portano la posizione GPS;
// - scrive src/lavori.data.js con l'elenco dei file e le loro misure. I
//   testi (titoli, descrizioni, didascalie) stanno a parte, in
//   src/lavori.js, e non vengono toccati.
//
// Con --contact <cartella> produce anche un foglio di contatto per lavoro
// (tutte le immagini in piccolo, con il nome del file): serve a chi scrive
// i testi, non finisce nel sito.
//
// I nomi dei file vengono normalizzati (minuscole, trattini) perché gli
// originali hanno spazi, maiuscole e caratteri che negli URL danno fastidio;
// le tavole prendono un nome neutro perché quello originale spesso contiene
// il nome del committente.
//
// Limite da sapere: nei PDF il testo sotto la sfumatura resta nel file. Nelle
// tavole da CAD è quasi sempre geometria (contorni delle lettere), ma nei PDF
// con testo vero un programma potrebbe ancora estrarlo. Se serve una
// rimozione certa, la via è rasterizzare la pagina.

import { createRequire } from 'node:module'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { basename, extname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import sharp from 'sharp'
import { PDFDocument, PDFName } from 'pdf-lib'

const require = createRequire(import.meta.url)
const root = resolve(fileURLToPath(import.meta.url), '../..')

const args = process.argv.slice(2)
const src = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--contact')
const contactDir = args.includes('--contact') ? args[args.indexOf('--contact') + 1] : null
if (!src) {
  console.error('uso: node scripts/lavori-build.mjs <cartella-sorgente> [--contact <cartella>]')
  process.exit(1)
}

const sources = JSON.parse(await readFile(join(root, 'scripts/lavori-sources.json'), 'utf8'))
delete sources._commento
const fixes = JSON.parse(await readFile(join(root, 'scripts/lavori-fixes.json'), 'utf8'))

const PHOTO_PX = 1800 // lato lungo della foto nel visualizzatore
const MINI_PX = 480 // lato lungo nelle griglie e negli elenchi
const PAGE_PX = 1200 // larghezza dell'anteprima di una pagina PDF
const PAGE_MINI_PX = 320
const REDACT_PX_MM = 6 // risoluzione a cui si disegna la zona da oscurare
const OUT = join(root, 'public/lavori')
const PT_PER_MM = 72 / 25.4

const slug = (name) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const isPhoto = (f) => /\.(jpe?g|png)$/i.test(f)
const isPdf = (f) => /\.pdf$/i.test(f)

/* pdf.js in Node: la build «legacy» e, come superficie di disegno,
   @napi-rs/canvas, che pdf.js trova da solo. Il percorso dei font
   standard vuole la barra finale, anche su Windows. */
const pdfjs = await import(pathToFileURL(require.resolve('pdfjs-dist/legacy/build/pdf.mjs')).href)
const standardFontDataUrl = join(require.resolve('pdfjs-dist/package.json'), '../standard_fonts').replaceAll('\\', '/') + '/'
const openPdf = (data) => pdfjs.getDocument({ data: new Uint8Array(data), standardFontDataUrl, isEvalSupported: false }).promise

/** Rende illeggibile un'immagine: mosaico grosso e poi sfumatura. */
async function scramble(png, w, h) {
  const small = Math.max(2, Math.round(w / 14))
  const buf = await sharp(png).resize({ width: small, kernel: 'cubic' }).toBuffer()
  return sharp(buf).resize({ width: w, height: h, kernel: 'cubic', fit: 'fill' }).blur(3).png().toBuffer()
}

/**
 * Incorpora le sfumature nel PDF. Le zone sono in millimetri del foglio
 * come si vede (il viewport di pdf.js tiene conto della rotazione); ogni
 * zona viene disegnata da pdf.js nell'orientamento interno della pagina,
 * resa illeggibile e rimessa con pdf-lib nello stesso punto.
 * @returns {Promise<Uint8Array>} i byte del PDF oscurato
 */
async function redactPdf(bytes, zones) {
  const doc = await openPdf(bytes)
  const out = await PDFDocument.load(bytes, { ignoreEncryption: true })
  for (const [pageNo, rects] of Object.entries(zones)) {
    const n = Number(pageNo)
    const page = await doc.getPage(n)
    const shown = page.getViewport({ scale: 1 }) // come si vede: ruotata, in punti
    const Hmm = shown.height / PT_PER_MM
    const raw = page.getViewport({ scale: REDACT_PX_MM / PT_PER_MM, rotation: 0 }) // orientamento interno
    const target = out.getPage(n - 1)
    // timbri e firme sono annotazioni, che stanno sopra a tutto: via
    target.node.delete(PDFName.of('Annots'))
    for (const r of rects) {
      const [x, y0, w, h, from] = r
      const y = from === 'bl' ? Hmm - y0 - h : y0
      // angoli della zona nel foglio visto → spazio utente del PDF
      const corners = [
        [x, y],
        [x + w, y],
        [x, y + h],
        [x + w, y + h],
      ].map(([mx, my]) => shown.convertToPdfPoint(mx * PT_PER_MM, my * PT_PER_MM))
      const ux0 = Math.min(...corners.map((c) => c[0]))
      const ux1 = Math.max(...corners.map((c) => c[0]))
      const uy0 = Math.min(...corners.map((c) => c[1]))
      const uy1 = Math.max(...corners.map((c) => c[1]))
      // la stessa zona sul canvas non ruotato
      const [cx0, cy0] = raw.convertToViewportPoint(ux0, uy1)
      const [cx1, cy1] = raw.convertToViewportPoint(ux1, uy0)
      const cw = Math.max(2, Math.round(cx1 - cx0))
      const ch = Math.max(2, Math.round(cy1 - cy0))
      const { canvas } = doc.canvasFactory.create(cw, ch)
      await page.render({ canvas, viewport: raw, transform: [1, 0, 0, 1, -cx0, -cy0] }).promise
      const png = await scramble(canvas.toBuffer('image/png'), cw, ch)
      const img = await out.embedPng(png)
      target.drawImage(img, { x: ux0, y: uy0, width: ux1 - ux0, height: uy1 - uy0 })
    }
    page.cleanup()
  }
  await doc.cleanup()
  return out.save()
}

/** Anteprime delle pagine di un PDF (già oscurato). */
async function renderPages(bytes, outDir, base) {
  const doc = await openPdf(bytes)
  const pages = []
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n)
    const v1 = page.getViewport({ scale: 1 })
    const viewport = page.getViewport({ scale: PAGE_PX / v1.width })
    const w = Math.round(viewport.width)
    const h = Math.round(viewport.height)
    const { canvas } = doc.canvasFactory.create(w, h)
    await page.render({ canvas, viewport }).promise
    const png = canvas.toBuffer('image/png')
    const name = `${base}-p${n}`
    await sharp(png).webp({ quality: 82 }).toFile(join(outDir, `${name}.webp`))
    await sharp(png).resize({ width: PAGE_MINI_PX }).webp({ quality: 78 }).toFile(join(outDir, `${name}-mini.webp`))
    // misure in punti PDF (1/72 di pollice): da qui il formato carta
    pages.push({ n, w: Math.round(v1.width), h: Math.round(v1.height), thumb: `${name}.webp`, mini: `${name}-mini.webp` })
    page.cleanup()
  }
  await doc.cleanup()
  return pages
}

/** Formato carta ISO più vicino, dalle misure in punti (tolleranza 3%). */
function paperOf(w, h) {
  const mm = [w, h].map((p) => (p / 72) * 25.4).sort((a, b) => a - b)
  const sizes = { A4: [210, 297], A3: [297, 420], A2: [420, 594], A1: [594, 841], A0: [841, 1189] }
  for (const [name, [a, b]] of Object.entries(sizes)) {
    if (Math.abs(mm[0] - a) / a < 0.03 && Math.abs(mm[1] - b) / b < 0.03) return name
  }
  // formati fuori serie (rotoli): larghezza × altezza in centimetri
  return `${Math.round(mm[1] / 10)}×${Math.round(mm[0] / 10)} cm`
}

async function processPhoto(file, outDir, base, fix = {}) {
  // rotate() senza argomenti raddrizza secondo l'EXIF; i metadati non vengono
  // riscritti, quindi GPS, data e modello del telefono restano fuori dal sito.
  // Un'eventuale rotazione in più (fix.rotate) corregge gli originali coricati.
  let img = fix.rotate ? sharp(file).rotate().rotate(fix.rotate) : sharp(file).rotate()
  if (fix.blur?.length) {
    // le zone si sfumano sull'immagine raddrizzata, a piena risoluzione
    const full = await img.toBuffer()
    const { width: W, height: H } = await sharp(full).metadata()
    const patches = []
    for (const [fx, fy, fw, fh] of fix.blur) {
      const left = Math.max(0, Math.round(fx * W))
      const top = Math.max(0, Math.round(fy * H))
      const width = Math.min(W - left, Math.round(fw * W))
      const height = Math.min(H - top, Math.round(fh * H))
      const region = await sharp(full).extract({ left, top, width, height }).png().toBuffer()
      patches.push({ input: await scramble(region, width, height), left, top })
    }
    img = sharp(await sharp(full).composite(patches).toBuffer())
  }
  const big = await img
    .clone()
    .resize({ width: PHOTO_PX, height: PHOTO_PX, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 76 })
    .toFile(join(outDir, `${base}.webp`))
  await img
    .clone()
    .resize({ width: MINI_PX, height: MINI_PX, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 74 })
    .toFile(join(outDir, `${base}-mini.webp`))
  return { w: big.width, h: big.height }
}

/** Foglio di contatto: tutte le anteprime del lavoro, con il nome del file. */
async function contactSheet(work, names, outFile) {
  const cell = 300
  const label = 28
  const cols = 4
  const items = [
    ...work.sheets.flatMap((s) => s.pages.map((p) => ({ file: join(OUT, work.id, p.mini), name: `${names.get(s.file)} · p.${p.n}` }))),
    ...work.photos.map((p) => ({ file: join(OUT, work.id, p.mini), name: names.get(p.file) })),
  ]
  const rows = Math.ceil(items.length / cols)
  const W = cols * cell
  const H = rows * (cell + label) + 40
  const composites = []
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  const texts = [`<text x="8" y="26" font-size="20" font-family="sans-serif" font-weight="bold">${esc(work.id)} — ${items.length} file</text>`]
  for (let i = 0; i < items.length; i++) {
    const x = (i % cols) * cell
    const y = 40 + Math.floor(i / cols) * (cell + label)
    const buf = await sharp(items[i].file).resize({ width: cell - 8, height: cell - 8, fit: 'inside' }).toBuffer()
    const m = await sharp(buf).metadata()
    composites.push({ input: buf, left: x + Math.round((cell - m.width) / 2), top: y + Math.round((cell - m.height) / 2) })
    texts.push(`<text x="${x + 6}" y="${y + cell + 19}" font-size="14" font-family="sans-serif">${String(i + 1).padStart(2, '0')} ${esc(items[i].name)}</text>`)
  }
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${texts.join('')}</svg>`)
  await sharp({ create: { width: W, height: H, channels: 3, background: '#ffffff' } })
    .composite([...composites, { input: svg, left: 0, top: 0 }])
    .jpeg({ quality: 80 })
    .toFile(outFile)
}

const works = []
let redacted = 0
const folders = (await readdir(src, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name)
for (const folder of folders) {
  const id = sources[folder]
  if (!id) {
    console.warn(`! cartella senza identificativo in lavori-sources.json: ${folder}`)
    continue
  }
  const dir = join(src, folder)
  const outDir = join(OUT, id)
  await mkdir(outDir, { recursive: true })
  const files = (await readdir(dir)).sort((a, b) => a.localeCompare(b, 'it'))
  const work = { id, sheets: [], photos: [] }
  const names = new Map() // file pubblicato → nome originale (solo per il foglio di contatto)
  const used = new Set()
  const unique = (base) => {
    let b = base
    let k = 2
    while (used.has(b)) b = `${base}-${k++}`
    used.add(b)
    return b
  }
  let sheetNo = 0
  for (const f of files) {
    const fix = fixes[`${folder}/${f}`] || {}
    if (fix.skip) {
      console.log(`  ${id}: salto ${f} (${fix.perche || 'vedi lavori-fixes.json'})`)
      continue
    }
    if (isPdf(f)) {
      const base = unique(`tavola-${++sheetNo}`)
      process.stdout.write(`  ${id}: ${f} → ${base}.pdf … `)
      let bytes = await readFile(join(dir, f))
      if (fix.redact) {
        bytes = await redactPdf(bytes, fix.redact)
        redacted += Object.values(fix.redact).reduce((n, r) => n + r.length, 0)
      }
      await writeFile(join(outDir, `${base}.pdf`), bytes)
      const pages = await renderPages(bytes, outDir, base)
      work.sheets.push({ file: `${base}.pdf`, paper: paperOf(pages[0].w, pages[0].h), pages })
      names.set(`${base}.pdf`, f)
      console.log(`${pages.length} pagine, ${work.sheets.at(-1).paper}${fix.redact ? ', oscurato' : ''}`)
    } else if (isPhoto(f)) {
      const base = unique(fix.name ? slug(fix.name) : slug(basename(f, extname(f))))
      const m = await processPhoto(join(dir, f), outDir, base, fix)
      work.photos.push({ file: `${base}.webp`, mini: `${base}-mini.webp`, w: m.w, h: m.h })
      names.set(`${base}.webp`, f)
      if (fix.blur) console.log(`  ${id}: ${f} → ${base}.webp, sfumato (${fix.perche || ''})`)
    }
  }
  console.log(`${id}: ${work.sheets.length} tavole, ${work.photos.length} foto`)
  works.push(work)
  if (contactDir) {
    await mkdir(contactDir, { recursive: true })
    await contactSheet(work, names, join(contactDir, `${id}.jpg`))
  }
}

works.sort((a, b) => a.id.localeCompare(b.id))
const header = `/**
 * GENERATO da scripts/lavori-build.mjs: non modificare a mano.
 * Per ogni lavoro (chiave = identificativo, vedi scripts/lavori-sources.json)
 * i file pubblicati in public/lavori/<id>/:
 * - sheets: le tavole PDF (tavola-<n>.pdf, con le zone sensibili già
 *   oscurate), con formato carta e, per ogni pagina, le misure in punti e
 *   le due anteprime webp;
 * - photos: le fotografie, con le misure del file webp grande.
 * I testi stanno in src/lavori.js.
 */
export default `
const data = Object.fromEntries(works.map((w) => [w.id, { sheets: w.sheets, photos: w.photos }]))
await writeFile(join(root, 'src/lavori.data.js'), header + JSON.stringify(data, null, 2) + '\n', 'utf8')
console.log(`\n${works.length} lavori → src/lavori.data.js (${redacted} zone oscurate nei PDF)`)
