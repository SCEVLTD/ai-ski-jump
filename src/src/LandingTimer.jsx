// =============================================================================
// AI Ski Jump Championship — Landing Timer (T6)
// Timing-based landing mechanic. During flight the player taps/clicks/presses
// spacebar at the optimal moment to "prepare the landing" and earn a style
// multiplier on their distance.
// =============================================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import { LANDING_MULT, BRAND } from './constants'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** flightProgress value at which the timing is optimal */
const OPTIMAL_PROGRESS = 0.82

/** Landing grades — error thresholds (achievable for casual players) */
const GRADES = [
  { maxError: 0.06, grade: 'telemark', multiplier: LANDING_MULT.telemark },
  { maxError: 0.14, grade: 'clean',    multiplier: LANDING_MULT.clean },
  { maxError: 0.24, grade: 'shaky',    multiplier: LANDING_MULT.shaky },
]
const CRASH_GRADE = { grade: 'crash', multiplier: LANDING_MULT.crash }

/** Auto-land threshold — if no input by this progress, force crash */
const AUTO_LAND_PROGRESS = 0.98

/** Shrinking ring sizes */
const RING_START_RADIUS = 60
const RING_TARGET_RADIUS = 10

/** How long feedback text stays visible (ms) */
const FEEDBACK_DURATION = 600

/** Number of ski emojis spawned on crash */
const CRASH_SKI_COUNT = 4

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function gradeFromError(error) {
  for (const g of GRADES) {
    if (error <= g.maxError) return g
  }
  return CRASH_GRADE
}

/** Compute ring colour from flightProgress */
function getRingColour(fp) {
  if (fp > 0.95) return BRAND.red
  if (fp >= 0.80) return BRAND.green
  if (fp >= 0.70) return BRAND.orange
  return 'rgba(255,255,255,0.5)'
}

/** Generate random crash ski trajectories (pre-computed per render) */
function makeCrashSkis(count) {
  const skis = []
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * 360
    const dist = 30 + Math.random() * 50
    const rad = (angle * Math.PI) / 180
    skis.push({
      id: i,
      tx: Math.cos(rad) * dist,
      ty: Math.sin(rad) * dist,
      rotation: Math.random() * 360,
    })
  }
  return skis
}

// ---------------------------------------------------------------------------
// Grade display config
// ---------------------------------------------------------------------------
const GRADE_CONFIG = {
  telemark: {
    label: 'TELEMARK!',
    colour: BRAND.green,
    flashColour: BRAND.green,
    jumperRotate: 'rotate(-15deg)',
  },
  clean: {
    label: 'Clean Landing!',
    colour: BRAND.blue,
    flashColour: BRAND.blue,
    jumperRotate: 'rotate(-8deg)',
  },
  shaky: {
    label: 'Shaky...',
    colour: BRAND.orange,
    flashColour: BRAND.orange,
    jumperRotate: null, // wobble handled by animation
  },
  crash: {
    label: 'CRASH!',
    colour: BRAND.red,
    flashColour: BRAND.red,
    jumperRotate: null, // tumble handled by animation
  },
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function LandingTimer({
  active,
  flightProgress,
  onLand,
  onBoost,
  jumperPos,
  gameScale,
  inputLockedUntilRef,
}) {
  const scale = gameScale || 1

  // ---- State ----
  const [landed, setLanded] = useState(false)
  const [feedback, setFeedback] = useState(null) // { grade, multiplier, visible }
  const [crashSkis, setCrashSkis] = useState([])

  // Refs to avoid stale closures
  const landedRef = useRef(false)
  const feedbackTimerRef = useRef(null)
  const flightProgressRef = useRef(0)

  // Keep ref in sync
  flightProgressRef.current = flightProgress

  // ---- Reset when flight ends or starts ----
  useEffect(() => {
    if (!active) {
      // Don't clear feedback immediately — let it display even after active goes false
      setLanded(false)
      landedRef.current = false
      return
    }

    // New flight starting
    setLanded(false)
    setFeedback(null)
    setCrashSkis([])
    landedRef.current = false
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)

    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    }
  }, [active])

  // ---- Land logic ----
  const doLand = useCallback(
    (forceGrade) => {
      if (landedRef.current) return
      landedRef.current = true
      setLanded(true)

      const fp = flightProgressRef.current
      let result
      if (forceGrade) {
        result =
          forceGrade === 'crash'
            ? CRASH_GRADE
            : gradeFromError(0) // shouldn't happen, but fallback
      } else {
        // Shift optimal 0.02 earlier so slightly-early taps are rewarded
        const error = Math.abs(fp - (OPTIMAL_PROGRESS - 0.02))
        result = gradeFromError(error)
      }

      const { grade, multiplier } = result

      // Generate crash skis if needed
      if (grade === 'crash') {
        setCrashSkis(makeCrashSkis(CRASH_SKI_COUNT))
      }

      // Show feedback
      setFeedback({ grade, multiplier, visible: true })
      feedbackTimerRef.current = setTimeout(() => {
        setFeedback((prev) => (prev ? { ...prev, visible: false } : null))
      }, FEEDBACK_DURATION)

      // Fire callback
      onLand({ grade, multiplier })
    },
    [onLand],
  )

  // ---- Auto-land at 0.98 ----
  useEffect(() => {
    if (!active) return
    if (flightProgress >= AUTO_LAND_PROGRESS && !landedRef.current) {
      doLand('crash')
    }
  }, [active, flightProgress, doLand])

  // ---- Input listeners (tap / click / spacebar) ----
  useEffect(() => {
    if (!active) return

    function handleInput(e) {
      const isSpace = e.type === 'keydown' && e.code === 'Space'
      const isArrow = e.type === 'keydown' && e.code.startsWith('Arrow')
      const isPointer = e.type === 'pointerdown'

      // We only care about Space, Arrows, or Pointer taps
      if (!isSpace && !isArrow && !isPointer) return
      
      // Prevent default scrolling for arrows and space
      if (e.type === 'keydown') {
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
          e.preventDefault()
        }
      }

      // Respect input lockout from state transitions
      if (inputLockedUntilRef && inputLockedUntilRef.current > performance.now()) return

      const fp = flightProgressRef.current

      // Phase 1: Boost Zone (fp < 0.5)
      // Accept Arrow keys, Space, or Taps
      if (fp < 0.5) {
        if (onBoost) onBoost()
        return
      }

      // Phase 2: Landing Zone (fp >= 0.5)
      // Allow Space and Taps. Ignore Arrow keys to prevent accidental landing if they are mashing.
      if (isArrow) return 

      if (!landedRef.current) {
        doLand()
      }
    }

    window.addEventListener('keydown', handleInput)
    window.addEventListener('pointerdown', handleInput)

    return () => {
      window.removeEventListener('keydown', handleInput)
      window.removeEventListener('pointerdown', handleInput)
    }
  }, [active, doLand, onBoost])

  // ---- Don't render anything when not active and no feedback ----
  if (!active && !feedback) return null

  // ---- Derived values ----
  const fp = flightProgress || 0
  const jx = jumperPos ? jumperPos.x * scale : 0
  const jy = jumperPos ? jumperPos.y * scale : 0

  // Shrinking ring: visible when flightProgress > 0.5
  const showRing = active && !landed && fp > 0.5
  // Ring shrinks from RING_START_RADIUS to RING_TARGET_RADIUS between fp 0.5 and 1.0
  const ringProgress = showRing ? Math.min((fp - 0.5) / 0.5, 1) : 0
  const currentRadius =
    (RING_START_RADIUS - (RING_START_RADIUS - RING_TARGET_RADIUS) * ringProgress) * scale
  const targetRadius = RING_TARGET_RADIUS * scale
  const ringColour = getRingColour(fp)
  const isOptimalZone = fp >= 0.8 && fp <= 0.9

  // "TAP TO LAND" prompt
  const showPrompt = active && !landed && fp > 0.5
  const showBoostPrompt = active && !landed && fp < 0.5
  // Urgency scaling: gets bigger/brighter as fp increases
  const urgency = Math.min((fp - 0.5) / 0.45, 1) // 0 at fp=0.5, 1 at fp=0.95
  const promptScale = 1 + urgency * 0.4
  const promptOpacity = 0.5 + urgency * 0.5

  // Feedback config
  const fbConfig = feedback ? GRADE_CONFIG[feedback.grade] : null

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      {/* ================================================================= */}
      {/* SHRINKING TARGET RING — outer shrinking ring                      */}
      {/* ================================================================= */}
      {showRing && (
        <>
          {/* Inner target circle (fixed size — what the player aims for) */}
          <div
            style={{
              position: 'absolute',
              left: jx - targetRadius,
              top: jy - targetRadius,
              width: targetRadius * 2,
              height: targetRadius * 2,
              borderRadius: '50%',
              border: `${2 * scale}px solid ${BRAND.white}`,
              opacity: 0.35,
              boxSizing: 'border-box',
            }}
          />

          {/* Shrinking ring */}
          <div
            style={{
              position: 'absolute',
              left: jx - currentRadius,
              top: jy - currentRadius,
              width: currentRadius * 2,
              height: currentRadius * 2,
              borderRadius: '50%',
              border: `${3 * scale}px solid ${ringColour}`,
              opacity: isOptimalZone ? 0.95 : 0.7,
              boxSizing: 'border-box',
              boxShadow: `0 0 ${12 * scale}px ${ringColour}40, inset 0 0 ${8 * scale}px ${ringColour}20`,
              transition: 'border-color 0.15s ease',
              animation: isOptimalZone ? 'pulse 0.3s ease-in-out infinite' : undefined,
            }}
          />
        </>
      )}

      {/* ================================================================= */}
      {/* "TAP TO LAND" prompt — pulsing below jumper                       */}
      {/* ================================================================= */}
      {showPrompt && (
        <div
          style={{
            position: 'absolute',
            left: jx,
            top: jy + 30 * scale,
            transform: `translate(-50%, 0) scale(${promptScale})`,
            color: BRAND.white,
            fontSize: 10 * scale,
            fontFamily: "'Open Sans', sans-serif",
            fontWeight: 700,
            opacity: promptOpacity,
            letterSpacing: 2,
            textTransform: 'uppercase',
            animation: 'tapPulse 0.8s ease-in-out infinite',
            textShadow: `0 1px 6px rgba(0,0,0,0.7)`,
            whiteSpace: 'nowrap',
          }}
        >
          TAP TO LAND
        </div>
      )}

      {showBoostPrompt && (
        <div
          style={{
            position: 'absolute',
            left: jx,
            top: jy + 30 * scale,
            transform: `translate(-50%, 0)`,
            color: BRAND.orange,
            fontSize: 10 * scale,
            fontFamily: "'Open Sans', sans-serif",
            fontWeight: 700,
            opacity: 0.8,
            letterSpacing: 2,
            textTransform: 'uppercase',
            animation: 'tapPulse 0.5s ease-in-out infinite alternate',
            textShadow: `0 1px 6px rgba(0,0,0,0.7)`,
            whiteSpace: 'nowrap',
          }}
        >
          TAP TO BOOST!
        </div>
      )}

      {/* ================================================================= */}
      {/* FEEDBACK — flash, text, and grade-specific effects                */}
      {/* ================================================================= */}
      {feedback && feedback.visible && fbConfig && (
        <>
          {/* Colour burst / flash circle */}
          <div
            style={{
              position: 'absolute',
              left: jx - 40 * scale,
              top: jy - 40 * scale,
              width: 80 * scale,
              height: 80 * scale,
              borderRadius: '50%',
              backgroundColor: fbConfig.flashColour,
              opacity: 0.3,
              animation: 'landingBurst 0.5s ease-out forwards',
            }}
          />

          {/* Grade text */}
          <div
            style={{
              position: 'absolute',
              left: jx,
              top: jy - 30 * scale,
              transform: 'translate(-50%, -50%)',
              color: fbConfig.colour,
              fontSize: 20 * scale,
              fontFamily: "'Open Sans', sans-serif",
              fontWeight: 800,
              textShadow: `0 2px 12px ${fbConfig.colour}80, 0 0 30px ${fbConfig.colour}40`,
              animation: 'popIn 0.3s ease-out',
              letterSpacing: 1,
              whiteSpace: 'nowrap',
            }}
          >
            {fbConfig.label}
          </div>

          {/* Telemark: crowd particles (small dots radiating out) */}
          {feedback.grade === 'telemark' &&
            Array.from({ length: 8 }).map((_, i) => {
              const angle = (i / 8) * 360
              const rad = (angle * Math.PI) / 180
              const dist = 35 * scale
              return (
                <div
                  key={`crowd-${i}`}
                  style={{
                    position: 'absolute',
                    left: jx + Math.cos(rad) * dist - 2 * scale,
                    top: jy + Math.sin(rad) * dist - 2 * scale,
                    width: 4 * scale,
                    height: 4 * scale,
                    borderRadius: '50%',
                    backgroundColor: BRAND.green,
                    opacity: 0,
                    animation: 'landingBurst 0.6s ease-out forwards',
                    animationDelay: `${i * 30}ms`,
                  }}
                />
              )
            })}

          {/* Shaky: wobble effect — quick left-right rotation on a marker */}
          {feedback.grade === 'shaky' && (
            <div
              style={{
                position: 'absolute',
                left: jx - 6 * scale,
                top: jy - 6 * scale,
                width: 12 * scale,
                height: 12 * scale,
                borderRadius: '50%',
                border: `2px solid ${BRAND.orange}`,
                animation: 'wobble 0.4s ease-in-out 2',
              }}
            />
          )}

          {/* Crash: scattered ski emojis flying outward */}
          {feedback.grade === 'crash' &&
            crashSkis.map((ski) => (
              <div
                key={`ski-${ski.id}`}
                style={{
                  position: 'absolute',
                  left: jx,
                  top: jy,
                  fontSize: 14 * scale,
                  '--ski-tx': `${ski.tx * scale}px`,
                  '--ski-ty': `${ski.ty * scale}px`,
                  '--ski-rot': `${ski.rotation}deg`,
                  animation: `crashSkiFly 0.8s ease-out forwards`,
                  animationDelay: `${ski.id * 50}ms`,
                  pointerEvents: 'none',
                }}
              >
                {'\uD83C\uDFBF'}
              </div>
            ))}
        </>
      )}

      {/* ================================================================= */}
      {/* Inline keyframes for landing-specific animations                  */}
      {/* (wobble, crashSkiFly, tumble — not in global styles.css)          */}
      {/* ================================================================= */}
      <style>{`
        @keyframes wobble {
          0%   { transform: rotate(0deg); }
          25%  { transform: rotate(8deg); }
          50%  { transform: rotate(-8deg); }
          75%  { transform: rotate(5deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes crashSkiFly {
          0%   { opacity: 1; transform: translate(0px, 0px) rotate(0deg); }
          100% { opacity: 0; transform: translate(var(--ski-tx), var(--ski-ty)) rotate(var(--ski-rot)); }
        }
        @keyframes tumble {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
