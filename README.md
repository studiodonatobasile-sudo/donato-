# 🗓️ Agenda Vocale

App web (PWA) per tenere traccia di appuntamenti e note, con registrazione vocale,
allegati e avvisi sonori. I dati restano **interamente sul dispositivo** (IndexedDB del
browser): non c'e' un server, nessun account, nessun dato inviato altrove.

## Funzionalità

- **Appuntamenti e note**: titolo, data, ora, luogo, testo libero.
- **Comando vocale**: tocca il microfono e parla, ad es.:
  - _"Appuntamento dal dentista domani alle 15 con avviso sonoro"_
  - _"Nota comprare il regalo per sabato"_
  - _"Riunione lunedì alle nove e mezza con la sveglia sirena 10 minuti prima"_

  Il comando viene interpretato e mostrato in un modulo precompilato **da confermare o
  correggere** prima di salvare (il riconoscimento vocale non e' infallibile).
- **Nota vocale**: registra un messaggio audio da allegare a ogni appuntamento/nota,
  con anteprima e riproduzione.
- **Allegati**: aggiungi uno o più documenti (PDF, immagini, ecc.) a ogni voce.
- **Avvisi sonori**: attiva un allarme che suona (con notifica del browser, se
  autorizzata) all'orario dell'appuntamento o con un anticipo configurabile in minuti.
  4 suoni sintetizzati a scelta (Campanello, Sirena, Ding, Allegro), provabili prima di
  salvare.
- **Riepilogo mattutino**: ogni mattina, alla prima apertura dell'app dopo l'orario
  impostato (08:00 di default, personalizzabile), compare un riepilogo con gli
  appuntamenti/note del giorno, gli elementi scaduti non completati e le note senza
  data. Può anche essere letto ad alta voce.

## Requisiti del browser

- Il **riconoscimento vocale** (comandi vocali, dettatura) richiede Chrome, Edge o un
  browser basato su Chromium (desktop o Android). Safari/Firefox non lo supportano
  ancora pienamente.
- La **registrazione della nota vocale** richiede l'accesso al microfono: il browser
  chiederà il permesso al primo utilizzo. Funziona solo in contesti sicuri
  (`https://` o `localhost`).
- Le **notifiche del browser** sono facoltative (impostazioni → Abilita notifiche) e si
  affiancano al suono, che parte comunque mentre l'app è aperta.

> ⚠️ Come ogni app web senza backend, gli avvisi sonori e il riepilogo mattutino
> funzionano quando l'app è aperta (scheda del browser o installata come app). Per non
> perdere gli avvisi conviene installarla sulla schermata Home/Desktop (il browser
> mostrerà l'opzione "Installa app") e lasciarla in esecuzione.

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
- IndexedDB (tramite `idb`) per note, appuntamenti, allegati e note vocali
- Web Speech API (`SpeechRecognition` / `SpeechSynthesis`) per comandi vocali e lettura
  del riepilogo
- `MediaRecorder` per le note vocali
- Web Audio API per i suoni di avviso sintetizzati (nessun file audio da scaricare)
- `vite-plugin-pwa` per l'installabilità come app
