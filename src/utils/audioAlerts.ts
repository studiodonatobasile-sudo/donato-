import type { AlarmSoundId } from '../types'

let sharedCtx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!sharedCtx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    sharedCtx = new Ctor()
  }
  if (sharedCtx.state === 'suspended') {
    void sharedCtx.resume()
  }
  return sharedCtx
}

function tone(ctx: AudioContext, freq: number, start: number, duration: number, gain = 0.2, type: OscillatorType = 'sine') {
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  g.gain.setValueAtTime(0, ctx.currentTime + start)
  g.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + 0.02)
  g.gain.linearRampToValueAtTime(0, ctx.currentTime + start + duration)
  osc.connect(g)
  g.connect(ctx.destination)
  osc.start(ctx.currentTime + start)
  osc.stop(ctx.currentTime + start + duration + 0.05)
}

const PATTERNS: Record<AlarmSoundId, (ctx: AudioContext) => void> = {
  campanello: (ctx) => {
    tone(ctx, 1046, 0, 0.18, 0.25, 'triangle')
    tone(ctx, 1318, 0.2, 0.18, 0.25, 'triangle')
    tone(ctx, 1046, 0.45, 0.25, 0.25, 'triangle')
  },
  sirena: (ctx) => {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'sawtooth'
    g.gain.value = 0.15
    osc.connect(g)
    g.connect(ctx.destination)
    const now = ctx.currentTime
    osc.frequency.setValueAtTime(440, now)
    osc.frequency.linearRampToValueAtTime(880, now + 0.4)
    osc.frequency.linearRampToValueAtTime(440, now + 0.8)
    osc.frequency.linearRampToValueAtTime(880, now + 1.2)
    osc.start(now)
    osc.stop(now + 1.3)
  },
  ding: (ctx) => {
    tone(ctx, 1760, 0, 0.5, 0.2, 'sine')
  },
  allegro: (ctx) => {
    ;[523, 659, 784, 1047].forEach((f, i) => tone(ctx, f, i * 0.12, 0.15, 0.22, 'square'))
  }
}

/** Riproduce un breve pattern sonoro sintetizzato per il suono di avviso scelto. */
export function playAlertSound(soundId: AlarmSoundId): void {
  try {
    const ctx = getCtx()
    PATTERNS[soundId](ctx)
  } catch (err) {
    console.warn('Impossibile riprodurre il suono di avviso', err)
  }
}

/** Riproduce ripetutamente il suono finche' non viene fermato, per un avviso piu' persistente. */
export function playAlertLoop(soundId: AlarmSoundId, times = 3, intervalMs = 1300): () => void {
  let count = 0
  playAlertSound(soundId)
  count++
  const id = window.setInterval(() => {
    if (count >= times) {
      window.clearInterval(id)
      return
    }
    playAlertSound(soundId)
    count++
  }, intervalMs)
  return () => window.clearInterval(id)
}

/** Sblocca l'AudioContext dopo un'interazione utente (richiesto da molti browser). */
export function unlockAudio(): void {
  try {
    getCtx()
  } catch {
    // ignora: alcuni browser non hanno AudioContext, non e' bloccante
  }
}
