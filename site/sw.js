// "Interruttore" per disinstallare il vecchio service worker della prima
// versione del sito (quando qui c'era solo Agenda Vocale, pubblicata dalla
// radice /donato-/). Quel service worker aveva ambito sull'intera cartella
// e intercettava anche le nuove sottocartelle (/spese-familiari/,
// /agenda-vocale/), servendo sempre la vecchia pagina dalla cache.
//
// Essendo pubblicato nello stesso percorso (/donato-/sw.js), il browser lo
// rileva come aggiornamento del vecchio service worker, lo installa al posto
// suo, cancella le cache lasciate dalla versione precedente e si
// disinstalla, cosi' le richieste tornano a passare normalmente dalla rete.
// Ogni nuova app (Spese Familiari, Agenda Vocale) registra poi il proprio
// service worker con ambito limitato alla propria sottocartella, senza
// interferire con le altre.

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.map((key) => caches.delete(key)))
      await self.registration.unregister()
      const clientsList = await self.clients.matchAll({ type: 'window' })
      for (const client of clientsList) {
        client.navigate(client.url)
      }
    })()
  )
})
