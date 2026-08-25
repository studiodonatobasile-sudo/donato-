# 💶 Spese Familiari

App web (PWA) per il monitoraggio quotidiano delle spese familiari, con annotazione
vocale, riscontro automatico della categoria di spesa e riepiloghi periodici con
grafici. I dati restano **interamente sul dispositivo** (IndexedDB del browser): non
c'è un server, nessun account, nessun dato inviato altrove.

## Funzionalità

- **Annotazione rapida delle spese**: importo, descrizione, data/ora e — opzionale —
  quale membro della famiglia ha speso.
- **Comando vocale**: tocca il microfono e annuncia la spesa, ad es.:
  - _"15 euro spesa al supermercato"_
  - _"ho pagato 8 euro e 50 per la benzina"_

  L'importo e la descrizione vengono estratti automaticamente e mostrati in un
  modulo precompilato **da confermare o correggere** prima di salvare (il
  riconoscimento vocale non è infallibile).
- **Riscontro automatico della categoria**: la descrizione viene analizzata con un
  elenco di parole chiave in italiano e classificata in una delle oltre 50
  sottocategorie (es. Supermercato, Farmacia, Ristoranti e pizzerie, Carburante,
  Asilo e babysitter…), raggruppate in 8 macro-categorie (Alimentari, Trasporti,
  Casa e bollette, Salute, Svago, Abbigliamento, Istruzione e bambini, Altro). La
  sottocategoria proposta è sempre modificabile manualmente dal menu, organizzato
  per macro-categoria.
- **Dashboard con grafici**: vista Oggi / Settimana / Mese con totale speso,
  variazione rispetto al periodo precedente, ripartizione per macro-categoria
  (grafico a ciambella, per restare leggibile) e andamento giornaliero (grafico a
  barre), oltre all'elenco dei movimenti — con la sottocategoria specifica di ogni
  spesa — con modifica ed eliminazione.
- **Riepiloghi automatici**: ogni giorno alle 21:00 (personalizzabile) compare un
  riepilogo giornaliero; la domenica alle 21:00 anche il riepilogo settimanale;
  l'ultimo giorno del mese alle 21:00 anche il riepilogo mensile. Ogni riepilogo
  mostra il totale, la variazione rispetto al periodo precedente e i grafici, e può
  essere letto ad alta voce. I riepiloghi sono anche richiamabili in ogni momento
  dal pulsante 📊.
- **Budget mensile opzionale**: imposta un obiettivo di spesa mensile per vedere a
  colpo d'occhio quanto ne hai già usato nel riepilogo mensile.
- **Notifiche del browser**: facoltative (impostazioni → Abilita notifiche), avvisano
  quando un riepilogo è pronto anche se la scheda non è in primo piano.

## Requisiti del browser

- Il **riconoscimento vocale** richiede Chrome, Edge o un browser basato su Chromium
  (desktop o Android). Safari/Firefox non lo supportano ancora pienamente.
- Le **notifiche del browser** sono facoltative e funzionano solo in contesti sicuri
  (`https://` o `localhost`).

> ⚠️ Come ogni app web senza backend, i riepiloghi periodici vengono mostrati quando
> l'app è aperta all'orario impostato (o alla prima apertura successiva, per
> recuperare quelli persi). Per non perderli conviene installarla sulla schermata
> Home/Desktop (il browser mostrerà l'opzione "Installa app") e lasciarla aperta.

## Sviluppo

```bash
npm install
npm run dev
```

## Build di produzione

```bash
npm run build
npm run preview
```

## Stack tecnico

- React + TypeScript + Vite
- IndexedDB (tramite `idb`) per le spese e le impostazioni
- Web Speech API (`SpeechRecognition` / `SpeechSynthesis`) per l'annotazione vocale e
  la lettura dei riepiloghi
- Grafici SVG disegnati a mano (ciambella per categoria, barre per l'andamento
  giornaliero), nessuna libreria esterna
- `vite-plugin-pwa` per l'installabilità come app
