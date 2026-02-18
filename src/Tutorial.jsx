import { useEffect, useState, useCallback } from 'react'
import { BRAND, RAMP_LIP, LANDING_MULT, GAME_W, GAME_H } from './constants'

const FONT = "'Open Sans','Segoe UI',system-ui,sans-serif"

// Keyframe animations injected once
const STYLE_ID = 'tutorial-keyframes'
const KEYFRAMES = `
@keyframes tapPulse {
  0%, 100% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.3); opacity: 1; }
}
@keyframes tutorialFadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes tutorialPulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
@keyframes glowRing {
  0%, 100% { box-shadow: 0 0 8px ${BRAND.blue}88, 0 0 20px ${BRAND.blue}44; }
  50% { box-shadow: 0 0 14px ${BRAND.blue}cc, 0 0 32px ${BRAND.blue}66; }
}
`

function injectKeyframes() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = KEYFRAMES
  document.head.appendChild(style)
}

export default function Tutorial({ onDismiss, gameScale }) {
  const [step, setStep] = useState(0) // 0 = step 1, 1 = step 2
  const [opacity, setOpacity] = useState(1)

  // Inject keyframes on mount
  useEffect(() => {
    injectKeyframes()
  }, [])

  const advance = useCallback(() => {
    if (step === 0) {
      // Fade transition to step 2
      setOpacity(0)
      setTimeout(() => {
        setStep(1)
        setOpacity(1)
      }, 200)
    } else {
      onDismiss()
    }
  }, [step, onDismiss])

  // Listen for spacebar
  useEffect(() => {
    const handler = (e) => {
      if (e.code === 'Space') {
        e.preventDefault()
        advance()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [advance])

  const scale = gameScale || 1

  // Scaled positions
  const lipX = RAMP_LIP.x * scale
  const lipY = RAMP_LIP.y * scale
  const highlightRadius = 44 * scale

  // Landing zone highlight — lower right area of the game
  const landingX = 300 * scale
  const landingY = 500 * scale
  const landingW = 160 * scale
  const landingH = 120 * scale

  return (
    <div
      onClick={advance}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: GAME_W * scale,
        height: GAME_H * scale,
        zIndex: 9999,
        cursor: 'pointer',
        fontFamily: FONT,
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Dark overlay with backdrop blur */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        transition: 'opacity 200ms ease',
        opacity,
      }} />

      {/* Content — fades between steps */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        transition: 'opacity 200ms ease',
        opacity,
      }}>
        {step === 0 ? (
          /* ============== STEP 1: Launch Timing ============== */
          <>
            {/* Highlighted circle around ramp lip */}
            <div style={{
              position: 'absolute',
              left: lipX - highlightRadius,
              top: lipY - highlightRadius,
              width: highlightRadius * 2,
              height: highlightRadius * 2,
              borderRadius: '50%',
              border: `2px solid ${BRAND.blue}`,
              background: 'rgba(37,99,235,0.08)',
              animation: 'glowRing 2s ease-in-out infinite',
              pointerEvents: 'none',
            }} />

            {/* Tap emoji near the lip */}
            <div style={{
              position: 'absolute',
              left: lipX + highlightRadius + 8 * scale,
              top: lipY - 14 * scale,
              fontSize: `${Math.max(28, 28 * scale)}px`,
              animation: 'tapPulse 1.2s ease-in-out infinite',
              pointerEvents: 'none',
            }}>
              👆
            </div>

            {/* Main text — centred above the highlight */}
            <div style={{
              position: 'absolute',
              top: Math.max(40 * scale, lipY - highlightRadius - 120 * scale),
              left: 0,
              right: 0,
              textAlign: 'center',
              animation: 'tutorialFadeUp 0.4s ease-out both',
              pointerEvents: 'none',
            }}>
              <div style={{
                fontSize: `${Math.max(20, 22 * scale)}px`,
                fontWeight: 800,
                color: BRAND.white,
                marginBottom: 8 * scale,
                textShadow: `0 2px 12px rgba(0,0,0,0.5)`,
              }}>
                TAP when the ring turns green!
              </div>
              <div style={{
                fontSize: `${Math.max(13, 14 * scale)}px`,
                fontWeight: 500,
                color: BRAND.grayLight,
              }}>
                Time your launch at the lip of the ramp
              </div>
            </div>
          </>
        ) : (
          /* ============== STEP 2: Landing Timing ============== */
          <>
            {/* Highlighted rectangle around landing zone */}
            <div style={{
              position: 'absolute',
              left: landingX - landingW / 2,
              top: landingY - landingH / 2,
              width: landingW,
              height: landingH,
              borderRadius: 12 * scale,
              border: `2px solid ${BRAND.blue}`,
              background: 'rgba(37,99,235,0.08)',
              animation: 'glowRing 2s ease-in-out infinite',
              pointerEvents: 'none',
            }} />

            {/* Main text — upper portion */}
            <div style={{
              position: 'absolute',
              top: 60 * scale,
              left: 0,
              right: 0,
              textAlign: 'center',
              animation: 'tutorialFadeUp 0.4s ease-out both',
              pointerEvents: 'none',
            }}>
              <div style={{
                fontSize: `${Math.max(20, 22 * scale)}px`,
                fontWeight: 800,
                color: BRAND.white,
                marginBottom: 8 * scale,
                textShadow: `0 2px 12px rgba(0,0,0,0.5)`,
              }}>
                TAP again to nail the landing!
              </div>
              <div style={{
                fontSize: `${Math.max(14, 15 * scale)}px`,
                fontWeight: 700,
                color: BRAND.green,
                marginBottom: 20 * scale,
              }}>
                Perfect timing = {LANDING_MULT.telemark}x distance bonus!
              </div>

              {/* Multiplier breakdown */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6 * scale,
              }}>
                {[
                  { emoji: '\u2708\uFE0F', label: 'Telemark', mult: LANDING_MULT.telemark, color: BRAND.green },
                  { emoji: '\uD83C\uDFBF', label: 'Clean', mult: LANDING_MULT.clean, color: BRAND.blueLight },
                  { emoji: '\uD83D\uDE2C', label: 'Shaky', mult: LANDING_MULT.shaky, color: BRAND.orange },
                  { emoji: '\uD83D\uDCA5', label: 'Crash', mult: LANDING_MULT.crash, color: BRAND.red },
                ].map((grade) => (
                  <div key={grade.label} style={{
                    fontSize: `${Math.max(13, 13 * scale)}px`,
                    fontWeight: 600,
                    color: grade.color,
                    letterSpacing: '0.3px',
                  }}>
                    {grade.emoji} {grade.label} = {grade.mult}x
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Step indicator dots */}
        <div style={{
          position: 'absolute',
          bottom: 52 * scale,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
          pointerEvents: 'none',
        }}>
          {[0, 1].map((i) => (
            <div key={i} style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: step === i ? BRAND.blue : 'transparent',
              border: `2px solid ${step === i ? BRAND.blue : BRAND.gray}`,
              transition: 'all 200ms ease',
            }} />
          ))}
        </div>

        {/* Bottom prompt */}
        <div style={{
          position: 'absolute',
          bottom: 20 * scale,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: `${Math.max(12, 13 * scale)}px`,
          fontWeight: 600,
          color: BRAND.grayLight,
          animation: 'tutorialPulse 2s ease-in-out infinite',
          pointerEvents: 'none',
          letterSpacing: '0.5px',
        }}>
          {step === 0 ? 'Tap to continue' : 'Tap to start jumping!'}
        </div>
      </div>
    </div>
  )
}
