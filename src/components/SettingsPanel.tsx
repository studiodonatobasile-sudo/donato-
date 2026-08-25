import { ALARM_SOUNDS, type AlarmSoundId, type AppSettings } from '../types'
import { playAlertSound } from '../utils/audioAlerts'

interface Props {
  settings: AppSettings
  onChange: (settings: AppSettings) => void
  onClose: () => void
}

export function SettingsPanel({ settings, onChange, onClose }: Props) {
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

        <div className="form-actions">
          <button type="button" className="btn primary" onClick={onClose}>
            Chiudi
          </button>
        </div>
      </div>
    </div>
  )
}
