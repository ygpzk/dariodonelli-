import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

/**
 * Prerendering: al termine della build ogni pagina del sito viene
 * renderizzata in HTML statico. Senza, il file servito contiene solo il
 * contenitore vuoto: chi arriva senza JavaScript — e parte dei crawler —
 * riceve una pagina muta. Con l'HTML già dentro, il contenuto esiste al
 * primo byte; React poi ci si aggancia sopra con l'hydration.
 *
 * Le pagine sono quelle di src/routes.js: la principale, scritta dentro
 * dist/index.html, e una per ogni lavoro dell'archivio, scritta in
 * dist/lavori/<id>/index.html con titolo, descrizione e anteprima di
 * condivisione propri. Su Vercel il file statico vince sul rewrite verso
 * index.html, quindi /lavori/<id> arriva già completo; in più si scrivono
 * sitemap.xml e robots.txt.
 *
 * Serve una build SSR dei sorgenti, perché il bundle del browser non è
 * eseguibile in Node: la produce `vite build --mode ssr`, che lo script
 * `build` lancia per primo.
 */
export default function prerender() {
  let isSsrBuild = false

  return {
    name: 'prerender',
    apply: 'build',

    configResolved(config) {
      // Nella passata SSR non si prerenderizza nulla: si prepara solo l'entry.
      isSsrBuild = config.mode === 'ssr'
    },

    closeBundle: {
      sequential: true,
      order: 'post',
      async handler() {
        if (isSsrBuild) return

        const root = process.cwd()
        const htmlPath = resolve(root, 'dist/index.html')
        const entry = resolve(root, 'dist-ssr/entry-server.js')

        if (!existsSync(entry)) {
          this.error(
            'prerender: manca dist-ssr/entry-server.js. Lancia `npm run build`, ' +
              'che esegue prima la build SSR.',
          )
        }

        const { render, routes } = await import(`file://${entry}`)
        const template = await readFile(htmlPath, 'utf8')
        if (!template.includes('<div id="root"></div>')) {
          this.error('prerender: segnaposto #root non trovato in dist/index.html')
        }

        const site = template.match(/property="og:url" content="([^"]+)\/"/)?.[1] || ''
        let total = 0
        for (const route of routes) {
          const { html, head } = render(route)
          const page = withHead(template, head, site).replace('<div id="root"></div>', `<div id="root">${html}</div>`)
          const out = route === '/' ? htmlPath : resolve(root, `dist${route}/index.html`)
          await mkdir(dirname(out), { recursive: true })
          await writeFile(out, page, 'utf8')
          total += Buffer.byteLength(html, 'utf8')
        }
        this.info(`prerender: ${routes.length} pagine, ${(total / 1024).toFixed(0)} kB di HTML`)

        const urls = routes.map((r) => `  <url><loc>${site}${r === '/' ? '/' : r}</loc></url>`).join('\n')
        await writeFile(
          resolve(root, 'dist/sitemap.xml'),
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
          'utf8',
        )
        await writeFile(resolve(root, 'dist/robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${site}/sitemap.xml\n`, 'utf8')
      },
    },
  }
}

const escapeAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

/** Sostituisce nel modello i tag di testa con quelli della pagina. */
function withHead(template, head, site) {
  const url = `${site}${head.path === '/' ? '/' : head.path}`
  return template
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeAttr(head.title)}</title>`)
    .replace(/(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${escapeAttr(head.description)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${escapeAttr(head.title)}$2`)
    .replace(/(<meta\s+property="og:description"\s+content=")[^"]*(")/, `$1${escapeAttr(head.description)}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${head.image}$2`)
    .replace('</head>', `    <link rel="canonical" href="${url}" />\n  </head>`)
}
