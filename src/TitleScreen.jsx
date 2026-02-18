import { useEffect, useState } from 'react'
import { BRAND } from './constants'

const FONT = "'Open Sans','Segoe UI',system-ui,sans-serif"

// Generate snowflakes once (static array)
const SNOWFLAKES = Array.from({ length: 15 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  size: 2 + Math.random() * 2,
  duration: 8 + Math.random() * 7,
  delay: Math.random() * 10,
  opacity: 0.3 + Math.random() * 0.3,
}))

export default function TitleScreen({ onStart, bestScore, streak, challengerName, challengerScore }) {
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)')
    setIsDesktop(mq.matches)
    const handler = (e) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Spacebar to start on desktop
  useEffect(() => {
    if (!isDesktop) return
    const handler = (e) => {
      if (e.code === 'Space') {
        e.preventDefault()
        onStart()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isDesktop, onStart])

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: `linear-gradient(160deg, ${BRAND.dark} 0%, #0f1a2e 50%, ${BRAND.darkMid} 100%)`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: FONT,
      color: BRAND.white,
      overflow: 'hidden',
      position: 'relative',
      padding: '24px',
      boxSizing: 'border-box',
    }}>
      {/* Subtle grid overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.03,
        backgroundImage: `linear-gradient(${BRAND.blue} 1px, transparent 1px), linear-gradient(90deg, ${BRAND.blue} 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      {/* Snowfall */}
      {SNOWFLAKES.map((s) => (
        <div key={s.id} style={{
          position: 'absolute',
          left: s.left,
          top: '-10px',
          width: `${s.size}px`,
          height: `${s.size}px`,
          borderRadius: '50%',
          background: BRAND.white,
          opacity: s.opacity,
          animation: `snowfall ${s.duration}s linear ${s.delay}s infinite`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* Content container */}
      <div style={{
        maxWidth: '440px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* BrandedAI mark */}
        <div style={{
          fontSize: '12px',
          fontWeight: 700,
          color: BRAND.grayLight,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          animation: 'fadeUp 0.6s ease-out',
          marginBottom: '24px',
        }}>
          BRANDEDAI
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 'clamp(28px, 7vw, 48px)',
          fontWeight: 800,
          textAlign: 'center',
          margin: '0 0 2px',
          background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.purple})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textShadow: 'none',
          filter: `drop-shadow(0 2px 12px ${BRAND.blue}44)`,
          animation: 'fadeUp 0.6s ease-out 0.1s both',
          letterSpacing: '2px',
          lineHeight: 1.1,
        }}>
          AI Ski Jump
        </h1>
        <h2 style={{
          fontSize: 'clamp(20px, 5vw, 32px)',
          fontWeight: 700,
          textAlign: 'center',
          margin: '0 0 16px',
          color: BRAND.white,
          textShadow: `0 0 20px ${BRAND.blue}33`,
          animation: 'fadeUp 0.6s ease-out 0.15s both',
          letterSpacing: '3px',
        }}>
          Championship
        </h2>

        {/* Winter Olympics badge */}
        <div style={{
          animation: 'fadeUp 0.6s ease-out 0.2s both',
          padding: '6px 16px',
          borderRadius: '20px',
          background: `${BRAND.blue}33`,
          border: `1px solid ${BRAND.blue}`,
          fontSize: '11px',
          fontWeight: 600,
          color: BRAND.blueLight,
          letterSpacing: '1px',
          marginBottom: '20px',
        }}>
          Winter Olympics 2026 Edition
        </div>

        {/* Ski jumper SVG */}
        <div style={{
          animation: 'float 3s ease-in-out infinite, fadeUp 0.6s ease-out 0.25s both',
          marginBottom: '16px',
          filter: `drop-shadow(0 4px 20px ${BRAND.blue}44)`,
        }}>
          <svg width="80" height="60" viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Head */}
            <circle cx="18" cy="14" r="6" fill={BRAND.blueLight} />
            {/* Body — leaning forward in flight */}
            <line x1="22" y1="16" x2="50" y2="26" stroke={BRAND.blueLight} strokeWidth="3" strokeLinecap="round" />
            {/* Front arm — forward */}
            <line x1="32" y1="20" x2="24" y2="10" stroke={BRAND.blueLight} strokeWidth="2.5" strokeLinecap="round" />
            {/* Back arm — along body */}
            <line x1="38" y1="22" x2="48" y2="16" stroke={BRAND.blueLight} strokeWidth="2.5" strokeLinecap="round" />
            {/* Front leg — V-style */}
            <line x1="50" y1="26" x2="68" y2="38" stroke={BRAND.blueLight} strokeWidth="3" strokeLinecap="round" />
            {/* Back leg — V-style */}
            <line x1="50" y1="26" x2="66" y2="44" stroke={BRAND.blueLight} strokeWidth="3" strokeLinecap="round" />
            {/* Front ski */}
            <line x1="64" y1="36" x2="78" y2="34" stroke={BRAND.white} strokeWidth="2.5" strokeLinecap="round" />
            {/* Back ski */}
            <line x1="62" y1="42" x2="76" y2="46" stroke={BRAND.white} strokeWidth="2.5" strokeLinecap="round" />
            {/* Wind lines */}
            <line x1="2" y1="20" x2="12" y2="18" stroke={BRAND.blue} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
            <line x1="4" y1="28" x2="14" y2="26" stroke={BRAND.blue} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
            <line x1="6" y1="36" x2="16" y2="34" stroke={BRAND.blue} strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
          </svg>
        </div>

        {/* Tagline */}
        <p style={{
          fontSize: 'clamp(14px, 3vw, 18px)',
          fontStyle: 'italic',
          color: BRAND.grayLight,
          textAlign: 'center',
          margin: '0 0 24px',
          animation: 'fadeUp 0.6s ease-out 0.3s both',
          lineHeight: 1.5,
        }}>
          Time your launch. Nail the landing.
        </p>

        {/* Challenge banner */}
        {challengerName && (
          <div style={{
            animation: 'fadeUp 0.6s ease-out 0.35s both, pulse 2s ease-in-out infinite',
            padding: '12px 20px',
            borderRadius: '12px',
            background: `${BRAND.orange}26`,
            border: `1px solid ${BRAND.orange}`,
            fontSize: '14px',
            fontWeight: 700,
            color: BRAND.orange,
            textAlign: 'center',
            marginBottom: '20px',
            width: '100%',
            maxWidth: '360px',
            boxSizing: 'border-box',
          }}>
            {challengerName} jumped {challengerScore}m. Can you beat it?
          </div>
        )}

        {/* Rules quick-ref */}
        <div style={{
          animation: 'fadeUp 0.6s ease-out 0.4s both',
          fontSize: '13px',
          color: BRAND.gray,
          textAlign: 'center',
          marginBottom: '20px',
          lineHeight: 1.6,
        }}>
          5 jumps &bull; Best 3 count &bull; Tap to launch, tap to land
        </div>

        {/* Best score */}
        {bestScore != null && bestScore > 0 && (
          <div style={{
            animation: 'fadeUp 0.6s ease-out 0.45s both',
            fontSize: '14px',
            fontWeight: 700,
            color: BRAND.blueLight,
            letterSpacing: '0.5px',
            marginBottom: '8px',
          }}>
            Personal Best: {bestScore}m
          </div>
        )}

        {/* Streak */}
        {streak > 1 && (
          <div style={{
            animation: 'fadeUp 0.6s ease-out 0.5s both',
            padding: '4px 14px',
            borderRadius: '16px',
            background: `${BRAND.orange}22`,
            border: `1px solid ${BRAND.orange}55`,
            fontSize: '12px',
            fontWeight: 700,
            color: BRAND.orange,
            marginBottom: '12px',
          }}>
            Day {streak} streak
          </div>
        )}

        {/* Start button */}
        <button
          onClick={onStart}
          style={{
            animation: 'fadeUp 0.6s ease-out 0.55s both, pulse 2.5s ease-in-out 1.3s infinite',
            background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.blueDark})`,
            border: 'none',
            borderRadius: '12px',
            padding: '16px 48px',
            fontSize: '18px',
            fontWeight: 800,
            color: BRAND.white,
            cursor: 'pointer',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            boxShadow: `0 4px 30px ${BRAND.blue}55, 0 1px 0 inset rgba(255,255,255,0.15)`,
            fontFamily: FONT,
            marginTop: '8px',
            marginBottom: '12px',
          }}
        >
          START JUMPING
        </button>

        {/* Desktop hint */}
        {isDesktop && (
          <div style={{
            animation: 'fadeUp 0.6s ease-out 0.65s both',
            fontSize: '11px',
            color: BRAND.gray,
            marginBottom: '8px',
          }}>
            Press SPACE to jump
          </div>
        )}

        {/* Footer */}
        <div style={{
          animation: 'fadeUp 0.6s ease-out 0.7s both',
          marginTop: '32px',
          textAlign: 'center',
        }}>
          <a
            href="https://brandedai.net"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '12px',
              color: BRAND.gray,
              textDecoration: 'none',
              fontWeight: 600,
              letterSpacing: '0.5px',
            }}
          >
            Built by BrandedAI
          </a>
        </div>
      </div>
    </div>
  )
}
