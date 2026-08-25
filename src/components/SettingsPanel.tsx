import { ALARM_SOUNDS, type AlarmSoundId, type AppSettings } from '../types'
import { playAlertSound } from '../utils/audioAlerts'
import type { UseGoogleCalendarResult } from '../hooks/useGoogleCalendar'

interface Props {
  settings: AppSettings
  onChange: (settings: AppSettings) => void
  onClose: () => void
  google: UseGoogleCalendarResult
}

function formatSyncTime(ts: number | null): string {
  if (!ts) return 'mai'
  return new Date(ts).toLocaleString('it-IT', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
}

export function SettingsPanel({ settings, onChange, onClose, google }: Props) {
  const notificationSupported = 'Notification' in window
  const permission = notificationSupported ? Notification.permission : 'unsupported'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>⚙️ Impostazioni</h2>

        <div className="field">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.morningSummaryEnabled}
              onChange={(e) => onChange({ ...settings, morningSummaryEnabled: e.target.checked })}
            />
            Mostra automaticamente il riepilogo ogni mattina
          </label>
        </div>

        <div className="field">
          <label htmlFor="summary-time">Orario del riepilogo mattutino</label>
          <input
            id="summary-time"
            type="time"
            value={settings.morningSummaryTime}
            onChange={(e) => onChange({ ...settings, morningSummaryTime: e.target.value })}
          />
          <p className="hint">
            Il riepilogo appare automaticamente la prima volta che apri l’app dopo quest’ora, ogni giorno.
            Per funzionare, l’app deve essere aperta: tienila installata o come scheda aperta se vuoi essere
            sicuro di non perderlo.
          </p>
        </div>

        <div className="field">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.speakSummaryAloud}
              onChange={(e) => onChange({ ...settings, speakSummaryAloud: e.target.checked })}
            />
            Leggi ad alta voce il riepilogo quando appare
          </label>
        </div>

        <div className="field">
          <label htmlFor="default-sound">Suono di avviso predefinito</label>
          <div className="alarm-options">
            <select
              id="default-sound"
              value={settings.defaultAlarmSound}
              onChange={(e) => onChange({ ...settings, defaultAlarmSound: e.target.value as AlarmSoundId })}
            >
              {ALARM_SOUNDS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <button type="button" className="btn secondary small" onClick={() => playAlertSound(settings.defaultAlarmSound)}>
              ▶️ Prova
            </button>
          </div>
        </div>

        <div className="field">
          <label>Notifiche del browser</label>
          {!notificationSupported && <p className="hint">Non supportate da questo browser.</p>}
          {notificationSupported && permission === 'granted' && <p className="hint">✅ Notifiche abilitate.</p>}
          {notificationSupported && permission === 'denied' && (
            <p className="hint">🚫 Notifiche bloccate. Abilitale dalle impostazioni del browser per questo sito.</p>
          )}
          {notificationSupported && permission === 'default' && (
            <button
              type="button"
              className="btn secondary"
              onClick={async () => {
                await Notification.requestPermission()
                onChange({ ...settings, notificationsRequested: true })
              }}
            >
              Abilita notifiche
            </button>
          )}
        </div>

        <div className="field">
          <label>📅 Google Calendar</label>
          <p className="hint">
            Sincronizza automaticamente gli appuntamenti con data con il tuo Google Calendar. Richiede un
            Client ID OAuth creato su Google Cloud Console (gratuito) — vedi le istruzioni nel README del
            progetto.
          </p>
          {!google.connected && (
            <input
              type="text"
              placeholder="Client ID (xxxxxxxx.apps.googleusercontent.com)"
              value={settings.googleClientId}
              onChange={(e) => onChange({ ...settings, googleClientId: e.target.value })}
            />
          )}
          {google.error && <p className="error-text">{google.error}</p>}
          <div className="alarm-options" style={{ marginTop: 8 }}>
            {!google.connected ? (
              <button type="button" className="btn secondary" disabled={google.connecting} onClick={() => void google.connect()}>
                {google.connecting ? 'Connessione…' : 'Connetti Google Calendar'}
              </button>
            ) : (
              <>
                <button type="button" className="btn secondary small" disabled={google.syncing} onClick={() => void google.syncNow()}>
                  {google.syncing ? 'Sincronizzo…' : '🔄 Sincronizza ora'}
                </button>
                <button type="button" className="btn secondary small" onClick={google.disconnect}>
                  Disconnetti
                </button>
              </>
            )}
          </div>
          {google.connected && (
            <p className="hint">✅ Connesso. Ultima sincronizzazione: {formatSyncTime(settings.googleLastSyncAt)}.</p>
          )}
          {settings.googleConnected && !google.connected && !google.connecting && (
            <p className="hint">
              ⚠️ La sessione con Google non è più attiva: tocca "Connetti Google Calendar" per riautorizzare.
            </p>
          )}
        </div>

        <div className="form-actions">
          <button type="button" className="btn primary" onClick={onClose}>
            Chiudi
          </button>
        </div>
      </div>
    </div>
  )
}
