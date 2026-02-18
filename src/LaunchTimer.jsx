// =============================================================================
// AI Ski Jump Championship — Launch Timer (T5)
// Timing-based launch mechanic. Player taps/clicks/presses spacebar at the
// optimal moment as the jumper reaches the ramp lip.
// =============================================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  TIMING,
  LAUNCH_ANGLES,
  SPEED_MULT,
  BRAND,
  APPROACH_DURATION,
  AUTO_LAUNCH_DELAY,
  RAMP_LIP,
} from './constants'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Random float in [min, max] */
function randBetween(min, max) {
  return min + Math.random() * (max - min)
}

/** Determine launch grade from timing error (ms from optimal moment). */
function gradeFromError(error) {
  if (error <= TIMING.perfect) return 'perfect'
  if (error <= TIMING.good) return 'good'
  if (error <= TIMING.ok) return 'ok'
  return 'miss'
}

/** Build the launch payload for a given grade. */
function buildLaunchPayload(grade) {
  let angle
  switch (grade) {
    case 'perfect':
      angle = LAUNCH_ANGLES.perfect
      break
    case 'good':
      angle = randBetween(LAUNCH_ANGLES.good_min, LAUNCH_ANGLES.good_max)
      break
    case 'ok':
      angle = randBetween(LAUNCH_ANGLES.ok_min, LAUNCH_ANGLES.ok_max)
      break
    default: // miss
      angle = randBetween(LAUNCH_ANGLES.miss_min, LAUNCH_ANGLES.miss_max)
      break
  }
  return { grade, angle, speedMult: SPEED_MULT[grade] }
}

// ---------------------------------------------------------------------------
// Grade colour map
// ---------------------------------------------------------------------------
const GRADE_COLOUR = {
  perfect: BRAND.green,
  good: BRAND.blue,
  ok: BRAND.orange,
  miss: BRAND.red,
}

const GRADE_LABEL = {
  perfect: 'PERFECT!',
  good: 'GOOD!',
  ok: 'OK',
  miss: 'MISS',
}

// ---------------------------------------------------------------------------
// Target ring size (the ring the expanding ring must match)
// ---------------------------------------------------------------------------
const TARGET_RADIUS = 32

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function LaunchTimer({ active, onLaunch, gameScale }) {
  // ---- State ----
  const [progress, setProgress] = useState(0) // 0 → 1 over APPROACH_DURATION
  const [countdown, setCountdown] = useState(null) // 3, 2, 1, or null
  const [feedback, setFeedback] = useState(null) // { grade, visible } or null
  const [launched, setLaunched] = useState(false)

  // ---- Refs for timing accuracy ----
  const startTimeRef = useRef(null)
  const animFrameRef = useRef(null)
  const autoLaunchTimerRef = useRef(null)
  const feedbackTimerRef = useRef(null)
  const launchedRef = useRef(false) // mirror for event handlers (no stale closure)

  // ---- Reset when active changes ----
  useEffect(() => {
    if (!active) {
      // Cleanup everything
      setProgress(0)
      setCountdown(null)
      setFeedback(null)
      setLaunched(false)
      launchedRef.current = false
      startTimeRef.current = null
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (autoLaunchTimerRef.current) clearTimeout(autoLaunchTimerRef.current)
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
      return
    }

    // ---- Start approach ----
    const start = performance.now()
    startTimeRef.current = start
    launchedRef.current = false
    setLaunched(false)
    setFeedback(null)

    // Countdown: 3 at 0ms, 2 at 500ms, 1 at 1000ms
    setCountdown(3)
    const t1 = setTimeout(() => setCountdown(2), 500)
    const t2 = setTimeout(() => setCountdown(1), 1000)
    const t3 = setTimeout(() => setCountdown(null), 1400) // clear just before optimal

    // Animation loop — drives the expanding ring
    function tick() {
      const elapsed = performance.now() - start
      const p = Math.min(elapsed / APPROACH_DURATION, 1)
      setProgress(p)

      if (p < 1) {
        animFrameRef.current = requestAnimationFrame(tick)
      } else {
        // Optimal moment reached — start auto-launch timer
        autoLaunchTimerRef.current = setTimeout(() => {
          if (!launchedRef.current) {
            doLaunch('miss')
          }
        }, AUTO_LAUNCH_DELAY)
      }
    }
    animFrameRef.current = requestAnimationFrame(tick)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (autoLaunchTimerRef.current) clearTimeout(autoLaunchTimerRef.current)
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  // ---- Launch logic ----
  const doLaunch = useCallback(
    (forceGrade) => {
      if (launchedRef.current) return
      launchedRef.current = true
      setLaunched(true)

      // Cancel auto-launch if pending
      if (autoLaunchTimerRef.current) clearTimeout(autoLaunchTimerRef.current)

      let grade = forceGrade
      if (!grade && startTimeRef.current) {
        const elapsed = performance.now() - startTimeRef.current
        const timingError = Math.abs(elapsed - APPROACH_DURATION)
        grade = gradeFromError(timingError)
      }
      if (!grade) grade = 'miss'

      const payload = buildLaunchPayload(grade)

      // Show visual feedback
      setFeedback({ grade, visible: true })
      feedbackTimerRef.current = setTimeout(() => {
        setFeedback((prev) => (prev ? { ...prev, visible: false } : null))
      }, 500)

      // Fire callback
      onLaunch(payload)
    },
    [onLaunch],
  )

  // ---- Input listeners (tap / click / spacebar) ----
  useEffect(() => {
    if (!active) return

    function handleInput(e) {
      // Prevent default for spacebar to avoid page scroll
      if (e.type === 'keydown' && e.code !== 'Space') return
      if (e.type === 'keydown') e.preventDefault()

      if (!launchedRef.current && startTimeRef.current) {
        doLaunch()
      }
    }

    window.addEventListener('keydown', handleInput)
    window.addEventListener('pointerdown', handleInput)

    return () => {
      window.removeEventListener('keydown', handleInput)
      window.removeEventListener('pointerdown', handleInput)
    }
  }, [active, doLaunch])

  // ---- Don't render anything when not active and no feedback showing ----
  if (!active && !feedback) return null

  // ---- Derived values ----
  const scale = gameScale || 1
  const centreX = RAMP_LIP.x * scale
  const centreY = RAMP_LIP.y * scale

  // Expanding ring: starts at 6px radius, grows to TARGET_RADIUS * scale
  const targetR = TARGET_RADIUS * scale
  const expandingR = 6 * scale + progress * (targetR - 6 * scale)

  // Colour based on how close the expanding ring is to optimal
  // (progress 1.0 = optimal). We also handle "past optimal" for the
  // brief window before auto-launch.
  let ringColour
  if (progress >= 1) {
    // Past optimal — red
    ringColour = BRAND.red
  } else if (progress >= 0.9) {
    // Perfect zone — green
    ringColour = BRAND.green
  } else if (progress >= 0.7) {
    // Getting close — yellow/orange
    ringColour = BRAND.orange
  } else {
    // Far away — red
    ringColour = BRAND.red
  }

  // Ring opacity: bright when close, dimmer when far
  const ringOpacity = progress >= 0.7 ? 0.9 : 0.5 + progress * 0.4

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
      {/* COUNTDOWN TEXT — "3... 2... 1..."                                 */}
      {/* ================================================================= */}
      {countdown !== null && !launched && (
        <div
          key={countdown}
          style={{
            position: 'absolute',
            left: centreX,
            top: centreY - 55 * scale,
            transform: 'translate(-50%, -50%)',
            color: BRAND.white,
            fontSize: 16 * scale,
            fontFamily: "'Open Sans', sans-serif",
            fontWeight: 700,
            opacity: 0.7,
            animation: 'fadeUp 0.35s ease-out',
            textShadow: '0 2px 8px rgba(0,0,0,0.6)',
          }}
        >
          {countdown}...
        </div>
      )}

      {/* ================================================================= */}
      {/* TARGET RING — static, always visible during approach              */}
      {/* ================================================================= */}
      {!launched && (
        <div
          style={{
            position: 'absolute',
            left: centreX - targetR,
            top: centreY - targetR,
            width: targetR * 2,
            height: targetR * 2,
            borderRadius: '50%',
            border: `${2 * scale}px solid ${BRAND.white}`,
            opacity: 0.3,
            boxSizing: 'border-box',
          }}
        />
      )}

      {/* ================================================================= */}
      {/* EXPANDING RING — grows toward target over approach duration       */}
      {/* ================================================================= */}
      {!launched && (
        <div
          style={{
            position: 'absolute',
            left: centreX - expandingR,
            top: centreY - expandingR,
            width: expandingR * 2,
            height: expandingR * 2,
            borderRadius: '50%',
            border: `${3 * scale}px solid ${ringColour}`,
            opacity: ringOpacity,
            boxSizing: 'border-box',
            boxShadow: `0 0 ${12 * scale}px ${ringColour}40, inset 0 0 ${8 * scale}px ${ringColour}20`,
            transition: 'border-color 0.15s ease',
            animation: progress >= 0.9 && progress < 1 ? 'pulse 0.3s ease-in-out infinite' : undefined,
          }}
        />
      )}

      {/* ================================================================= */}
      {/* "TAP" hint — pulsing text below the ring                         */}
      {/* ================================================================= */}
      {!launched && progress > 0.4 && progress < 1 && (
        <div
          style={{
            position: 'absolute',
            left: centreX,
            top: centreY + targetR + 12 * scale,
            transform: 'translate(-50%, 0)',
            color: BRAND.white,
            fontSize: 10 * scale,
            fontFamily: "'Open Sans', sans-serif",
            fontWeight: 600,
            opacity: 0.5,
            letterSpacing: 2,
            textTransform: 'uppercase',
            animation: 'tapPulse 1s ease-in-out infinite',
            textShadow: '0 1px 4px rgba(0,0,0,0.5)',
          }}
        >
          TAP
        </div>
      )}

      {/* ================================================================= */}
      {/* FEEDBACK FLASH — grade result after tap                           */}
      {/* ================================================================= */}
      {feedback && feedback.visible && (
        <>
          {/* Colour burst circle */}
          <div
            style={{
              position: 'absolute',
              left: centreX - targetR * 1.5,
              top: centreY - targetR * 1.5,
              width: targetR * 3,
              height: targetR * 3,
              borderRadius: '50%',
              backgroundColor: GRADE_COLOUR[feedback.grade],
              opacity: 0.25,
              animation: 'popIn 0.3s ease-out',
            }}
          />
          {/* Grade text */}
          <div
            style={{
              position: 'absolute',
              left: centreX,
              top: centreY,
              transform: 'translate(-50%, -50%)',
              color: GRADE_COLOUR[feedback.grade],
              fontSize: 22 * scale,
              fontFamily: "'Open Sans', sans-serif",
              fontWeight: 800,
              textShadow: `0 2px 12px ${GRADE_COLOUR[feedback.grade]}80, 0 0 30px ${GRADE_COLOUR[feedback.grade]}40`,
              animation: 'popIn 0.3s ease-out',
              letterSpacing: 1,
            }}
          >
            {GRADE_LABEL[feedback.grade]}
          </div>
        </>
      )}
    </div>
  )
}
