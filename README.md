# App di famiglia

Sito con più app web (PWA) indipendenti per la famiglia, pubblicato su GitHub Pages.
Ogni app vive nella propria sottocartella, ha il proprio codice e i propri dati (in
IndexedDB, solo sul dispositivo): non c'è un server, nessun account, nessun dato
condiviso tra le app o inviato altrove.

Una landing page (`site/`) elenca le app disponibili e rimanda a ciascuna.

## App disponibili

- **[Spese Familiari](apps/spese-familiari/README.md)** — monitoraggio quotidiano
  delle spese di famiglia, annotazione vocale con riscontro automatico della
  categoria, riepiloghi giornalieri/settimanali/mensili con grafici.
- **[Agenda Vocale](apps/agenda-vocale/README.md)** — appuntamenti e note con
  comandi vocali, allegati e avvisi sonori.

## Struttura del repository

```
site/                    landing page statica (nessuna build)
apps/
  spese-familiari/        app React + Vite indipendente
  agenda-vocale/           app React + Vite indipendente
.github/workflows/        build delle app + pubblicazione su GitHub Pages
```

Ogni cartella in `apps/` è un progetto Vite a sé stante, con il proprio
`package.json`. Per lavorare su una singola app:

```bash
cd apps/spese-familiari   # oppure apps/agenda-vocale
npm install
npm run dev
```

## Build di produzione

Il workflow di deploy compila entrambe le app e le assembla insieme alla landing
page in un'unica cartella `dist/`, pubblicata su GitHub Pages come:

- `/` → landing page
- `/spese-familiari/` → app Spese Familiari
- `/agenda-vocale/` → app Agenda Vocale

Per riprodurre la build localmente:

```bash
(cd apps/spese-familiari && npm install && npm run build)
(cd apps/agenda-vocale && npm install && npm run build)
mkdir -p dist
cp -r site/. dist/
cp -r apps/spese-familiari/dist dist/spese-familiari
cp -r apps/agenda-vocale/dist dist/agenda-vocale
```

## Aggiungere una nuova app

1. Crea una nuova cartella in `apps/<nome-app>/` con il proprio progetto Vite.
2. Imposta `BASE_PATH = '/donato-/<nome-app>/'` nel suo `vite.config.ts` (in build;
   in sviluppo resta `'/'`).
3. Aggiungi una card in `site/index.html` che rimanda a `./<nome-app>/`.
4. Aggiungi i passaggi di build e copia per la nuova app nel workflow
   `.github/workflows/deploy-pages.yml`.
