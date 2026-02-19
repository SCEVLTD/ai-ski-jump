// AI Ski Jump Championship — Sound System (Web Audio API)
// Pure synthesized sounds, no audio files needed.

let audioCtx = null
let muted = false

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

export function setMuted(m) { muted = m }
export function isMuted() { return muted }

// Helper: create a white noise buffer source
function createWhiteNoise(ctx, duration) {
  const bufferSize = Math.ceil(ctx.sampleRate * duration)
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1
  }
  const source = ctx.createBufferSource()
  source.buffer = buffer
  return source
}

export function playSound(type) {
  if (muted) return null
  try {
    const ctx = getCtx()
    const now = ctx.currentTime

    switch (type) {

      // -------------------------------------------------------
      // WHOOSH — Ramp slide: descending sine 400→200Hz, 300ms
      // -------------------------------------------------------
      case 'whoosh': {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(400, now)
        osc.frequency.linearRampToValueAtTime(200, now + 0.3)
        gain.gain.setValueAtTime(0.3, now)
        gain.gain.linearRampToValueAtTime(0, now + 0.3)
        osc.connect(gain).connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.3)
        return null
      }

      // -------------------------------------------------------
      // LAUNCH — Sharp pop when jumper leaves the lip
      // Quick ascending tone + subtle click layered on top
      // -------------------------------------------------------
      case 'launch': {
        // Ascending tone: 200→600Hz, 100ms
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(200, now)
        osc.frequency.linearRampToValueAtTime(600, now + 0.1)
        gain.gain.setValueAtTime(0.4, now)
        gain.gain.linearRampToValueAtTime(0, now + 0.1)
        osc.connect(gain).connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.1)

        // Subtle click: square wave 1000Hz, 10ms
        const click = ctx.createOscillator()
        const clickGain = ctx.createGain()
        click.type = 'square'
        click.frequency.setValueAtTime(1000, now)
        clickGain.gain.setValueAtTime(0.15, now)
        clickGain.gain.linearRampToValueAtTime(0, now + 0.01)
        click.connect(clickGain).connect(ctx.destination)
        click.start(now)
        click.stop(now + 0.01)
        return null
      }

      // -------------------------------------------------------
      // WIND — Continuous filtered white noise (looping, stoppable)
      // Bandpass 200-800Hz, gain 0.15
      // Returns { stop() } reference
      // -------------------------------------------------------
      case 'wind': {
        // Use a longer buffer and loop it for continuous wind
        const bufferDuration = 2
        const bufferSize = Math.ceil(ctx.sampleRate * bufferDuration)
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
        const data = buffer.getChannelData(0)
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1
        }
        const source = ctx.createBufferSource()
        source.buffer = buffer
        source.loop = true

        const bandpass = ctx.createBiquadFilter()
        bandpass.type = 'bandpass'
        bandpass.frequency.setValueAtTime(500, now) // center between 200-800
        bandpass.Q.setValueAtTime(0.5, now) // wide bandwidth

        const gain = ctx.createGain()
        gain.gain.setValueAtTime(0.15, now)

        source.connect(bandpass).connect(gain).connect(ctx.destination)
        source.start(now)

        return {
          stop: () => {
            try {
              gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1)
              source.stop(ctx.currentTime + 0.15)
            } catch (_) {}
          }
        }
      }

      // -------------------------------------------------------
      // LANDING_GOOD — Clean landing
      // Crunch (white noise burst 80ms) + ascending ding (400→700Hz, 200ms)
      // -------------------------------------------------------
      case 'landing_good': {
        // Crunch: white noise burst 80ms
        const noise = createWhiteNoise(ctx, 0.08)
        const noiseGain = ctx.createGain()
        noiseGain.gain.setValueAtTime(0.3, now)
        noiseGain.gain.linearRampToValueAtTime(0, now + 0.08)
        noise.connect(noiseGain).connect(ctx.destination)
        noise.start(now)

        // Ascending ding: sine 400→700Hz, 200ms
        const osc = ctx.createOscillator()
        const oscGain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(400, now)
        osc.frequency.linearRampToValueAtTime(700, now + 0.2)
        oscGain.gain.setValueAtTime(0.25, now)
        oscGain.gain.linearRampToValueAtTime(0, now + 0.2)
        osc.connect(oscGain).connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.2)
        return null
      }

      // -------------------------------------------------------
      // LANDING_PERFECT — Telemark / perfect landing
      // Crunch + double ascending tone + crowd cheer
      // -------------------------------------------------------
      case 'landing_perfect': {
        // Crunch: white noise burst 60ms
        const noise = createWhiteNoise(ctx, 0.06)
        const noiseGain = ctx.createGain()
        noiseGain.gain.setValueAtTime(0.3, now)
        noiseGain.gain.linearRampToValueAtTime(0, now + 0.06)
        noise.connect(noiseGain).connect(ctx.destination)
        noise.start(now)

        // First ascending tone: 400→800Hz, 150ms
        const osc1 = ctx.createOscillator()
        const gain1 = ctx.createGain()
        osc1.type = 'sine'
        osc1.frequency.setValueAtTime(400, now)
        osc1.frequency.linearRampToValueAtTime(800, now + 0.15)
        gain1.gain.setValueAtTime(0.25, now)
        gain1.gain.linearRampToValueAtTime(0, now + 0.15)
        osc1.connect(gain1).connect(ctx.destination)
        osc1.start(now)
        osc1.stop(now + 0.15)

        // Second ascending tone: 600→1200Hz, 150ms, overlapping (starts at 80ms)
        const osc2 = ctx.createOscillator()
        const gain2 = ctx.createGain()
        osc2.type = 'sine'
        osc2.frequency.setValueAtTime(600, now + 0.08)
        osc2.frequency.linearRampToValueAtTime(1200, now + 0.23)
        gain2.gain.setValueAtTime(0, now)
        gain2.gain.setValueAtTime(0.25, now + 0.08)
        gain2.gain.linearRampToValueAtTime(0, now + 0.23)
        osc2.connect(gain2).connect(ctx.destination)
        osc2.start(now)
        osc2.stop(now + 0.23)

        // Crowd cheer: filtered white noise burst, bandpass 300-2000Hz, 500ms
        const cheer = createWhiteNoise(ctx, 0.5)
        const cheerFilter = ctx.createBiquadFilter()
        cheerFilter.type = 'bandpass'
        cheerFilter.frequency.setValueAtTime(1150, now) // center of 300-2000
        cheerFilter.Q.setValueAtTime(0.4, now) // wide bandwidth
        const cheerGain = ctx.createGain()
        cheerGain.gain.setValueAtTime(0, now)
        cheerGain.gain.linearRampToValueAtTime(0.2, now + 0.05)
        cheerGain.gain.setValueAtTime(0.2, now + 0.3)
        cheerGain.gain.linearRampToValueAtTime(0, now + 0.5)
        cheer.connect(cheerFilter).connect(cheerGain).connect(ctx.destination)
        cheer.start(now)
        return null
      }

      // -------------------------------------------------------
      // LANDING_BAD — Crash landing
      // Low thud + descending tone + quick noise burst
      // -------------------------------------------------------
      case 'landing_bad': {
        // Low thud: sine 100Hz, 200ms
        const thud = ctx.createOscillator()
        const thudGain = ctx.createGain()
        thud.type = 'sine'
        thud.frequency.setValueAtTime(100, now)
        thudGain.gain.setValueAtTime(0.4, now)
        thudGain.gain.linearRampToValueAtTime(0, now + 0.2)
        thud.connect(thudGain).connect(ctx.destination)
        thud.start(now)
        thud.stop(now + 0.2)

        // Descending tone: 300→80Hz over 300ms
        const desc = ctx.createOscillator()
        const descGain = ctx.createGain()
        desc.type = 'sine'
        desc.frequency.setValueAtTime(300, now)
        desc.frequency.linearRampToValueAtTime(80, now + 0.3)
        descGain.gain.setValueAtTime(0.3, now)
        descGain.gain.linearRampToValueAtTime(0, now + 0.3)
        desc.connect(descGain).connect(ctx.destination)
        desc.start(now)
        desc.stop(now + 0.3)

        // Quick noise burst: unfiltered, 50ms
        const noise = createWhiteNoise(ctx, 0.05)
        const noiseGain = ctx.createGain()
        noiseGain.gain.setValueAtTime(0.3, now)
        noiseGain.gain.linearRampToValueAtTime(0, now + 0.05)
        noise.connect(noiseGain).connect(ctx.destination)
        noise.start(now)
        return null
      }

      // -------------------------------------------------------
      // CROWD — Crowd roar (for new records, etc.)
      // Filtered white noise, bandpass 400-3000Hz, ~600ms envelope
      // -------------------------------------------------------
      case 'crowd': {
        const noise = createWhiteNoise(ctx, 0.6)
        const bandpass = ctx.createBiquadFilter()
        bandpass.type = 'bandpass'
        bandpass.frequency.setValueAtTime(1700, now) // center of 400-3000
        bandpass.Q.setValueAtTime(0.35, now) // wide bandwidth
        const gain = ctx.createGain()
        // Envelope: 0→0.3 over 100ms, sustain 300ms, fade 0→ over 200ms
        gain.gain.setValueAtTime(0, now)
        gain.gain.linearRampToValueAtTime(0.3, now + 0.1)
        gain.gain.setValueAtTime(0.3, now + 0.4)
        gain.gain.linearRampToValueAtTime(0, now + 0.6)
        noise.connect(bandpass).connect(gain).connect(ctx.destination)
        noise.start(now)
        return null
      }

      // -------------------------------------------------------
      // TICK — UI click for transitions
      // Square wave 800Hz, 30ms
      // -------------------------------------------------------
      case 'tick': {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'square'
        osc.frequency.setValueAtTime(800, now)
        gain.gain.setValueAtTime(0.15, now)
        gain.gain.linearRampToValueAtTime(0, now + 0.03)
        osc.connect(gain).connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.03)
        return null
      }

      // -------------------------------------------------------
      // COUNTDOWN — Round intro tick (3-2-1 style)
      // Sine wave 440Hz (A4), 80ms, clean musical note
      // -------------------------------------------------------
      case 'countdown': {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(440, now)
        gain.gain.setValueAtTime(0.2, now)
        gain.gain.setValueAtTime(0.2, now + 0.05)
        gain.gain.linearRampToValueAtTime(0, now + 0.08)
        osc.connect(gain).connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.08)
        return null
      }

      default:
        return null
    }
  } catch (_) {
    return null
  }
}

export function vibrate(pattern) {
  if (navigator.vibrate) {
    navigator.vibrate(pattern)
  }
}
