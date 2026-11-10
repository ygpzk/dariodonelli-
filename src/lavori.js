/**
 * Archivio dei lavori.
 *
 * Qui stanno i TESTI: categorie, titoli, descrizioni, didascalie. I file
 * (tavole PDF, fotografie, loro misure) arrivano da ./lavori.data.js, che
 * lo script scripts/lavori-build.mjs genera dall'archivio consegnato dallo
 * studio. Le due parti si incontrano in fondo a questo modulo, in `lavori`.
 *
 * Fonte dei dati: il documento «Elenco lavori per sito» dello studio
 * (originali/Elenco lavori per sito.docx), che per ogni lavoro dà anno,
 * committente, descrizione in una riga e categoria; le cartelle
 * dell'archivio, che aggiungono luoghi e date; i materiali stessi (le
 * tavole e le fotografie, guardate una per una). Nulla di quanto scritto
 * va oltre ciò che si vede nei materiali o sta nell'elenco: niente
 * importi, superfici, ruoli o date non documentati.
 *
 * Nomi: le imprese, gli enti e le società compaiono con il loro nome; dei
 * committenti privati resta il solo cognome («Casa Rocca», «Piscina
 * Fermi»), com'è d'uso nelle pubblicazioni di architettura. L'elenco dello
 * studio riporta anche i nomi di battesimo: se lo studio preferisce
 * toglierli del tutto, basta cambiare i titoli qui.
 *
 * Come aggiungere un lavoro: una cartella nell'archivio sorgente, la sua
 * riga in scripts/lavori-sources.json, `npm run lavori`, poi la scheda qui
 * sotto. Le chiavi di `sheets` e `photos` sono i nomi dei file normalizzati
 * (senza estensione) come compaiono in lavori.data.js; l'ordine delle
 * fotografie in `photos` è l'ordine di pubblicazione, e la prima è la
 * copertina se `cover` non dice altro. Le foto non elencate vanno in coda,
 * con una didascalia generica.
 */

import data from './lavori.data.js'

/** Le quattro categorie dell'elenco dello studio, nell'ordine dell'elenco. */
export const categories = [
  {
    id: 'strutture',
    label: 'Strutture',
    text: 'Calcolo e disegno esecutivo delle strutture: cemento armato, acciaio, interventi su edifici esistenti e dopo il sisma, opere speciali come piscine e passerelle.',
  },
  {
    id: 'edilizia',
    label: 'Edilizia',
    text: 'Abitazioni nuove e ristrutturate, condomini, spazi sportivi e pubblici: dal rilievo al cantiere, spesso con il prima e il dopo fotografati.',
  },
  {
    id: 'agricoltura',
    label: 'Agricoltura',
    text: 'Vasche, trincee, magazzini e stalle: strutture in cemento armato al servizio delle aziende agricole della pianura mantovana e veronese.',
  },
  {
    id: 'industria',
    label: 'Industria',
    text: 'Depositi e capannoni in acciaio, scale metalliche, strutture di servizio per impianti e attività produttive, anche a supporto di progetti d’autore.',
  },
]

/** Etichette della scheda tecnica di ogni lavoro. */
const ROLE = {
  strutturale: 'Progetto strutturale',
  strutturaleEsecutivo: 'Progetto strutturale esecutivo',
  progetto: 'Progetto',
  ristrutturazione: 'Progetto di ristrutturazione',
  direzione: 'Direzione tecnica di cantiere',
}

/*
 * Un lavoro:
 *   id        identificativo (= cartella in public/lavori/ e chiave in lavori.data.js)
 *   year      anno dell'elenco dello studio
 *   category  una di `categories`
 *   title     titolo breve
 *   kicker    sottotitolo: che cosa si è fatto, in una riga
 *   client    committente, come compare nell'elenco (cognome per i privati)
 *   place     luogo, solo se documentato
 *   role      prestazione dello studio
 *   summary   una frase per l'archivio
 *   text      paragrafi della scheda
 *   sheets    titoli delle tavole, per file; per i PDF a più pagine un array
 *   photos    didascalie delle fotografie, in ordine di pubblicazione
 *   cover     file di copertina (una foto, o una pagina «<file>-p<N>»)
 *   hero      copertina per il carosello, se diversa (il carosello è largo e
 *             basso: una foto verticale o affollata non ci sta)
 *   heroPos   dove centrare il taglio nel carosello (object-position CSS)
 *   primaDopo true se le foto documentano lo stato prima e dopo i lavori
 *   finito    true se c'è una buona fotografia del lavoro finito
 *   apertura  true per il lavoro che apre il carosello, scelto dallo studio
 *   (gli ultimi due, con foto e anno, decidono i lavori in evidenza: vedi
 *   `lavoriInEvidenza` in fondo)
 */
const works = [
  /* ------------------------------------------------------------------ 2010 */
  {
    id: 'casa-rocca',
    year: 2010,
    category: 'edilizia',
    title: 'Casa Rocca',
    kicker: 'Rifacimento delle facciate di una villetta: prima e dopo',
    client: 'Rocca',
    role: ROLE.ristrutturazione,
    summary: 'Una villetta rinnovata nelle facciate, con il nuovo portale d’ingresso in cemento armato a vista.',
    text: [
      'Una casa a due piani su strada, con balconi e un piccolo giardino sul fronte: il tipo di edificio più diffuso nei paesi della provincia. L’intervento ha riguardato l’involucro, lasciando intatta la distribuzione interna.',
      'Le facciate sono state ritinteggiate in un rosso pieno che dialoga con i marcapiani e i parapetti bianchi; l’ingresso è stato segnato da un nuovo portale in cemento armato a vista, gettato in opera, che sostiene una pensilina e dà alla casa un fronte riconoscibile.',
      'Le fotografie seguono il cantiere dal ponteggio alla consegna e il raffronto finale mostra lo stesso angolo di via prima e dopo i lavori.',
    ],
    photos: {
      'prima-e-dopo': 'Prima e dopo: lo stesso angolo della casa a lavori finiti',
      '28102010051': 'Il nuovo portale d’ingresso in cemento armato, ancora casserato',
      '04052011546': 'Il ponteggio sul fronte durante la tinteggiatura',
      '14052011552': 'La casa finita: facciate rosse, parapetti e marcapiani bianchi',
    },
    cover: '14052011552',
    primaDopo: true,
    finito: true,
  },
  {
    id: 'mantovagricoltura-trincee',
    year: 2010,
    category: 'agricoltura',
    title: 'Trincee di stoccaggio per Mantovagricoltura',
    kicker: 'Muri di sostegno in cemento armato per le trincee degli insilati',
    client: 'Mantovagricoltura',
    place: 'Rodigo (MN)',
    role: ROLE.strutturaleEsecutivo,
    summary: 'Lunghi muri di sostegno in cemento armato, gettati in opera, che formano le trincee per lo stoccaggio del foraggio.',
    text: [
      'Le trincee sono i grandi corridoi a cielo aperto, chiusi da muri su tre lati, in cui un’azienda agricola accumula e compatta gli insilati. I muri lavorano come mensole incastrate alla platea e devono reggere la spinta del materiale e il passaggio dei mezzi che lo compattano.',
      'Lo studio ha progettato e disegnato le strutture: la tavola riporta la pianta, le sezioni tipo e le armature dei muri e della platea. Le fotografie di cantiere mostrano le gabbie d’armatura già montate lungo decine di metri, le casseforme a telaio sul lato interno e i muri finiti, con i mezzi dell’azienda che già li percorrono.',
    ],
    sheets: {
      'tavola-1': 'Muri di sostegno: pianta, sezioni e armature',
    },
    photos: {
      '100-2273': 'Le armature dei muri montate lungo la trincea, con l’autobetoniera',
      '100-2279': 'La fila delle gabbie d’armatura vista dall’altro capo',
      '100-2304': 'Casseforme a telaio sul primo tratto di muro',
      'dsc-5515': 'Il muro scasserato e la platea in attesa del getto',
      'dsc-5584': 'Le trincee finite, verso i silos dell’azienda',
      'dsc-5590': 'Il corridoio tra i due muri, pronto per lo stoccaggio',
    },
    cover: 'dsc-5584',
    finito: true,
  },
  {
    id: 'mantovagricoltura-vasche',
    year: 2010,
    category: 'agricoltura',
    title: 'Vasche del biodigestore per Mantovagricoltura',
    kicker: 'Vasca del biodigestato e vasche di arrivo e prelievo in cemento armato',
    client: 'Mantovagricoltura',
    place: 'Rodigo (MN)',
    role: ROLE.strutturaleEsecutivo,
    summary: 'Le vasche in cemento armato di un impianto di biogas: la grande vasca del biodigestato e le vasche di arrivo e prelievo.',
    text: [
      'In un impianto a biogas il digestato, ciò che resta dopo la fermentazione, viene raccolto in vasche a tenuta. Qui ne sono state progettate due famiglie: la vasca principale del biodigestato, a pianta rettangolare con pareti alte, e le vasche più piccole di arrivo e di prelievo, con i relativi pozzetti.',
      'Due tavole esecutive riportano piante, sezioni e armature di pareti e platee, con i particolari dei nodi tra parete e fondazione, dove la tenuta all’acqua chiede più cura.',
      'Il cantiere è documentato dall’armatura della platea, posata su un terreno ancora aperto, fino alle pareti finite, con le casseforme sollevate dal telescopico e un getto proseguito di notte.',
    ],
    sheets: {
      'tavola-1': 'Vasca del biodigestato: pianta, sezioni e armature',
      'tavola-2': 'Vasche di arrivo e prelievo: pianta, sezioni e armature',
    },
    photos: {
      '20102010020': 'La platea armata della vasca, vista dall’argine',
      '21102010037': 'Un getto proseguito di notte, con la pompa in azione',
      '11112010082': 'Casseforme delle pareti sollevate con il telescopico',
      '13112010087': 'La pompa del calcestruzzo al lavoro sulle pareti',
      '13012011181': 'Le pareti finite in una mattina di nebbia',
      'cimg2500': 'La vasca scasserata, con l’escavatore per i rinterri',
    },
    cover: '13112010087',
  },
  {
    id: 'vasca-salizzole',
    year: 2010,
    category: 'agricoltura',
    title: 'Vasca a Salizzole',
    kicker: 'Vasca in cemento armato per la Società Agricola La Collinetta',
    client: 'Società Agricola La Collinetta',
    place: 'Salizzole (VR)',
    role: ROLE.strutturaleEsecutivo,
    summary: 'Una vasca interrata in cemento armato per un’azienda agricola del veronese, dalla tavola esecutiva al cantiere d’inverno.',
    text: [
      'Una vasca a pianta rettangolare di grandi dimensioni, con platea e pareti in cemento armato gettate in opera. La tavola, in formato A1, riporta la pianta delle fondazioni, le sezioni delle pareti con le armature e i particolari degli spigoli.',
      'Le fotografie sono di un cantiere invernale: la platea coperta dalla doppia rete d’armatura, i ferri d’attesa delle pareti che spuntano in fila, e un dettaglio ravvicinato dei distanziatori e delle legature che danno la misura del lavoro di posa.',
    ],
    sheets: {
      'tavola-1': 'Vasca: pianta, sezioni e armature',
    },
    photos: {
      '22122010153': 'La platea armata della vasca, con i ferri d’attesa delle pareti',
      '22122010152': 'La fila dei ferri d’attesa lungo il bordo',
      '22122010151': 'Particolare dell’armatura: barre, distanziatori e legature',
      '22122010160': 'L’angolo della vasca, con l’armatura della parete già avviata',
    },
    cover: '22122010153',
  },

  /* ------------------------------------------------------------------ 2011 */
  {
    id: 'residenza-bergamin',
    year: 2011,
    category: 'strutture',
    title: 'Residenza Bergamin',
    kicker: 'Fondazioni, travi, pilastri e setti in cemento armato',
    client: 'Bergamin',
    place: 'Rodigo (MN)',
    role: ROLE.strutturaleEsecutivo,
    summary: 'Le strutture in cemento armato di un edificio residenziale, in due tavole esecutive: fondazioni, poi travi, pilastri e setti.',
    text: [
      'Un edificio residenziale con ossatura in cemento armato: fondazioni, pilastri, setti e travi. Lo studio ne ha redatto il progetto esecutivo delle strutture.',
      'La prima tavola è quella delle fondazioni, con le piante e le sezioni delle travi rovesce e dei plinti; la seconda raccoglie travi, pilastri e setti, con le carpenterie di piano e le distinte delle armature, piano per piano. Sono fogli lunghi e stretti, come si usa per le distinte dei ferri: nel visualizzatore si scorrono e si ingrandiscono fino al singolo ferro.',
    ],
    sheets: {
      'tavola-1': 'Tav. 1 · Fondazioni',
      'tavola-2': 'Tav. 2 · Travi, pilastri e setti',
    },
    cover: 'tavola-2-p1',
  },
  {
    id: 'piscina-ider',
    year: 2011,
    category: 'strutture',
    title: 'Piscina Ider',
    kicker: 'Piscina privata in giardino: progetto e cantiere',
    client: 'Ider',
    place: 'Moniga del Garda (BS)',
    role: ROLE.strutturale,
    summary: 'Una piscina in un giardino privato: la tavola di progetto, il prato prima dello scavo e la vasca finita in attesa del rivestimento.',
    text: [
      'Il prato dietro una casa di nuova costruzione, chiuso da una siepe, e la volontà di ricavarne una piscina con la zona solarium. La tavola riporta la pianta della vasca e del bordo, le sezioni e l’inserimento nel lotto.',
      'Le fotografie dell’autunno 2011 mostrano il giardino prima dell’intervento; quelle della primavera successiva la vasca in cemento armato già intonacata, con la scala interna a gradoni e gli operai al lavoro sulle rifiniture, poco prima della posa del rivestimento.',
    ],
    sheets: {
      'tavola-1': 'Progetto della piscina: pianta, sezioni e planimetria',
    },
    photos: {
      '16112011697': 'Il giardino prima dei lavori, verso il porticato della casa',
      '16112011698': 'Il prato dove sorgerà la vasca',
      '16112011700': 'Il lato della siepe e la pavimentazione esistente',
      '16112011701': 'Il pilastro in pietra del porticato, dal prato',
      'img-20120524-00087': 'La vasca intonacata, con la scala a gradoni',
      'img-20120524-00091': 'La vasca vista dal fondo, verso la casa',
      'img-20120524-00094': 'Le rifiniture della vasca prima del rivestimento',
    },
    cover: 'img-20120524-00094',
  },
  {
    id: 'residenza-saccagi',
    year: 2011,
    category: 'strutture',
    title: 'Residenza Saccagi',
    kicker: 'Fondazioni, travi, soletta, setti e pilastri in cemento armato',
    client: 'Saccagi',
    place: 'Volta Mantovana (MN)',
    role: ROLE.strutturaleEsecutivo,
    summary: 'Quattro tavole esecutive per le strutture di un edificio residenziale: fondazioni, travi, soletta, setti e pilastri.',
    text: [
      'Il progetto esecutivo delle strutture di un edificio residenziale, organizzato in quattro tavole: le fondazioni, le travi, la soletta piena e infine setti e pilastri.',
      'Ogni tavola accosta le carpenterie, cioè le piante con le sagome degli elementi, alle distinte dei ferri: per ciascuna trave e ciascun pilastro il disegno dell’armatura, le sezioni e le lunghezze delle barre, pronte per l’officina. La tavola della soletta mostra la maglia delle armature superiori e inferiori sull’intero impalcato.',
    ],
    sheets: {
      'tavola-1': 'Tav. 1 · Fondazioni',
      'tavola-2': 'Tav. 2 · Travi',
      'tavola-3': 'Tav. 3 · Soletta',
      'tavola-4': 'Tav. 4 · Setti e pilastri',
    },
    cover: 'tavola-3-p1',
  },

  /* ------------------------------------------------------------------ 2012 */
  {
    id: 'residenza-brunelli',
    year: 2012,
    category: 'strutture',
    title: 'Residenza Brunelli',
    kicker: 'Fondazioni, travi e solai, setti e pilastri in cemento armato',
    client: 'Brunelli',
    place: 'Rivalta sul Mincio (MN)',
    role: ROLE.strutturaleEsecutivo,
    summary: 'Tre tavole esecutive per un edificio residenziale in cemento armato: fondazioni, travi e solai, setti e pilastri.',
    text: [
      'Un edificio residenziale con struttura in cemento armato, di cui lo studio ha redatto il progetto esecutivo in tre tavole: fondazioni, travi e solai, setti e pilastri.',
      'Le tavole seguono la sequenza del cantiere. Prima le travi rovesce e i plinti di fondazione con le loro armature; poi le carpenterie dei solai con le travi di piano e la scala; infine i pilastri e i setti, con le sezioni e le distinte dei ferri elemento per elemento.',
    ],
    sheets: {
      'tavola-1': 'Tav. 1 · Fondazioni',
      'tavola-2': 'Tav. 2 · Travi e solai',
      'tavola-3': 'Tav. 3 · Setti e pilastri',
    },
    cover: 'tavola-2-p1',
  },
  {
    id: 'residenza-ghizzi',
    year: 2012,
    category: 'strutture',
    title: 'Residenza Ghizzi',
    kicker: 'Fondazioni, pilastri, travi e solai in cemento armato',
    client: 'Ghizzi',
    place: 'Marmirolo (MN)',
    role: ROLE.strutturaleEsecutivo,
    summary: 'Le strutture di un edificio residenziale dalla pianta articolata: fondazioni, pilastri, travi e solai in tre tavole.',
    text: [
      'Un edificio residenziale a pianta articolata, con un corpo ad angolo smussato, del quale lo studio ha progettato le strutture in cemento armato.',
      'Le tre tavole riportano le fondazioni, i pilastri e infine travi e solai; nelle piante di carpenteria le zone evidenziate distinguono i campi di solaio e le travi, mentre le sezioni e i particolari fissano i nodi tra pilastri, travi e scala. Ogni tavola apre con le note generali sui materiali e sulle verifiche.',
    ],
    sheets: {
      'tavola-1': 'Tav. 1 · Fondazioni',
      'tavola-2': 'Tav. 2 · Pilastri',
      'tavola-3': 'Tav. 3 · Travi e solai',
    },
    cover: 'tavola-3-p1',
  },

  /* ------------------------------------------------------------------ 2013 */
  {
    id: 'centro-sportivo-fossatello',
    year: 2013,
    category: 'edilizia',
    title: 'Centro sportivo di Fossatello',
    kicker: 'Progetto di un centro sportivo con campi, spogliatoi e parcheggi',
    place: 'Fossatello',
    role: ROLE.progetto,
    summary: 'Il progetto di un centro sportivo in aperta campagna: i campi da calcio, il campo da tennis, lo spogliatoio e il viale d’ingresso, nelle vedute di progetto.',
    text: [
      'Un terreno agricolo chiuso da siepi e filari, fotografato nel dicembre 2012, e il progetto di trasformarlo in un centro sportivo: campi da calcio di diverse misure, un campo da tennis, il blocco degli spogliatoi, i parcheggi e un viale alberato che accoglie chi arriva.',
      'Le vedute di progetto dell’estate 2013, in volo d’uccello e a quota d’uomo, mostrano l’insieme e il dettaglio: il viale con le betulle, la pavimentazione chiara tra i campi, lo spogliatoio a un piano dal tetto piano. La vista aerea dell’area chiude la sequenza.',
    ],
    photos: {
      '2012-12-18-01': 'L’area prima dell’intervento: il terreno arato e i filari',
      '2012-12-18-02': 'Il confine con la siepe e i pioppi, dicembre 2012',
      '2012-12-18-03': 'La strada d’accesso e il margine del lotto',
      '2013-08-fossatello01': 'Vista di progetto dall’alto: campi, tennis, spogliatoi e parcheggi',
      '2013-08-fossatello02': 'Vista di progetto: i campi e lo spogliatoio dal lato dei parcheggi',
      '2013-08-fossatello03': 'Vista di progetto: il viale d’ingresso con le betulle',
      '2013-08-fossatello04': 'Vista di progetto: lo spogliatoio a bordo campo',
      '2013-08-fossatello05': 'Planimetria di progetto a volo d’uccello',
      'screenshot-2026-11-02-112408': 'Vista aerea dell’area',
    },
    cover: '2013-08-fossatello01',
  },
  {
    id: 'villa-carpaneta',
    year: 2013,
    category: 'strutture',
    title: 'Villa Carpaneda',
    kicker: 'Miglioramento sismico di una villa e della sua chiesa dopo il sisma',
    client: 'A.S.P. Villa Carpaneda',
    place: 'Rodigo (MN)',
    role: ROLE.strutturale,
    summary: 'Dopo il sisma del 2012, il miglioramento sismico di una villa storica, oggi casa di cura, e della chiesa annessa: fondazioni, piante, sezioni e particolari.',
    text: [
      'Il terremoto del maggio 2012 ha colpito anche la pianura mantovana, lasciando lesioni su molti edifici storici. Qui l’intervento riguarda un complesso di Rodigo formato da una villa storica, oggi sede di una casa di cura, e dalla chiesa che le sta accanto.',
      'Per la villa, due tavole: le fondazioni, con le piante e le sezioni dei nuovi elementi, e una tavola generale con le piante dei piani, i particolari dei solai e lo schema dell’arco in mattoni da consolidare. Per la chiesa, una tavola unica con la pianta, la sezione trasversale sulla navata e il disegno della copertura con la nuova orditura.',
      'Le tavole, datate 2015, raccolgono il progetto come depositato: in ognuna la legenda dei materiali e le note sugli interventi precedono i disegni.',
    ],
    sheets: {
      'tavola-1': 'Villa · Tav. 01 · Fondazioni',
      'tavola-2': 'Villa · Tav. 02 · Piante, sezioni e particolari',
      'tavola-3': 'Chiesa · Tavola unica · Pianta, sezione e copertura',
    },
    cover: 'tavola-3-p1',
  },

  /* ------------------------------------------------------------------ 2014 */
  {
    id: 'depuratore-meltina',
    year: 2014,
    category: 'industria',
    title: 'Depuratore di Meltina',
    kicker: 'Struttura di sostegno per la posa dei pacchi lamellari',
    client: 'SIBA S.p.A. (gruppo Veolia)',
    place: 'Meltina (BZ)',
    role: ROLE.strutturale,
    summary: 'In un depuratore dell’Alto Adige, la struttura in acciaio che sostiene i pacchi lamellari dentro una vasca circolare.',
    text: [
      'I pacchi lamellari sono gli elementi che, in un sedimentatore, aumentano la superficie utile alla decantazione. Devono stare sospesi nella vasca, sorretti da una struttura che non intralci il flusso e resista all’ambiente aggressivo.',
      'La tavola, alla terza revisione, riporta la pianta della vasca circolare con il reticolo delle travi, le sezioni, i profili in acciaio adottati e i particolari degli appoggi e dei collegamenti; una fotografia della vasca esistente, nel cartiglio, dà il contesto.',
    ],
    sheets: {
      'tavola-1': 'Struttura di sostegno dei pacchi lamellari · Rev. 03',
    },
    cover: 'tavola-1-p1',
  },

  /* ------------------------------------------------------------------ 2015 */
  {
    id: 'sicem-via-galana',
    year: 2015,
    category: 'strutture',
    title: 'Consolidamento dei solai in via Galana',
    kicker: 'Consolidamento dei solai di un’unità immobiliare a Mantova',
    client: 'SICEM',
    place: 'Mantova, via Galana',
    role: ROLE.strutturale,
    summary: 'Il consolidamento dei solai in legno di un’unità immobiliare in città: piante con le orditure e particolari del rinforzo.',
    text: [
      'In un edificio esistente a Mantova, i solai in legno di un’unità immobiliare andavano consolidati per riportarli alle prestazioni richieste. La tavola riporta le piante dei solai con le orditure delle travi, evidenziando i campi da rinforzare, e i particolari costruttivi del consolidamento: la soletta collaborante, i connettori, gli appoggi sui muri.',
    ],
    sheets: {
      'tavola-1': 'Consolidamento dei solai: piante, sezioni e particolari',
    },
    cover: 'tavola-1-p1',
  },
  {
    id: 'corte-romana',
    year: 2015,
    category: 'edilizia',
    title: 'Corte Romana',
    kicker: 'Recupero di una corte rurale: dalla rovina all’abitazione',
    client: 'Vallenari',
    role: ROLE.progetto,
    summary: 'Una corte rurale abbandonata, con la barchessa ad archi, recuperata ad abitazione: il raffronto fotografico di progetto e il cantiere dal 2015 al 2020.',
    text: [
      'Una corte della campagna mantovana nello stato in cui si trovava nell’autunno 2015: la casa padronale con l’intonaco caduto e le finestre murate, la barchessa con le grandi arcate in mattoni, dentro i solai in legno pericolanti e le stanze piene di macerie.',
      'Il progetto ha ricomposto il complesso conservandone i caratteri: le arcate sono state liberate e chiuse con serramenti scuri arretrati, le murature in mattoni a vista restaurate, le facciate intonacate in un tono caldo che le accorda al cotto. All’interno le travi in legno sono tornate a vista, con le tavelle in cotto nei soffitti e nuovi pavimenti in legno; una parete in sasso è rimasta a testimoniare la costruzione originaria.',
      'Gli elaborati grafici di progetto accostano, foto per foto, lo stato di fatto e la simulazione dell’intervento; le fotografie del 2019 e del 2020 mostrano il risultato.',
    ],
    sheets: {
      'tavola-1': ['Raffronto fotografico: la barchessa, stato di fatto e progetto', 'Raffronto fotografico: la casa padronale, stato di fatto e progetto'],
    },
    photos: {
      'wp-20151017-050': 'La barchessa nel 2015, con le arcate tamponate',
      'wp-20151017-043': 'La casa padronale prima dei lavori, intonaci caduti e finestre murate',
      'wp-20151017-047': 'Il fronte laterale della casa, con le lesioni',
      'wp-20151017-021': 'All’interno: i solai in legno e le macerie',
      'wp-20151017-024': 'Una stanza con la travatura a vista, prima del recupero',
      'wp-20151017-036': 'Il portone interno e le volte lesionate',
      'img-20190430-181228': 'La barchessa recuperata: arcate liberate e serramenti arretrati',
      'img-20190430-180915': 'La casa padronale a fine cantiere, fronte sul campo',
      'img-20190430-181022': 'L’angolo della barchessa con il mattone a vista restaurato',
      'img-20190430-181101': 'Il fronte principale della casa, intonacato',
      'img-20190430-181122': 'La casa dal cortile, con il nuovo marciapiede',
      'img-20200129-111615': 'La barchessa con i serramenti montati, gennaio 2020',
      '20190605-150801': 'Soffitto con travi in legno e tavelle in cotto a spina di pesce',
      'img-20190928-wa0023': 'Interno: travi a vista, pavimento in legno, parete in sasso',
      'img-20190928-wa0024': 'Una stanza finita, con il soffitto in legno',
      'img-20190920-114347': 'Il passaggio tra due stanze, con il muro in sasso lasciato a vista',
    },
    cover: 'img-20190430-181228',
    primaDopo: true,
    finito: true,
  },

  /* ------------------------------------------------------------------ 2016 */
  {
    id: 'casa-dario',
    year: 2016,
    category: 'edilizia',
    title: 'Casa Dario',
    kicker: 'Progetto di un’abitazione e simulazione dei materiali',
    place: 'Rivalta sul Mincio (MN)',
    role: ROLE.progetto,
    summary: 'Il progetto di una nuova abitazione al posto di una casa esistente, con la tavola che confronta i materiali di facciata sul fotoinserimento.',
    text: [
      'Una casa a due piani su un lotto d’angolo, con il garage e un giardino cresciuto a caso, fotografata nel giugno 2014. Il progetto la sostituisce con una nuova abitazione: al piano terra i garage e i locali di servizio, sopra l’abitazione con una grande terrazza sul fronte, protetta da un parapetto leggero.',
      'La tavola di progetto raccoglie piante, prospetti e sezioni con la planimetria del lotto; la tavola di simulazione mette a confronto, sulla stessa fotografia, diverse soluzioni per i materiali e i colori delle facciate, per scegliere a colpo d’occhio.',
      'Le fotografie più recenti mostrano la casa realizzata, con la terrazza sopra i garage, e un dettaglio notturno della pavimentazione esterna illuminata dal basso.',
    ],
    sheets: {
      'tavola-1': 'Tav. 03 · Progetto: planimetria, piante, prospetti e sezioni',
      'tavola-2': 'Tav. 04 · Simulazione dei materiali: raffronto sul fotoinserimento',
    },
    photos: {
      '20140611-104139': 'La casa esistente nel 2014, fronte con il garage',
      '20140611-103955': 'La casa esistente dal giardino',
      '20140611-104403': 'Il lotto d’angolo dalla strada',
      'img-20200618-wa0051': 'La nuova casa: i garage al piano terra e la terrazza sopra',
      'img-20221130-213412': 'Dettaglio notturno della pavimentazione esterna illuminata',
    },
    cover: 'img-20200618-wa0051',
    primaDopo: true,
    finito: true,
  },

  /* ------------------------------------------------------------------ 2017 */
  {
    id: 'appartamento-frigoni',
    year: 2017,
    category: 'edilizia',
    title: 'Appartamento Frigoni',
    kicker: 'Ristrutturazione completa di un appartamento: prima e dopo',
    client: 'Frigoni',
    role: ROLE.ristrutturazione,
    summary: 'Un appartamento rifatto da cima a fondo: dalle demolizioni dell’estate 2017 agli interni chiari e lineari della primavera 2018.',
    text: [
      'Un appartamento con la distribuzione originaria, le piastrelle a motivi nella cucina e i pavimenti scuri, fotografato ad agosto 2017 a demolizioni appena iniziate. L’intervento ha ridisegnato gli spazi: il soggiorno aperto verso l’ingresso, un corridoio con porte a tutta altezza, i bagni rifatti.',
      'A marzo 2018 l’appartamento finito: pareti bianche, pavimenti in legno chiaro posati in continuità tra le stanze, un bagno con il rivestimento a fasce grigie e il mobile sospeso, le porte in legno scuro dell’ingresso mantenute come segno dell’edificio.',
    ],
    photos: {
      'img-20170822-182503-copia': 'Agosto 2017: le demolizioni, la cucina con le piastrelle originali',
      'img-20170822-182540': 'L’ingresso prima dei lavori',
      'img-20170822-182609-copia': 'Il corridoio verso le stanze, prima',
      'img-20170822-182643-copia': 'La cucina e il passaggio sul retro, prima',
      'img-20170822-182647-copia': 'Il lavello e la finestra della cucina, prima',
      'img-20180320-190835': 'Marzo 2018: il soggiorno finito, verso l’ingresso',
      'img-20180320-190839': 'Il soggiorno con il pavimento in legno chiaro',
      'img-20180320-191152': 'Il soggiorno verso il corridoio',
      'img-20180320-190921': 'Il corridoio con le porte a tutta altezza',
      'img-20180320-190852': 'Il bagno: rivestimento a fasce e mobile sospeso',
      'img-20180320-190953': 'Il bagno con la doccia e il termoarredo',
      'img-20180320-191204': 'Il bagno visto dal corridoio',
      'img-20180320-190916': 'Una camera finita',
      'img-20180320-191036': 'Il disimpegno',
      'img-20180320-191131': 'La porta della camera, con la televisione a parete',
    },
    cover: 'img-20180320-190835',
    hero: 'img-20180320-190839',
    primaDopo: true,
    finito: true,
  },
  {
    id: 'weightpack-goito',
    year: 2017,
    category: 'industria',
    title: 'Deposito Weightpack a Goito',
    kicker: 'Struttura metallica a destinazione deposito',
    client: 'Weightpack S.r.l.',
    place: 'Goito (MN)',
    role: ROLE.strutturaleEsecutivo,
    summary: 'Un deposito con struttura in acciaio per un’azienda di Goito: fondazioni, telai e particolari dei collegamenti in una tavola esecutiva.',
    text: [
      'Un edificio a destinazione deposito con ossatura in acciaio: pilastri e travi su una maglia regolare, controventi di falda e di parete, fondazioni a plinti in cemento armato.',
      'La tavola, alla seconda revisione, riporta la pianta delle fondazioni con i plinti e le travi di collegamento, i prospetti dei telai, le sezioni e i particolari dei nodi bullonati e delle piastre di base, con le relative distinte.',
    ],
    sheets: {
      'tavola-1': 'Tav. 01 · Fondazioni e struttura metallica · Rev. 02',
    },
    cover: 'tavola-1-p1',
  },

  /* ------------------------------------------------------------------ 2018 */
  {
    id: 'pfm-remedello',
    year: 2018,
    category: 'industria',
    title: 'Deposito P.F.M. a Remedello',
    kicker: 'Struttura metallica a destinazione deposito',
    client: 'P.F.M.',
    place: 'Remedello (BS)',
    role: ROLE.strutturaleEsecutivo,
    summary: 'Un deposito in acciaio nel bresciano: due tavole con i telai, la copertura, i prospetti e i particolari dei collegamenti.',
    text: [
      'Un edificio a destinazione deposito con struttura in acciaio a telai e copertura a falda, su fondazioni in cemento armato.',
      'Il PDF raccoglie due tavole: nella prima i telai trasversali con i profili e le fondazioni, nella seconda i prospetti, la pianta della copertura con gli arcarecci e i controventi, e i particolari dei nodi, delle piastre di base e dei collegamenti bullonati.',
    ],
    sheets: {
      'tavola-1': ['Tavola 1 · Telai e fondazioni', 'Tavola 2 · Prospetti, copertura e particolari'],
    },
    cover: 'tavola-1-p2',
  },

  /* ------------------------------------------------------------------ 2019 */
  {
    id: 'latteria-sociale-mantovana',
    year: 2019,
    category: 'industria',
    title: 'Scala per la Latteria Sociale Mantovana',
    kicker: 'Scala in acciaio per lo stabilimento',
    client: 'Latteria Sociale Mantovana',
    place: 'Porto Mantovano (MN)',
    role: ROLE.strutturaleEsecutivo,
    summary: 'Una scala in acciaio a due rampe con pianerottolo per lo stabilimento di un caseificio: piante, sezioni e particolari.',
    text: [
      'Una scala metallica di servizio a due rampe con pianerottolo intermedio, con i parapetti e i fissaggi alle strutture esistenti dello stabilimento.',
      'La tavola unica, alla seconda revisione, riporta le piante ai diversi livelli, la sezione lungo le rampe, i profili dei cosciali e delle travi del pianerottolo e i particolari degli attacchi a terra e in sommità.',
    ],
    sheets: {
      'tavola-1': 'Scala in acciaio · Tavola unica · Rev. 02',
    },
    cover: 'tavola-1-p1',
  },

  /* ------------------------------------------------------------------ 2020 */
  {
    id: 'casa-cauzzi',
    year: 2020,
    category: 'edilizia',
    title: 'Casa Cauzzi',
    kicker: 'Ristrutturazione di una casa con il nuovo portico per le auto',
    client: 'Cauzzi',
    role: ROLE.ristrutturazione,
    summary: 'Una casa gialla a un piano e mezzo trasformata in un volume grigio e lineare, con il portico delle auto a tetto piano.',
    text: [
      'Una casa con il tetto a falde e le facciate gialle, le siepi davanti e una tettoia per le auto sul lato: lo stato nel marzo 2021. L’intervento ha ridisegnato l’esterno: facciate in grigio chiaro, serramenti scuri, una fascia nera sotto la gronda che alleggerisce il tetto, e un nuovo portico per le auto a tetto piano con la porta sezionale.',
      'Le fotografie del 2022 mostrano la casa finita, con la corte in ghiaia e il nuovo volume del portico allineato all’abitazione.',
    ],
    photos: {
      '20210313-090129': 'Marzo 2021: la casa prima dei lavori',
      '20210313-090316': 'La vecchia tettoia per le auto, prima',
      'timephoto-20220504-105150': 'Maggio 2022: la casa rinnovata, con il portico a tetto piano',
      'timephoto-20220504-105121': 'Il portico delle auto e la porta sezionale',
      'timephoto-20220907-163623-resized-20220916-092826831': 'Settembre 2022: il fronte finito, con la fascia scura sotto la gronda',
    },
    cover: 'timephoto-20220504-105150',
    primaDopo: true,
    finito: true,
  },
  {
    id: 'passerella-volta-mantovana',
    year: 2020,
    category: 'strutture',
    title: 'Passerella a Volta Mantovana',
    kicker: 'Passerella pedonale in acciaio per il Comune',
    client: 'Unione Colli Mantovani · Comune di Volta Mantovana',
    place: 'Volta Mantovana (MN)',
    role: ROLE.strutturaleEsecutivo,
    summary: 'Una passerella pedonale a travi reticolari in acciaio, con l’impalcato grigliato e il parapetto a cavi, posata accanto al ponte esistente.',
    text: [
      'Lungo un canale, accanto a un ponte stradale su pile in cemento, mancava un passaggio sicuro per i pedoni. La passerella progettata per il Comune è una struttura in acciaio a due travi reticolari laterali, con l’impalcato in grigliato e il parapetto a montanti e cavi.',
      'La tavola unica riporta la pianta e i prospetti della passerella, le sezioni, gli appoggi sulle spalle e i particolari dei nodi. Le fotografie seguono il lavoro dal sopralluogo di febbraio 2020, con il ponte esistente, alla passerella posata in marzo e al dettaglio dell’impalcato appena montato.',
    ],
    sheets: {
      'tavola-1': 'Passerella · Tavola unica · Rev. 00',
    },
    photos: {
      'img-20200207-154651': 'Febbraio 2020: il ponte esistente sul canale, prima della passerella',
      'img-20200303-151620': 'Marzo 2020: la passerella posata accanto al ponte',
      'img-20200312-133215': 'L’impalcato grigliato e il parapetto a cavi appena montati',
    },
    cover: 'img-20200303-151620',
    primaDopo: true,
    finito: true,
  },
  {
    id: 'passeggiata-desenzano',
    year: 2020,
    category: 'edilizia',
    title: 'Passeggiata a lago a Desenzano',
    kicker: 'Direzione tecnica di cantiere per il lungolago',
    place: 'Desenzano del Garda (BS)',
    role: ROLE.direzione,
    summary: 'La direzione tecnica del cantiere di un tratto di lungolago: la passeggiata in calcestruzzo con le sedute, le aiuole e l’illuminazione radente.',
    text: [
      'Un tratto di passeggiata sulla riva del lago di Garda, tra le ville e l’acqua: un piano continuo in calcestruzzo chiaro con il bordo rialzato verso il lago, sedute in pietra, aiuole piantumate dietro muretti in blocchi e, la sera, una linea di luce radente che corre sotto il parapetto.',
      'Lo studio ha svolto la direzione tecnica del cantiere. Le fotografie di giugno, luglio e agosto 2021 documentano la passeggiata appena finita, di giorno e di notte.',
    ],
    photos: {
      'timephoto-20210805-083659': 'La passeggiata finita, con le sedute e il pontile sullo sfondo',
      'timephoto-20210630-155835': 'Giugno 2021: il piano in calcestruzzo lungo le ville',
      'timephoto-20210805-084856': 'Il bordo verso il lago e il pontile',
      'timephoto-20210805-083631': 'Il camminamento in ghiaia e l’aiuola lungo il muro',
      'timephoto-20210805-083648': 'Le aiuole appena piantumate dietro i muretti in blocchi',
      'timephoto-20210805-083536': 'Il prato e gli ulivi verso il lago',
      'img-20210709-222548': 'Di notte: la luce radente sotto il parapetto',
      'img-20210709-222553': 'La linea di luce lungo la passeggiata, verso il pontile',
    },
    cover: 'timephoto-20210805-083659',
    finito: true,
  },
  {
    id: 'scala-ghiroldi',
    year: 2020,
    category: 'strutture',
    title: 'Scala per Ghiroldi Design',
    kicker: 'Scala elicoidale in acciaio in uno spazio espositivo',
    client: 'Ghiroldi Design',
    role: ROLE.strutturale,
    summary: 'Una scala elicoidale in lamiera d’acciaio scura che sale in uno showroom tra la vetrina e il soggiorno esposto.',
    text: [
      'Una scala a pianta elicoidale in lamiera d’acciaio, verniciata di scuro: una lama continua che si avvolge su se stessa, senza pilastro centrale, e arriva al soffitto accanto alla vetrina. Lo studio ne ha curato il progetto strutturale.',
      'Le fotografie del marzo 2021 la mostrano montata nello spazio espositivo, tra gli arredi: la si vede dalla vetrina, con la luce che radente ne disegna la superficie, e dal lato del soggiorno.',
    ],
    photos: {
      'img-20210318-115211': 'La scala elicoidale in lamiera vista dal soggiorno esposto',
      'img-20210318-115203': 'La scala accanto alla vetrina dello showroom',
    },
    cover: 'img-20210318-115211',
    finito: true,
  },
  {
    id: 'casa-mazzoni',
    year: 2020,
    category: 'edilizia',
    title: 'Casa Mazzoni',
    kicker: 'Ristrutturazione di una casa a due piani: prima e dopo',
    client: 'Mazzoni',
    role: ROLE.ristrutturazione,
    summary: 'Una casa con il tetto a padiglione e le facciate verdine trasformata in un volume semplice e grigio, con la nuova recinzione a doghe.',
    text: [
      'Una casa a due piani in un lotto d’angolo, con il tetto a padiglione, i balconi e la recinzione in pietra, fotografata nel dicembre 2020. Il progetto ha semplificato l’edificio: facciate in grigio chiaro, nuovi serramenti, il balcone ridisegnato.',
      'La recinzione è stata sostituita da una cancellata a doghe orizzontali con il cancello pedonale e i pilastri in cemento a vista. Le fotografie dell’ottobre 2022 mostrano la casa finita.',
    ],
    photos: {
      '20201229-150703': 'Dicembre 2020: la casa prima dei lavori, dal cancello',
      '20201229-150746': 'Il fronte sulla strada, prima',
      '20201229-150800': 'L’angolo del lotto, prima',
      'img-20221003-115417': 'Ottobre 2022: la casa rinnovata, con la nuova recinzione a doghe',
      'timephoto-20221004-142021': 'Il cancello pedonale e i pilastri in cemento a vista',
    },
    cover: 'img-20221003-115417',
    heroPos: 'center 15%',
    primaDopo: true,
    finito: true,
  },
  {
    id: 'magazzino-corte-scaraglio',
    year: 2020,
    category: 'agricoltura',
    title: 'Magazzino a Corte Scaraglio',
    kicker: 'Magazzino agricolo: fondazioni e tamponature',
    client: 'Società Agricola Scaraglio',
    place: 'Marmirolo (MN)',
    role: ROLE.strutturaleEsecutivo,
    summary: 'Un magazzino agricolo a pianta rettangolare con il tetto a due falde: la tavola delle fondazioni e quella delle tamponature con i prospetti.',
    text: [
      'Un magazzino per un’azienda agricola: un volume rettangolare a tetto a due falde, con i pilastri su plinti e le pareti di tamponamento in muratura, aperte da portoni ad arco ribassato sui lati corti.',
      'Due tavole, alla prima revisione: le fondazioni, con la pianta dei plinti e dei cordoli e le sezioni armate, e le tamponature, con i prospetti dei quattro lati, le sezioni e i particolari dei cordoli di sommità e degli ammorsamenti ai pilastri.',
    ],
    sheets: {
      'tavola-1': 'Tav. 01 · Fondazioni · Rev. 01',
      'tavola-2': 'Tav. 02 · Tamponature e prospetti · Rev. 01',
    },
    cover: 'tavola-2-p1',
  },
  {
    id: 'stalla-ghisini',
    year: 2020,
    category: 'agricoltura',
    title: 'Stalla per la Società Agricola Ghisini',
    kicker: 'Nuova stalla per un’azienda agricola',
    client: 'Società Agricola Ghisini',
    role: ROLE.progetto,
    summary: 'Una nuova stalla per un’azienda agricola della pianura, fotografata dai campi nell’estate 2024.',
    text: [
      'Una stalla di nuova costruzione per un’azienda agricola: un corpo lungo e basso con la copertura a falde, che si legge in lontananza tra i campi di mais nella fotografia del giugno 2024.',
    ],
    photos: {
      '20240628-154647': 'Giugno 2024: la stalla vista dai campi',
    },
    cover: '20240628-154647',
  },

  /* ------------------------------------------------------------------ 2021 */
  {
    id: 'casa-anselmi-gaburro',
    year: 2021,
    category: 'edilizia',
    title: 'Casa Anselmi Gaburro',
    kicker: 'Ristrutturazione di una casa a un piano',
    client: 'Anselmi Gaburro',
    role: ROLE.ristrutturazione,
    summary: 'La ristrutturazione di una casa a un piano con il giardino, fotografata nello stato di fatto.',
    text: [
      'Una casa a un solo piano, con il tetto a falde e il giardino sul fronte, nello stato in cui si trovava nel novembre 2019, prima della ristrutturazione.',
    ],
    photos: {
      'img-20191101-092628': 'Novembre 2019: la casa e il giardino prima dei lavori',
    },
    cover: 'img-20191101-092628',
  },
  {
    id: 'casa-via-tezzone',
    apertura: true,
    year: 2021,
    category: 'edilizia',
    title: 'Casa in via Tezzone',
    kicker: 'Rinnovo di una villa dal linguaggio moderno',
    role: ROLE.ristrutturazione,
    summary: 'Una villa a tetto piano su un piano rialzato, con le grandi vetrate sul giardino, rinnovata dentro e fuori tra il 2021 e il 2022.',
    text: [
      'Una casa dal linguaggio moderno: tetto piano con la gronda sporgente, piano rialzato sopra un seminterrato, una lunga finestra a nastro e la scala esterna che scende al giardino. All’interno, il soggiorno con le vetrate a tutta parete e il pavimento in legno a disegno, fotografato nell’agosto 2021.',
      'L’intervento ha rinnovato l’abitazione mantenendone il carattere: nel 2022 la cucina bianca con la penisola e la libreria passante verso il soggiorno, e all’esterno le facciate rifatte, il nuovo parapetto del terrazzo e la scala.',
    ],
    photos: {
      'img-20210828-104132': 'Agosto 2021: la casa dal vialetto, con la scala al giardino',
      'img-20210828-174301-resized-20210829-043015147': 'Il soggiorno con le vetrate sul giardino, prima dei lavori',
      'img-20220825-133529': 'Agosto 2022: la nuova cucina con la penisola e la libreria passante',
      'timephoto-20220913-173236': 'Settembre 2022: la casa rinnovata, fronte sul giardino',
      'timephoto-20220913-173311': 'Il lato con la scala esterna e il terrazzo',
    },
    cover: 'timephoto-20220913-173236',
    primaDopo: true,
    finito: true,
  },
  {
    id: 'piscina-fermi',
    year: 2021,
    category: 'strutture',
    title: 'Piscina Fermi',
    kicker: 'Piscina privata in cemento armato',
    client: 'Fermi',
    place: 'Sirmione (BS)',
    role: ROLE.strutturaleEsecutivo,
    summary: 'La struttura in cemento armato di una piscina privata con la scala ad angolo: pianta, sezioni e armature in una tavola.',
    text: [
      'Una piscina a pianta rettangolare con la scala di accesso ad angolo. La struttura è una platea con pareti in cemento armato gettate in opera.',
      'La tavola esecutiva riporta la pianta della platea con le armature, le sezioni longitudinale e trasversale, i particolari del bordo e della scala, e le distinte dei ferri.',
    ],
    sheets: {
      'tavola-1': 'Piscina: pianta, sezioni e armature · Rev. 00',
    },
    cover: 'tavola-1-p1',
  },
  {
    id: 'casa-parolini',
    year: 2021,
    category: 'edilizia',
    title: 'Casa Parolini',
    kicker: 'Ristrutturazione di una casa di campagna: prima, progetto e dopo',
    client: 'Parolini',
    role: ROLE.ristrutturazione,
    summary: 'Una casa gialla tra i cipressi, ridisegnata con il basamento in pietra, il portico e la nuova terrazza: dal rilievo al rendering alla casa finita.',
    text: [
      'Una casa a due piani in aperta campagna, con le facciate gialle, il balcone e i cipressi davanti, fotografata nel settembre 2020. Il progetto le ha dato un nuovo aspetto: facciate in grigio chiaro, un basamento rivestito in pietra che raccoglie il portico delle auto e il garage, una terrazza al piano primo con il parapetto in vetro e un pergolato laterale.',
      'Il rendering ha anticipato il risultato; le fotografie dell’aprile 2026 mostrano la casa finita, con il piazzale in calcestruzzo stampato e il basamento in pietra, mentre il giardino è ancora da sistemare.',
    ],
    photos: {
      '20200926-105644': 'Settembre 2020: la casa prima dei lavori, fronte con il balcone',
      '20200926-105502': 'La casa tra i cipressi, prima',
      '20200926-105546': 'Il retro con il garage, prima',
      'rendering': 'Il rendering di progetto: basamento in pietra, portico e terrazza',
      '2026-04-16-11-04-43': 'Aprile 2026: la casa finita, con il piazzale stampato',
      '2026-04-16-11-05-05': 'La casa dal campo, con il nuovo muro di contenimento',
    },
    cover: '2026-04-16-11-04-43',
    primaDopo: true,
    finito: true,
  },
  {
    id: 'sportler-peschiera',
    year: 2021,
    category: 'strutture',
    title: 'Scenografia Sportler a Peschiera',
    kicker: 'Struttura metallica della scenografia in facciata al negozio',
    client: 'Sportler',
    place: 'Peschiera del Garda (VR)',
    role: ROLE.strutturaleEsecutivo,
    summary: 'La struttura in acciaio che regge la grande scenografia curva, blu e sospesa, all’ingresso del negozio Sportler Bike di Peschiera.',
    text: [
      'All’ingresso di un grande negozio di articoli sportivi, una scenografia a pianta curva, rivestita in blu e sospesa sopra le vetrine, porta l’insegna e avvolge l’angolo dell’edificio. Dietro il rivestimento c’è una struttura in acciaio: montanti, traversi e centine curve che riportano i carichi alla struttura dell’edificio.',
      'La tavola esecutiva riporta la pianta con la curva della scenografia, i prospetti del telaio, le sezioni tipo con i profili e i particolari degli attacchi. La fotografia del giugno 2021 mostra la scenografia montata, con il cantiere ancora in corso ai piedi.',
    ],
    sheets: {
      'tavola-1': 'Struttura metallica della scenografia · Rev. 00',
    },
    photos: {
      'img-20210623-wa0014': 'Giugno 2021: la scenografia curva montata sopra le vetrine',
    },
    cover: 'img-20210623-wa0014',
    finito: true,
  },

  /* ------------------------------------------------------------------ 2022 */
  {
    id: 'condominio-arrivabene',
    year: 2022,
    category: 'edilizia',
    title: 'Condominio Arrivabene',
    kicker: 'Riqualificazione di un piccolo condominio: prima e dopo',
    client: 'Condominio Arrivabene',
    role: ROLE.ristrutturazione,
    summary: 'Un condominio a due piani, nascosto dalla vegetazione, riqualificato nelle facciate e negli spazi esterni tra il 2022 e il 2023.',
    text: [
      'Un edificio residenziale a due piani con le facciate chiare e i balconi, circondato da un giardino cresciuto fino a nasconderlo, fotografato dalla strada nel settembre 2022.',
      'L’intervento ha riqualificato l’involucro e gli spazi esterni: facciate rifatte in un tono caldo con le cornici bianche, serramenti nuovi, il marciapiede e la pavimentazione in ghiaia attorno all’edificio. Le fotografie dell’autunno 2023 mostrano il condominio a fine lavori.',
    ],
    photos: {
      'img-20220920-114654': 'Settembre 2022: il condominio dalla strada, tra la vegetazione',
      'img-20220920-114655': 'Il fronte sul giardino incolto, prima',
      'img-20220920-114659': 'L’angolo dell’edificio, prima',
      'img-20220920-114721': 'Il lato sulla strada con gli alberi, prima',
      'img-20220920-114748': 'L’ingresso carraio, prima',
      'img-20220920-114750': 'La recinzione e il cancello, prima',
      '20231006-174639': 'Ottobre 2023: le facciate rifatte, con le cornici bianche',
      '20231006-174628': 'Il fianco dell’edificio con il nuovo marciapiede',
      'img-20230930-wa0005': 'Settembre 2023: il condominio dalla strada, a lavori quasi finiti',
    },
    cover: '20231006-174639',
    hero: '20231006-174628',
    primaDopo: true,
    finito: true,
  },

  /* ------------------------------------------------------------------ 2023 */
  {
    id: 'casa-pantaleoni',
    year: 2023,
    category: 'edilizia',
    title: 'Casa Pantaleoni',
    kicker: 'Ristrutturazione e ampliamento di una casa a corte',
    client: 'Pantaleoni',
    role: ROLE.ristrutturazione,
    summary: 'Una casa a corte con l’intonaco giallo scrostato, ristrutturata e ampliata con un nuovo volume a tetto piano sul cortile.',
    text: [
      'Una casa a due piani affacciata su un cortile in ghiaia, con l’intonaco giallo consumato, gli scuri verdi e un basso corpo di servizio: lo stato nel febbraio 2022.',
      'Il progetto ha ristrutturato la casa e l’ha ampliata con un volume a un piano, a tetto piano, che si attacca al corpo principale e si apre sul cortile con una grande vetrata; una porzione con il portone sezionale ospita il garage. Facciate in un grigio-verde chiaro, serramenti scuri, il cortile pavimentato. Le fotografie del luglio 2025 mostrano la casa a fine lavori.',
    ],
    photos: {
      'img-20220220-152814-resized-20220220-044232168': 'Febbraio 2022: la casa dal cortile, prima dei lavori',
      'img-20220220-152825-resized-20220220-044231822': 'Il fronte sul cortile con gli scuri verdi, prima',
      'img-20220220-152750-resized-20220220-044232803': 'Il corpo di servizio e il cortile in ghiaia, prima',
      'img-20220220-164044-resized-20220220-044231221': 'Il fianco della casa sulla via, prima',
      '2025-07-28-18-17-41': 'Luglio 2025: la casa ristrutturata, fronte sul cortile',
      '2025-07-28-18-17-55': 'Il nuovo volume a tetto piano con la vetrata e il garage',
      '2025-07-28-20-38-11': 'L’ampliamento visto dal giardino, al tramonto',
    },
    cover: '2025-07-28-18-17-55',
    primaDopo: true,
    finito: true,
  },
  {
    id: 'roversi-cucinella',
    year: 2023,
    category: 'industria',
    title: 'Scala per Roversi Cesare Arredamenti',
    kicker: 'Struttura metallica di una scala a torre, su progetto di Mario Cucinella Architects',
    client: 'Roversi Cesare Arredamenti',
    place: 'Moglia (MN)',
    role: ROLE.strutturaleEsecutivo,
    summary: 'Una torre cilindrica di lame in acciaio corten che racchiude una scala elicoidale, nel giardino di un’azienda: il concept dello studio Cucinella e l’esecutivo strutturale.',
    text: [
      'Nel giardino tra gli edifici di un’azienda di arredamento, una scala che collega il piano terra al primo piano è diventata un oggetto a sé: un cilindro di lame verticali in acciaio corten, aperto in alto, dentro cui si avvolge la rampa. Il progetto architettonico è di Mario Cucinella Architects; lo studio ha redatto il progetto strutturale esecutivo.',
      'Il fascicolo di MCA racconta l’idea: la planimetria del giardino con i percorsi circolari, le vedute dalla strada e dal primo piano, gli usi nelle stagioni, la palette dei materiali, i dettagli della scala e i rendering. Le due tavole esecutive riportano la pianta con la geometria della rampa e delle lame, i prospetti, le sezioni dei gradini a sbalzo e i particolari dei collegamenti alla fondazione.',
      'Le fotografie del febbraio 2023 mostrano la torre montata: le lame corten contro il bianco della facciata, la rampa che sale all’interno e lo spazio circolare alla base.',
    ],
    sheets: {
      'tavola-1': ['Esecutivo strutturale · Pianta e sezione della scala', 'Esecutivo strutturale · Prospetti, gradini e particolari'],
      'tavola-2': [
        'Progetto MCA · Planimetria del giardino',
        'Progetto MCA · Piante della scala e dei percorsi',
        'Progetto MCA · Vista dalla strada',
        'Progetto MCA · Vista dal primo piano',
        'Progetto MCA · Usi e stagioni',
        'Progetto MCA · Materiali: acciaio e legno',
        'Progetto MCA · Dettagli della scala',
        'Progetto MCA · Rendering dalla strada',
        'Progetto MCA · Rendering dal giardino verso la scala',
      ],
    },
    photos: {
      'img-20230222-134727': 'La torre di lame corten nel giardino, dalla strada',
      'img-20230222-134709': 'Il cilindro della scala contro la facciata bianca',
      'img-20230222-134254': 'Le lame verticali e gli edifici dell’azienda',
      'img-20230222-134300': 'L’attacco della torre all’edificio',
      'img-20230222-134339': 'La rampa elicoidale vista dall’interno del cilindro',
      'img-20230222-134355': 'I gradini a sbalzo e le lame, dal basso',
    },
    cover: 'img-20230222-134727',
    hero: 'img-20230222-134709',
    finito: true,
  },
]

/* ---------------------------------------------------------------------------
   Unione dei testi con i file generati
   --------------------------------------------------------------------------- */

const pad2 = (n) => String(n).padStart(2, '0')
const stem = (file) => file.replace(/\.[^.]+$/, '')

/** Costruisce il lavoro completo: testi + file + voci per il visualizzatore. */
function build(work) {
  const files = data[work.id]
  if (!files) throw new Error(`lavori: mancano i file di «${work.id}» in lavori.data.js (lancia npm run lavori)`)
  const dir = `/lavori/${work.id}`
  const category = categories.find((c) => c.id === work.category)
  const captions = work.photos || {}
  const titles = work.sheets || {}

  /* Tavole: una voce per pagina. Il PDF è il file originale, aperto dal
     visualizzatore; sotto, mentre si apre, sta l'anteprima webp. */
  const pages = files.sheets.flatMap((s) => {
    const base = stem(s.file)
    const t = titles[base]
    return s.pages.map((p, i) => ({
      id: `${base}-p${p.n}`,
      kind: 'pdf',
      tag: 'Tav.',
      title: Array.isArray(t) ? t[i] || `${s.name} · pagina ${p.n}` : t ? (s.pages.length > 1 ? `${t} · pagina ${p.n}` : t) : `${s.name} · pagina ${p.n}`,
      src: `${dir}/${s.file}`,
      page: p.n,
      paper: s.paper,
      width: 1200,
      height: Math.round((1200 * p.h) / p.w),
      thumb: `${dir}/${p.thumb}`,
      mini: `${dir}/${p.mini}`,
    }))
  })

  /* Fotografie: nell'ordine delle didascalie, poi le altre. */
  const byStem = new Map(files.photos.map((p) => [stem(p.file), p]))
  const ordered = [...Object.keys(captions).filter((k) => byStem.has(k)), ...files.photos.map((p) => stem(p.file)).filter((k) => !(k in captions))]
  const photos = ordered.map((k) => {
    const p = byStem.get(k)
    return {
      id: k,
      kind: 'image',
      tag: 'Foto',
      title: captions[k] || `Fotografia ${k}`,
      src: `${dir}/${p.file}`,
      width: p.w,
      height: p.h,
      thumb: `${dir}/${p.file}`,
      mini: `${dir}/${p.mini}`,
    }
  })

  /* Voci del visualizzatore: prima le tavole, poi le fotografie. */
  const items = [...pages, ...photos].map((it) => ({
    ...it,
    alt: `${work.title}: ${it.title}`,
    note: it.kind === 'pdf' ? `Tavola PDF, formato ${it.paper}. I dati personali del cartiglio sono oscurati.` : it.title,
  }))

  const coverId = work.cover || photos[0]?.id || pages[0]?.id
  const cover = items.find((it) => it.id === coverId) || items[0]
  const heroCover = items.find((it) => it.id === work.hero) || cover

  return {
    ...work,
    categoryLabel: category.label,
    path: `/lavori/${work.id}`,
    pages,
    photos,
    items,
    cover,
    heroCover,
    counts: { sheets: files.sheets.length, pages: pages.length, photos: photos.length },
  }
}

/** Tutti i lavori, dal più recente; a parità d'anno nell'ordine dell'elenco. */
export const lavori = works
  .map(build)
  .sort((a, b) => b.year - a.year)
  .map((w, i, all) => ({ ...w, index: all.length - i, num: pad2(all.length - i) }))

export const lavoriById = Object.fromEntries(lavori.map((w) => [w.id, w]))

/** Statistiche per la pagina principale. */
export const lavoriStats = {
  total: lavori.length,
  from: Math.min(...lavori.map((w) => w.year)),
  to: Math.max(...lavori.map((w) => w.year)),
  sheets: lavori.reduce((n, w) => n + w.counts.pages, 0),
  photos: lavori.reduce((n, w) => n + w.counts.photos, 0),
  byCategory: Object.fromEntries(categories.map((c) => [c.id, lavori.filter((w) => w.category === c.id).length])),
}

/**
 * I lavori in evidenza nel carosello della pagina principale. Non sono scelti
 * a mano: li decide un punteggio, così la selezione si aggiorna da sola
 * quando arrivano lavori nuovi.
 *
 * - Requisito: almeno 3 fotografie. Un lavoro con una o due foto, o con le
 *   sole tavole, non regge un'immagine larga in apertura.
 * - Fotografie: 1 punto ciascuna, fino a 10 (la documentazione).
 * - Recenza: mezzo punto per ogni anno dopo il 2010.
 * - Prima e dopo: 3 punti se le foto raccontano la trasformazione.
 * - Finito: 2 punti se c'è una buona fotografia del lavoro concluso.
 *
 * Entrano i primi 10, più il migliore di ogni categoria rimasta fuori, se
 * supera i 12 punti: così il carosello non è fatto di sole case. L'ordine è
 * quello del punteggio, dal più alto. Fa eccezione il lavoro segnato
 * `apertura`: lo sceglie lo studio, entra comunque ed è sempre il primo.
 */
const FEATURED_MIN_PHOTOS = 3
const FEATURED_TOP = 10
const FEATURED_EXTRA_MIN = 12

export const scoreOf = (w) =>
  Math.min(w.counts.photos, 10) + (w.year - 2010) * 0.5 + (w.primaDopo ? 3 : 0) + (w.finito ? 2 : 0)

export const lavoriInEvidenza = (() => {
  const ranked = lavori
    .filter((w) => w.counts.photos >= FEATURED_MIN_PHOTOS)
    .map((w) => ({ w, score: scoreOf(w) }))
    .sort((a, b) => b.score - a.score || b.w.year - a.w.year)
  const first = lavori.find((w) => w.apertura)
  const picked = ranked.filter((r) => r.w !== first).slice(0, FEATURED_TOP)
  for (const c of categories) {
    if (picked.some((p) => p.w.category === c.id)) continue
    const best = ranked.find((r) => r.w.category === c.id && r.score > FEATURED_EXTRA_MIN)
    if (best) picked.push(best)
  }
  const rest = picked.sort((a, b) => b.score - a.score).map((p) => p.w)
  return first ? [first, ...rest] : rest
})()

/** Il lavoro prima e dopo nell'archivio (per la navigazione nella scheda). */
export function neighbours(id) {
  const i = lavori.findIndex((w) => w.id === id)
  return { prev: lavori[i + 1] || null, next: lavori[i - 1] || null }
}
