import { useEffect, useCallback } from 'react'
import { BRAND, GAME_W, GAME_H } from './constants'

const FONT = "'Open Sans','Segoe UI',system-ui,sans-serif"

const STYLE_ID = 'tutorial-keyframes'
const KEYFRAMES = `
@keyframes tutorialFadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes dotMove {
  0% { left: 15%; top: 60%; opacity: 0; }
  10% { opacity: 1; }
  35% { left: 35%; top: 75%; }
  36% { left: 35%; top: 75%; filter: brightness(2); }
  40% { filter: brightness(1); }
  65% { left: 70%; top: 45%; }
  66% { left: 70%; top: 45%; filter: brightness(2); }
  70% { filter: brightness(1); }
  90% { left: 85%; top: 75%; opacity: 1; }
  100% { left: 85%; top: 75%; opacity: 0; }
}
@keyframes tapFlash1 {
  0%, 34% { opacity: 0; transform: scale(0.5); }
  36% { opacity: 1; transform: scale(1.3); }
  42% { opacity: 0; transform: scale(1.8); }
  100% { opacity: 0; }
}
@keyframes tapFlash2 {
  0%, 64% { opacity: 0; transform: scale(0.5); }
  66% { opacity: 1; transform: scale(1.3); }
  72% { opacity: 0; transform: scale(1.8); }
  100% { opacity: 0; }
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
  useEffect(() => {
    injectKeyframes()
  }, [])

  const dismiss = useCallback(() => {
    onDismiss()
  }, [onDismiss])

  useEffect(() => {
    const handler = (e) => {
      if (e.code === 'Space') {
        e.preventDefault()
        dismiss()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [dismiss])

  const scale = gameScale || 1

  return (
    <div
      onClick={dismiss}
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
      {/* Dark overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }} />

      {/* Content */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${20 * scale}px`,
      }}>
        {/* Main instruction */}
        <div style={{
          fontSize: `${Math.max(26, 28 * scale)}px`,
          fontWeight: 800,
          color: BRAND.white,
          textAlign: 'center',
          marginBottom: 8 * scale,
          animation: 'tutorialFadeUp 0.4s ease-out both',
          textShadow: '0 2px 12px rgba(0,0,0,0.5)',
          lineHeight: 1.3,
        }}>
          Tap to Launch.
          <br />
          Tap to Land.
        </div>

        {/* Sub text */}
        <div style={{
          fontSize: `${Math.max(13, 14 * scale)}px`,
          fontWeight: 500,
          color: BRAND.grayLight,
          textAlign: 'center',
          marginBottom: 28 * scale,
          animation: 'tutorialFadeUp 0.4s ease-out 0.1s both',
        }}>
          Time your taps for maximum distance!
        </div>

        {/* Animated diagram */}
        <div style={{
          position: 'relative',
          width: Math.min(300 * scale, GAME_W * scale - 40),
          height: 100 * scale,
          marginBottom: 32 * scale,
          animation: 'tutorialFadeUp 0.4s ease-out 0.2s both',
        }}>
          {/* Ramp line */}
          <svg
            viewBox="0 0 300 100"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
            }}
          >
            {/* Ramp slope */}
            <line x1="45" y1="60" x2="105" y2="78" stroke={BRAND.grayLight} strokeWidth="2" opacity="0.4" />
            {/* Flight arc */}
            <path d="M 105 78 Q 165 20 210 48" fill="none" stroke={BRAND.grayLight} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.3" />
            {/* Landing slope */}
            <line x1="210" y1="48" x2="265" y2="78" stroke={BRAND.grayLight} strokeWidth="2" opacity="0.4" />
          </svg>

          {/* Moving dot */}
          <div style={{
            position: 'absolute',
            width: 10 * scale,
            height: 10 * scale,
            borderRadius: '50%',
            background: BRAND.blue,
            boxShadow: `0 0 8px ${BRAND.blue}`,
            animation: 'dotMove 3s ease-in-out infinite',
            marginLeft: -5 * scale,
            marginTop: -5 * scale,
          }} />

          {/* Tap flash at launch point */}
          <div style={{
            position: 'absolute',
            left: '35%',
            top: '75%',
            width: 24 * scale,
            height: 24 * scale,
            borderRadius: '50%',
            border: `2px solid ${BRAND.green}`,
            marginLeft: -12 * scale,
            marginTop: -12 * scale,
            animation: 'tapFlash1 3s ease-out infinite',
            pointerEvents: 'none',
          }} />

          {/* Tap flash at landing point */}
          <div style={{
            position: 'absolute',
            left: '70%',
            top: '45%',
            width: 24 * scale,
            height: 24 * scale,
            borderRadius: '50%',
            border: `2px solid ${BRAND.green}`,
            marginLeft: -12 * scale,
            marginTop: -12 * scale,
            animation: 'tapFlash2 3s ease-out infinite',
            pointerEvents: 'none',
          }} />

          {/* Label: TAP 1 */}
          <div style={{
            position: 'absolute',
            left: '35%',
            top: '92%',
            transform: 'translateX(-50%)',
            fontSize: `${Math.max(10, 10 * scale)}px`,
            fontWeight: 700,
            color: BRAND.green,
            letterSpacing: '0.5px',
          }}>
            TAP
          </div>

          {/* Label: TAP 2 */}
          <div style={{
            position: 'absolute',
            left: '70%',
            top: '22%',
            transform: 'translateX(-50%)',
            fontSize: `${Math.max(10, 10 * scale)}px`,
            fontWeight: 700,
            color: BRAND.green,
            letterSpacing: '0.5px',
          }}>
            TAP
          </div>
        </div>

        {/* Got it button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            dismiss()
          }}
          style={{
            background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.blueDark})`,
            border: 'none',
            borderRadius: 12 * scale,
            padding: `${12 * scale}px ${36 * scale}px`,
            fontSize: `${Math.max(16, 16 * scale)}px`,
            fontWeight: 700,
            color: BRAND.white,
            cursor: 'pointer',
            fontFamily: FONT,
            boxShadow: `0 4px 20px ${BRAND.blue}44`,
            letterSpacing: '0.5px',
            animation: 'tutorialFadeUp 0.4s ease-out 0.3s both',
          }}
        >
          Got it!
        </button>
      </div>
    </div>
  )
}
