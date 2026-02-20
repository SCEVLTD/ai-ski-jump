import { useEffect, useState } from 'react'
import { BRAND, GAME_W, GAME_H, GRADE_TIERS } from './constants'
import SkiJumpScene from './SkiJumpScene'

const FONT = "'Open Sans','Segoe UI',system-ui,sans-serif"
const DISPLAY_FONT = "'Barlow Condensed','Open Sans',system-ui,sans-serif"

// Generate snowflakes once (static array)
const SNOWFLAKES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  size: 2 + Math.random() * 4,
  duration: 6 + Math.random() * 8,
  delay: Math.random() * 12,
  opacity: 0.15 + Math.random() * 0.55,
}))

export default function TitleScreen({ onStart, bestScore, gamesPlayed, challengerName, challengerScore }) {
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)')
    setIsDesktop(mq.matches)
    const handler = (e) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

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
      background: BRAND.dark,
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
      {/* Background SkiJumpScene dimmed */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.3,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}>
        <div style={{
          width: GAME_W,
          height: GAME_H,
          transform: 'scale(2.2)',
          transformOrigin: 'center center',
          filter: 'blur(1.5px)',
        }}>
          <SkiJumpScene>{null}</SkiJumpScene>
        </div>
      </div>

      <div style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse 80% 60% at 50% 30%, transparent 0%, ${BRAND.dark}dd 70%), linear-gradient(180deg, ${BRAND.dark}66 0%, ${BRAND.dark}ee 100%)`,
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
          zIndex: 2,
        }} />
      ))}

      {/* Content Container */}
      <div style={{
        maxWidth: '480px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        zIndex: 3,
      }}>
        {/* BrandedAI mark */}
        <div style={{
          fontSize: '12px',
          fontWeight: 700,
          color: BRAND.grayLight,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          animation: 'fadeUp 0.6s ease-out',
          marginBottom: '20px',
        }}>
          BRANDEDAI
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 'clamp(2.5rem, 8vw, 4rem)',
          fontWeight: 900,
          textAlign: 'center',
          margin: '0 0 2px',
          background: `linear-gradient(135deg, #60A5FA, ${BRAND.blue}, ${BRAND.purple}, #A78BFA)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textShadow: 'none',
          filter: `drop-shadow(0 4px 20px ${BRAND.blue}66)`,
          animation: 'fadeUp 0.6s ease-out 0.1s both',
          letterSpacing: '3px',
          lineHeight: 1.1,
          textTransform: 'uppercase',
          fontFamily: DISPLAY_FONT,
        }}>
          AI Ski Jump
        </h1>
        <h2 style={{
          fontSize: 'clamp(1.5rem, 6vw, 2.5rem)',
          fontWeight: 800,
          textAlign: 'center',
          margin: '0 0 16px',
          color: BRAND.white,
          textShadow: `0 0 30px ${BRAND.blue}44, 0 0 60px ${BRAND.purple}22`,
          animation: 'fadeUp 0.6s ease-out 0.15s both',
          letterSpacing: '4px',
          textTransform: 'uppercase',
          fontFamily: DISPLAY_FONT,
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

        {/* Skier Character Centerpiece */}
        <div style={{
          animation: 'float 3s ease-in-out infinite, fadeUp 0.6s ease-out 0.25s both',
          marginBottom: '20px',
          filter: `drop-shadow(0 6px 30px ${BRAND.blue}55)`,
        }}>
          <svg width="160" height="120" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="80" cy="60" rx="70" ry="40" fill={`${BRAND.blue}10`} />
            <circle cx="36" cy="28" r="10" fill={BRAND.blueLight} />
            <path d="M30 26 Q36 22 42 26" stroke={BRAND.blue} strokeWidth="2" fill="none" opacity="0.6" />
            <line x1="44" y1="32" x2="100" y2="52" stroke={BRAND.blueLight} strokeWidth="5" strokeLinecap="round" />
            <line x1="64" y1="40" x2="48" y2="20" stroke={BRAND.blueLight} strokeWidth="4" strokeLinecap="round" />
            <line x1="76" y1="44" x2="96" y2="32" stroke={BRAND.blueLight} strokeWidth="4" strokeLinecap="round" />
            <line x1="100" y1="52" x2="136" y2="76" stroke={BRAND.blueLight} strokeWidth="5" strokeLinecap="round" />
            <line x1="100" y1="52" x2="132" y2="88" stroke={BRAND.blueLight} strokeWidth="5" strokeLinecap="round" />
            <line x1="128" y1="72" x2="156" y2="68" stroke={BRAND.white} strokeWidth="4" strokeLinecap="round" />
            <line x1="124" y1="84" x2="152" y2="92" stroke={BRAND.white} strokeWidth="4" strokeLinecap="round" />
            <line x1="2" y1="38" x2="22" y2="34" stroke={BRAND.blue} strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
            <line x1="6" y1="54" x2="26" y2="50" stroke={BRAND.blue} strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
            <line x1="10" y1="70" x2="30" y2="66" stroke={BRAND.blue} strokeWidth="2.5" strokeLinecap="round" opacity="0.3" />
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
          marginBottom: '16px',
          lineHeight: 1.6,
        }}>
          5 jumps &bull; Best 3 count &bull; Launch, boost mid-air, land
        </div>

        {/* Best score */}
        {bestScore != null && bestScore > 0 ? (() => {
          const nextTier = [...GRADE_TIERS].reverse().find(t => t.min > bestScore)
          return (
            <div style={{
              animation: 'fadeUp 0.6s ease-out 0.45s both',
              textAlign: 'center',
              marginBottom: '16px',
            }}>
              <div style={{
                fontSize: '15px',
                fontWeight: 700,
                color: BRAND.blueLight,
                letterSpacing: '0.5px',
                marginBottom: '4px',
              }}>
                Personal Best: {bestScore}m
              </div>
              {nextTier && (
                <div style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: BRAND.gray,
                }}>
                  Next goal: {nextTier.emoji} {nextTier.label} ({nextTier.min}m+)
                </div>
              )}
            </div>
          )
        })() : null}

        {/* Start button */}
        <button
          onClick={onStart}
          className="title-start-btn"
          style={{
            animation: 'fadeUp 0.6s ease-out 0.55s both',
            background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.purple})`,
            border: 'none',
            borderRadius: '14px',
            padding: '18px 56px',
            fontSize: '20px',
            fontWeight: 900,
            color: BRAND.white,
            cursor: 'pointer',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            boxShadow: `0 0 20px ${BRAND.blue}66, 0 0 40px ${BRAND.purple}33, 0 4px 30px ${BRAND.blue}55, 0 1px 0 inset rgba(255,255,255,0.15)`,
            fontFamily: FONT,
            marginTop: '8px',
            marginBottom: '12px',
          }}
        >
          START JUMPING
        </button>

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
