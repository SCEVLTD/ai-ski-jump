// =============================================================================
// AI Ski Jump Championship — Main Game Orchestrator (T7 + T8)
// Wires together all components: scene, timers, physics, sounds, screens.
// State machine: TITLE → TUTORIAL → ROUND_INTRO → APPROACH → FLIGHT →
//                LANDING → SCORE_DISPLAY → (next round or RESULTS)
// =============================================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import './styles.css'

import {
  BRAND,
  GAME_W,
  GAME_H,
  RAMP_TOP,
  RAMP_LIP,
  JUMPERS,
  ROUNDS_PER_GAME,
  BEST_N,
  WIND_RANGE,
  APPROACH_DURATION,
  ROUND_INTRO_DURATION,
  SCORE_DISPLAY_DURATION,
  LANDING_MULT,
  getDistanceMessage,
  getGrade,
} from './constants'

import {
  calculateApproach,
  calculateLaunchVelocity,
  createFlightState,
  simulateFlight,
  calculateScore,
} from './physics'

import { playSound, setMuted, isMuted, vibrate } from './sounds'
import SkiJumpScene from './SkiJumpScene'
import LaunchTimer from './LaunchTimer'
import LandingTimer from './LandingTimer'
import TitleScreen from './TitleScreen'
import ResultsScreen from './ResultsScreen'
import Tutorial from './Tutorial'
import useGameScale from './useGameScale'

// ---------------------------------------------------------------------------
// localStorage keys
// ---------------------------------------------------------------------------
const LS_BEST = 'skijump_bestScore'
const LS_STREAK = 'skijump_streak'
const LS_LAST_PLAYED = 'skijump_lastPlayed'
const LS_TUTORIAL = 'skijump_tutorialSeen'
const LS_MUTED = 'skijump_muted'

const FONT = "'Open Sans','Segoe UI',system-ui,sans-serif"

// ---------------------------------------------------------------------------
// Landing grade display config (for HUD badges)
// ---------------------------------------------------------------------------
const LANDING_BADGE_BG = {
  telemark: BRAND.green,
  clean: BRAND.blue,
  shaky: BRAND.orange,
  crash: BRAND.red,
}

const LANDING_LABEL = {
  telemark: 'Telemark!',
  clean: 'Clean',
  shaky: 'Shaky',
  crash: 'Crash',
}

// ---------------------------------------------------------------------------
// Helper: read localStorage safely
// ---------------------------------------------------------------------------
function lsGet(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    if (v === null) return fallback
    return JSON.parse(v)
  } catch {
    return fallback
  }
}

function lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // quota exceeded etc — ignore
  }
}

// ---------------------------------------------------------------------------
// Helper: check if date was "yesterday" (within 36 hours)
// ---------------------------------------------------------------------------
function wasYesterday(dateStr) {
  if (!dateStr) return false
  const last = new Date(dateStr).getTime()
  const now = Date.now()
  const diff = now - last
  return diff > 0 && diff < 36 * 60 * 60 * 1000
}

// ---------------------------------------------------------------------------
// Helper: parse challenge URL params
// ---------------------------------------------------------------------------
function parseChallengeParams() {
  try {
    const params = new URLSearchParams(window.location.search)
    if (params.get('challenge') === 'true') {
      return {
        challengerName: params.get('name') || 'A friend',
        challengerScore: parseFloat(params.get('score')) || 0,
      }
    }
  } catch {
    // ignore
  }
  return { challengerName: null, challengerScore: null }
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export default function AISkiJumpGame() {
  // ---- Responsive scaling ----
  const { scale, containerStyle } = useGameScale()

  // ---- Game state machine ----
  const [screen, setScreen] = useState('TITLE')
  const [currentRound, setCurrentRound] = useState(0)
  const [scores, setScores] = useState([])
  const [currentWind, setCurrentWind] = useState(0)
  const [flightProgress, setFlightProgress] = useState(0)
  const [bestScore, setBestScore] = useState(null)
  const [streak, setStreak] = useState(0)
  const [soundMuted, setSoundMuted] = useState(false)
  const [liveDistance, setLiveDistance] = useState(0)

  // Challenge link state
  const [challengerName, setChallengerName] = useState(null)
  const [challengerScore, setChallengerScore] = useState(null)

  // Results state (calculated at end of game)
  const [finalScores, setFinalScores] = useState([])
  const [totalScore, setTotalScore] = useState(0)
  const [finalGrade, setFinalGrade] = useState(null)
  const [isNewRecord, setIsNewRecord] = useState(false)

  // ---- Jumper position for React renders (updated at transition points) ----
  const [jumperPos, setJumperPos] = useState({ x: RAMP_TOP.x, y: RAMP_TOP.y })

  // ---- Refs for animation (no React re-renders during animation loops) ----
  const jumperRef = useRef(null)
  const trailRef = useRef(null)
  const liveDistRef = useRef(null)
  const animFrameRef = useRef(null)
  const flightStateRef = useRef(null)
  const launchVelRef = useRef(null)
  const windSoundRef = useRef(null)
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(0)
  const approachStartRef = useRef(0)
  const flightTotalTimeEstRef = useRef(3) // estimated total flight time in seconds
  const jumperBodyRef = useRef(null)
  const telemarkVRef = useRef(null)
  const [landingGrade, setLandingGrade] = useState(null)
  const gameContainerRef = useRef(null)

  // ---- Snow burst particles on landing ----
  const spawnSnowBurst = useCallback((landX, landY, grade) => {
    const container = gameContainerRef.current
    if (!container) return

    const count = grade === 'telemark' ? 8 : grade === 'clean' ? 12 : grade === 'shaky' ? 16 : 22
    const spread = grade === 'telemark' ? 40 : grade === 'clean' ? 60 : grade === 'shaky' ? 80 : 120

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div')
      const size = (4 + Math.random() * 4) * scale
      const angle = Math.random() * Math.PI * 2
      const speed = (0.3 + Math.random() * 0.7) * spread
      const dx = Math.cos(angle) * speed
      const dy = Math.sin(angle) * speed - Math.abs(Math.sin(angle)) * spread * 0.3

      particle.style.cssText = `
        position:absolute;
        left:${landX * scale}px;
        top:${landY * scale}px;
        width:${size}px;
        height:${size}px;
        border-radius:50%;
        background:white;
        opacity:0.9;
        pointer-events:none;
        z-index:10;
        transition:all 500ms cubic-bezier(0.25,0.46,0.45,0.94);
      `
      container.appendChild(particle)

      requestAnimationFrame(() => {
        particle.style.transform = `translate(${dx}px, ${dy}px)`
        particle.style.opacity = '0'
      })

      setTimeout(() => {
        if (particle.parentNode) particle.parentNode.removeChild(particle)
      }, 550)
    }
  }, [scale])

  // ---- Camera shake on landing ----
  const applyCameraShake = useCallback((grade) => {
    const container = gameContainerRef.current
    if (!container) return
    if (grade === 'telemark') return // smooth landing, no shake

    const anim = grade === 'clean' ? 'shakeLight' : grade === 'shaky' ? 'shakeMedium' : 'shakeHeavy'
    const dur = grade === 'clean' ? '50ms' : grade === 'shaky' ? '200ms' : '400ms'

    container.style.animation = `${anim} ${dur} ease-out`
    const cleanup = () => {
      container.style.animation = ''
      container.removeEventListener('animationend', cleanup)
    }
    container.addEventListener('animationend', cleanup)
  }, [])

  // ---- On mount: read localStorage + parse challenge params ----
  useEffect(() => {
    setBestScore(lsGet(LS_BEST, null))
    setStreak(lsGet(LS_STREAK, 0))
    const m = lsGet(LS_MUTED, false)
    setSoundMuted(m)
    setMuted(m)

    const { challengerName: cn, challengerScore: cs } = parseChallengeParams()
    setChallengerName(cn)
    setChallengerScore(cs)
  }, [])

  // ---- Sync mute state ----
  const toggleMute = useCallback(() => {
    setSoundMuted((prev) => {
      const next = !prev
      setMuted(next)
      lsSet(LS_MUTED, next)
      return next
    })
  }, [])

  // ---- Keyboard integration (M = mute, R = play again on results) ----
  useEffect(() => {
    function handleKey(e) {
      if (e.code === 'KeyM') {
        toggleMute()
      }
      if (e.code === 'KeyR' && screen === 'RESULTS') {
        handlePlayAgain()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [screen, toggleMute])

  // ---- Generate wind for current round ----
  const generateWind = useCallback(() => {
    const w = Math.round(
      (Math.random() * (WIND_RANGE.max - WIND_RANGE.min) + WIND_RANGE.min) * 10
    ) / 10
    setCurrentWind(w)
    return w
  }, [])

  // ---- Clean up animation frame on unmount ----
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (windSoundRef.current) {
        windSoundRef.current.stop()
        windSoundRef.current = null
      }
    }
  }, [])

  // ---- Clear trail dots ----
  const clearTrail = useCallback(() => {
    if (trailRef.current) {
      while (trailRef.current.firstChild) {
        trailRef.current.removeChild(trailRef.current.firstChild)
      }
    }
  }, [])

  // ===========================================================================
  // STATE TRANSITIONS
  // ===========================================================================

  // ---- TITLE → start game ----
  const handleStart = useCallback(() => {
    const tutorialSeen = lsGet(LS_TUTORIAL, false)
    setCurrentRound(0)
    setScores([])
    setFinalScores([])
    setTotalScore(0)
    setFinalGrade(null)
    setIsNewRecord(false)

    if (!tutorialSeen) {
      setScreen('TUTORIAL')
    } else {
      generateWind()
      setScreen('ROUND_INTRO')
    }
  }, [generateWind])

  // ---- TUTORIAL → dismiss ----
  const handleTutorialDismiss = useCallback(() => {
    lsSet(LS_TUTORIAL, true)
    generateWind()
    setScreen('ROUND_INTRO')
  }, [generateWind])

  // ---- ROUND_INTRO → APPROACH (auto after 1.5s) ----
  useEffect(() => {
    if (screen !== 'ROUND_INTRO') return
    playSound('countdown')
    const timer = setTimeout(() => {
      setScreen('APPROACH')
    }, ROUND_INTRO_DURATION)
    return () => clearTimeout(timer)
  }, [screen, currentRound])

  // ---- APPROACH animation loop ----
  useEffect(() => {
    if (screen !== 'APPROACH') return

    playSound('whoosh')
    approachStartRef.current = performance.now()
    let lastSpeedLineTime = 0

    // Reset body pose from any previous round's crash/flight animation
    if (jumperBodyRef.current) {
      jumperBodyRef.current.style.animation = ''
      jumperBodyRef.current.style.transition = 'transform 0.15s ease-out'
      jumperBodyRef.current.style.transform = 'scaleY(0.7) scaleX(1.1)'
    }

    function tick() {
      const elapsed = performance.now() - approachStartRef.current
      const pos = calculateApproach(elapsed, APPROACH_DURATION)

      // Direct DOM update for smooth animation
      if (jumperRef.current) {
        jumperRef.current.style.transform =
          `translate(${pos.x * scale}px, ${pos.y * scale}px) rotate(${38}deg)`
      }
      // Crouch pose during approach
      if (jumperBodyRef.current) {
        jumperBodyRef.current.style.transform = 'scaleY(0.7) scaleX(1.1)'
      }

      // Speed lines: spawn batch every 100ms behind the jumper
      if (elapsed - lastSpeedLineTime > 100 && elapsed < APPROACH_DURATION && trailRef.current) {
        lastSpeedLineTime = elapsed
        const lineCount = 3 + Math.floor(Math.random() * 3) // 3-5 lines
        for (let i = 0; i < lineCount; i++) {
          const line = document.createElement('div')
          // Offset behind jumper (up-left along ramp at 38deg)
          const offsetBack = 10 + Math.random() * 25
          const spread = (Math.random() - 0.5) * 16
          const lx = (pos.x - offsetBack * Math.cos(38 * Math.PI / 180) + spread * Math.sin(38 * Math.PI / 180)) * scale
          const ly = (pos.y - offsetBack * Math.sin(38 * Math.PI / 180) - spread * Math.cos(38 * Math.PI / 180)) * scale
          const w = (20 + Math.random() * 20) * scale
          line.style.cssText = `
            position:absolute;
            left:${lx}px;
            top:${ly}px;
            width:${w}px;
            height:${2 * scale}px;
            background:white;
            opacity:0.3;
            pointer-events:none;
            border-radius:1px;
            transform:rotate(38deg);
            animation:speedLine 300ms linear forwards;
          `
          trailRef.current.appendChild(line)
          setTimeout(() => {
            if (line.parentNode) line.parentNode.removeChild(line)
          }, 350)
        }
      }

      if (elapsed < APPROACH_DURATION + 700) {
        // Keep running slightly past approach end for auto-launch
        animFrameRef.current = requestAnimationFrame(tick)
      }
    }

    animFrameRef.current = requestAnimationFrame(tick)

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [screen, scale])

  // ---- onLaunch callback from LaunchTimer ----
  const handleLaunch = useCallback(
    ({ grade }) => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }

      playSound('launch')
      vibrate([30])

      // Launch burst: radial lines from the lip
      if (trailRef.current) {
        const burstCount = 10
        const cx = RAMP_LIP.x * scale
        const cy = RAMP_LIP.y * scale
        for (let i = 0; i < burstCount; i++) {
          const angle = (i / burstCount) * 360
          const burst = document.createElement('div')
          burst.style.cssText = `
            position:absolute;
            left:${cx}px;
            top:${cy}px;
            width:${15 * scale}px;
            height:${2 * scale}px;
            background:white;
            pointer-events:none;
            border-radius:1px;
            transform-origin:0 50%;
            --burst-angle:${angle}deg;
            animation:launchBurst 200ms ease-out forwards;
          `
          trailRef.current.appendChild(burst)
          setTimeout(() => {
            if (burst.parentNode) burst.parentNode.removeChild(burst)
          }, 250)
        }
      }

      // Spring effect: snap from crouch to full size before flight elongation
      if (jumperBodyRef.current) {
        jumperBodyRef.current.style.transition = 'transform 0.1s cubic-bezier(0.34, 1.56, 0.64, 1)'
        jumperBodyRef.current.style.transform = 'scale(1.15)'
        setTimeout(() => {
          if (jumperBodyRef.current) {
            jumperBodyRef.current.style.transition = 'transform 0.2s ease-out'
            jumperBodyRef.current.style.transform = 'scaleX(1.3) scaleY(0.8)'
          }
        }, 100)
      }

      // Calculate launch velocity
      const vel = calculateLaunchVelocity(grade, currentWind)
      launchVelRef.current = vel

      // Create flight state
      const startPos = { x: RAMP_LIP.x, y: RAMP_LIP.y }
      const fState = createFlightState(vel, startPos)
      flightStateRef.current = fState

      // Estimate total flight time (rough: simulate ahead)
      let estState = createFlightState(vel, startPos)
      const dt = 1 / 60
      let estTime = 0
      while (!estState.landed && estTime < 10) {
        simulateFlight(estState, startPos, dt)
        estTime += dt
      }
      flightTotalTimeEstRef.current = Math.max(estTime, 0.5)

      setFlightProgress(0)
      setLiveDistance(0)
      frameCountRef.current = 0
      lastTimeRef.current = performance.now()

      // Start wind sound
      const ws = playSound('wind')
      windSoundRef.current = ws

      setScreen('FLIGHT')
    },
    [currentWind],
  )

  // ---- FLIGHT animation loop ----
  useEffect(() => {
    if (screen !== 'FLIGHT') return
    if (!flightStateRef.current) return

    const startPos = { x: RAMP_LIP.x, y: RAMP_LIP.y }
    lastTimeRef.current = performance.now()

    function tick() {
      const now = performance.now()
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05) // cap dt
      lastTimeRef.current = now

      const state = flightStateRef.current
      if (!state || state.landed) return

      simulateFlight(state, startPos, dt)

      // Update jumper via DOM ref
      if (jumperRef.current) {
        const angle = Math.atan2(state.vy, state.vx) * (180 / Math.PI)
        jumperRef.current.style.transform =
          `translate(${state.x * scale}px, ${state.y * scale}px) rotate(${angle}deg)`
      }
      // Maintain flight elongation pose
      if (jumperBodyRef.current) {
        jumperBodyRef.current.style.transform = 'scaleX(1.3) scaleY(0.8)'
      }

      // Trail dots: every 3rd frame
      frameCountRef.current++
      if (frameCountRef.current % 3 === 0 && trailRef.current) {
        const dot = document.createElement('div')
        dot.style.cssText = `
          position:absolute;
          left:${state.x * scale}px;
          top:${state.y * scale}px;
          width:${6 * scale}px;
          height:${6 * scale}px;
          border-radius:50%;
          background:${BRAND.white};
          opacity:0.4;
          pointer-events:none;
          transition:opacity 1s ease;
          box-shadow:0 0 ${4 * scale}px rgba(255,255,255,0.3);
        `
        trailRef.current.appendChild(dot)
        // Fade out after a frame
        requestAnimationFrame(() => {
          dot.style.opacity = '0'
        })
        // Remove after transition
        setTimeout(() => {
          if (dot.parentNode) dot.parentNode.removeChild(dot)
        }, 1100)
      }

      // Update live distance
      const currentDist =
        Math.max(0, Math.round(((state.x - startPos.x) / 1.265) * 10) / 10)
      if (liveDistRef.current) {
        liveDistRef.current.textContent = `${currentDist.toFixed(1)}m`
      }

      // Update flight progress for LandingTimer
      const fp = Math.min(state.flightTime / flightTotalTimeEstRef.current, 1)
      setFlightProgress(fp)
      setLiveDistance(currentDist)

      // Sync jumper pos for LandingTimer ring positioning
      setJumperPos({ x: state.x, y: state.y })

      if (!state.landed) {
        animFrameRef.current = requestAnimationFrame(tick)
      }
    }

    animFrameRef.current = requestAnimationFrame(tick)

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [screen, scale])

  // ---- onLand callback from LandingTimer ----
  const handleLand = useCallback(
    ({ grade, multiplier }) => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }

      // Stop wind sound
      if (windSoundRef.current) {
        windSoundRef.current.stop()
        windSoundRef.current = null
      }

      // Play landing sound
      if (grade === 'telemark') {
        playSound('landing_perfect')
      } else if (grade === 'clean') {
        playSound('landing_good')
      } else {
        playSound('landing_bad')
      }

      vibrate(grade === 'crash' ? [50, 30, 50] : [20])

      // Set landing grade for visual effects
      setLandingGrade(grade)

      // Reset body transform, then apply landing-specific effect
      if (jumperBodyRef.current) {
        jumperBodyRef.current.style.transition = 'none'
        if (grade === 'crash') {
          jumperBodyRef.current.style.animation = 'crashTumble 0.4s ease-out forwards'
        } else {
          jumperBodyRef.current.style.transform = 'scale(1)'
          jumperBodyRef.current.style.transition = 'transform 0.15s ease-out'
        }
      }

      // Show telemark V for perfect/clean landings
      if ((grade === 'telemark' || grade === 'clean') && telemarkVRef.current) {
        telemarkVRef.current.style.opacity = '1'
        setTimeout(() => {
          if (telemarkVRef.current) {
            telemarkVRef.current.style.opacity = '0'
          }
        }, 500)
      }

      // Calculate score — use current position (state.x), not state.distance
      // which is only set when physics detects ground collision
      const state = flightStateRef.current
      const rawDist = state
        ? Math.max(0, (state.x - RAMP_LIP.x) / 1.265)
        : 0
      const result = calculateScore(rawDist, multiplier)

      // Snow burst at landing position
      if (state) {
        spawnSnowBurst(state.x, state.y, grade)
      }

      // Camera shake based on landing quality
      applyCameraShake(grade)

      // Store round result
      const roundResult = {
        round: currentRound,
        distance: result.finalDistance,
        rawDistance: result.raw,
        multiplier: result.multiplier,
        landingGrade: grade,
        jumper: JUMPERS[currentRound],
        wind: currentWind,
        counted: false, // will be set after all rounds
      }

      setScores((prev) => [...prev, roundResult])
      setLiveDistance(result.finalDistance)

      // Impact freeze frame (50ms pause) then transition to LANDING
      setScreen('LANDING')

      setTimeout(() => {
        playSound('tick')
        setScreen('SCORE_DISPLAY')
      }, 550)
    },
    [currentRound, currentWind, spawnSnowBurst, applyCameraShake],
  )

  // ---- SCORE_DISPLAY → next round or RESULTS ----
  useEffect(() => {
    if (screen !== 'SCORE_DISPLAY') return

    const timer = setTimeout(() => {
      const nextRound = currentRound + 1
      if (nextRound >= ROUNDS_PER_GAME) {
        // Game complete — calculate final results
        finishGame()
      } else {
        // Next round
        setCurrentRound(nextRound)
        clearTrail()
        generateWind()
        setScreen('ROUND_INTRO')
      }
    }, SCORE_DISPLAY_DURATION)

    return () => clearTimeout(timer)
  }, [screen, currentRound])

  // ---- Finish game: calculate totals, update localStorage ----
  const finishGame = useCallback(() => {
    setScores((prevScores) => {
      // Sort by distance descending, mark top 3 as counted
      const sorted = [...prevScores].sort((a, b) => b.distance - a.distance)
      const counted = sorted.map((s, i) => ({ ...s, counted: i < BEST_N }))
      // Re-sort back to round order for display
      const ordered = counted.sort((a, b) => a.round - b.round)

      const total =
        Math.round(
          ordered
            .filter((s) => s.counted)
            .reduce((sum, s) => sum + s.distance, 0) * 10
        ) / 10
      const grade = getGrade(total)

      // Check for new record
      const prevBest = lsGet(LS_BEST, 0)
      const newRecord = total > prevBest

      if (newRecord) {
        lsSet(LS_BEST, total)
        setBestScore(total)
        playSound('crowd')
      }

      // Update streak
      const lastPlayed = lsGet(LS_LAST_PLAYED, null)
      let newStreak = 1
      if (wasYesterday(lastPlayed)) {
        newStreak = lsGet(LS_STREAK, 0) + 1
      }
      lsSet(LS_STREAK, newStreak)
      lsSet(LS_LAST_PLAYED, new Date().toISOString())
      setStreak(newStreak)

      setFinalScores(ordered)
      setTotalScore(total)
      setFinalGrade(grade)
      setIsNewRecord(newRecord)
      setScreen('RESULTS')

      return ordered
    })
  }, [])

  // ---- Play again from RESULTS ----
  const handlePlayAgain = useCallback(() => {
    clearTrail()
    flightStateRef.current = null
    launchVelRef.current = null
    setFlightProgress(0)
    setLiveDistance(0)
    setJumperPos({ x: RAMP_TOP.x, y: RAMP_TOP.y })
    setScreen('TITLE')
  }, [clearTrail])

  // ---- Share handler ----
  const handleShare = useCallback((text) => {
    if (navigator.share) {
      navigator.share({ text }).catch(() => {
        navigator.clipboard?.writeText(text)
      })
    } else {
      navigator.clipboard?.writeText(text)
    }
  }, [])

  // ---- Challenge handler ----
  const handleChallenge = useCallback(() => {
    const url = `${window.location.origin}${window.location.pathname}?challenge=true&name=Me&score=${totalScore}`
    if (navigator.share) {
      navigator.share({ url, text: `Can you beat my ${totalScore}m ski jump?` }).catch(() => {
        navigator.clipboard?.writeText(url)
      })
    } else {
      navigator.clipboard?.writeText(url)
    }
  }, [totalScore])

  // ===========================================================================
  // DERIVED VALUES
  // ===========================================================================
  const jumper = JUMPERS[currentRound] || JUMPERS[0]
  const isGameplay =
    screen === 'APPROACH' ||
    screen === 'FLIGHT' ||
    screen === 'LANDING' ||
    screen === 'SCORE_DISPLAY' ||
    screen === 'ROUND_INTRO'

  // Current round score (the most recent entry in scores for display)
  const currentScore = scores.length > 0 ? scores[scores.length - 1] : null

  // Wind direction text
  const windText =
    currentWind > 0
      ? `${currentWind.toFixed(1)}m/s \u2192`
      : currentWind < 0
        ? `${Math.abs(currentWind).toFixed(1)}m/s \u2190`
        : '0.0m/s'

  // ===========================================================================
  // RENDER
  // ===========================================================================

  // ---- TITLE screen ----
  if (screen === 'TITLE') {
    return (
      <TitleScreen
        onStart={handleStart}
        bestScore={bestScore}
        streak={streak}
        challengerName={challengerName}
        challengerScore={challengerScore}
      />
    )
  }

  // ---- RESULTS screen ----
  if (screen === 'RESULTS') {
    return (
      <ResultsScreen
        scores={finalScores}
        totalScore={totalScore}
        grade={finalGrade}
        bestScore={bestScore}
        isNewRecord={isNewRecord}
        challengerName={challengerName}
        challengerScore={challengerScore}
        onPlayAgain={handlePlayAgain}
        onShare={handleShare}
        onChallenge={handleChallenge}
      />
    )
  }

  // ---- GAMEPLAY screens (TUTORIAL, ROUND_INTRO, APPROACH, FLIGHT, LANDING, SCORE_DISPLAY) ----
  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        background: BRAND.dark,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: FONT,
        overflow: 'hidden',
      }}
    >
      {/* ================================================================= */}
      {/* HUD BAR — fixed at top                                           */}
      {/* ================================================================= */}
      <div
        style={{
          width: '100%',
          maxWidth: GAME_W * scale,
          height: 36,
          background: 'rgba(17,24,39,0.9)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          boxSizing: 'border-box',
          zIndex: 100,
          flexShrink: 0,
        }}
      >
        {/* Left: Round indicator */}
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: BRAND.white,
            letterSpacing: '0.5px',
          }}
        >
          Round {currentRound + 1}/{ROUNDS_PER_GAME}
        </div>

        {/* Centre: Jumper name + emoji */}
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: BRAND.grayLight,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>{jumper.emoji}</span>
          <span>{jumper.name}</span>
        </div>

        {/* Right: Mute toggle */}
        <button
          onClick={toggleMute}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 18,
            cursor: 'pointer',
            padding: '4px',
            lineHeight: 1,
          }}
          aria-label={soundMuted ? 'Unmute' : 'Mute'}
        >
          {soundMuted ? '\uD83D\uDD07' : '\uD83D\uDD0A'}
        </button>
      </div>

      {/* ================================================================= */}
      {/* SCORE BADGES — previous rounds                                    */}
      {/* ================================================================= */}
      {scores.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 6,
            padding: '6px 12px',
            flexWrap: 'wrap',
            justifyContent: 'center',
            maxWidth: GAME_W * scale,
            zIndex: 100,
            flexShrink: 0,
          }}
        >
          {scores.map((s, i) => (
            <div
              key={i}
              style={{
                padding: '3px 10px',
                borderRadius: 12,
                background: LANDING_BADGE_BG[s.landingGrade] || BRAND.gray,
                fontSize: 11,
                fontWeight: 700,
                color: BRAND.white,
                opacity: 0.85,
                letterSpacing: '0.3px',
              }}
            >
              {s.distance.toFixed(1)}m
            </div>
          ))}
        </div>
      )}

      {/* ================================================================= */}
      {/* GAME CONTAINER — scaled game area                                 */}
      {/* ================================================================= */}
      <div ref={gameContainerRef} style={containerStyle} data-game-container>
        <SkiJumpScene>
          {/* ---- JUMPER ---- */}
          {(screen === 'APPROACH' ||
            screen === 'FLIGHT' ||
            screen === 'LANDING') && (
            <div
              ref={jumperRef}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: 40 * scale,
                height: 40 * scale,
                zIndex: 5,
                transform: `translate(${RAMP_TOP.x * scale}px, ${RAMP_TOP.y * scale}px)`,
                transformOrigin: 'center center',
                pointerEvents: 'none',
              }}
            >
              {/* Inner body div for pose transforms (crouch/flight/crash) */}
              <div
                ref={jumperBodyRef}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: jumper.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22 * scale,
                  lineHeight: 1,
                  boxShadow: `0 2px 8px rgba(0,0,0,0.4), 0 0 12px ${jumper.color}4D`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.15s ease-out',
                }}
              >
                {jumper.emoji}
              </div>
              {/* Telemark V indicator — shown on perfect/clean landings */}
              <div
                ref={telemarkVRef}
                style={{
                  position: 'absolute',
                  top: -8 * scale,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  opacity: 0,
                  transition: 'opacity 0.3s ease-out',
                  pointerEvents: 'none',
                  display: 'flex',
                  gap: 2 * scale,
                }}
              >
                <div style={{
                  width: 3 * scale,
                  height: 14 * scale,
                  background: BRAND.green,
                  borderRadius: 2 * scale,
                  transform: 'rotate(-20deg)',
                  boxShadow: `0 0 6px ${BRAND.green}88`,
                }} />
                <div style={{
                  width: 3 * scale,
                  height: 14 * scale,
                  background: BRAND.green,
                  borderRadius: 2 * scale,
                  transform: 'rotate(20deg)',
                  boxShadow: `0 0 6px ${BRAND.green}88`,
                }} />
              </div>
            </div>
          )}

          {/* ---- TRAIL CONTAINER ---- */}
          <div
            ref={trailRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 3,
            }}
          />

          {/* ---- WIND INDICATOR (during APPROACH + FLIGHT) ---- */}
          {(screen === 'APPROACH' || screen === 'FLIGHT') && (
            <div
              style={{
                position: 'absolute',
                top: 8 * scale,
                right: 8 * scale,
                padding: `${3 * scale}px ${8 * scale}px`,
                borderRadius: 8 * scale,
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(4px)',
                fontSize: 11 * scale,
                fontWeight: 600,
                color:
                  currentWind > 0
                    ? BRAND.green
                    : currentWind < 0
                      ? BRAND.red
                      : BRAND.grayLight,
                zIndex: 20,
                fontFamily: FONT,
                letterSpacing: '0.3px',
              }}
            >
              Wind: {windText}
            </div>
          )}

          {/* ---- LIVE DISTANCE COUNTER (during FLIGHT) ---- */}
          {screen === 'FLIGHT' && (
            <div
              ref={liveDistRef}
              style={{
                position: 'absolute',
                top: 8 * scale,
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: 28 * scale,
                fontWeight: 800,
                color: BRAND.white,
                zIndex: 20,
                fontFamily: FONT,
                textShadow: '0 2px 12px rgba(0,0,0,0.6)',
                letterSpacing: '-0.5px',
                pointerEvents: 'none',
              }}
            >
              0.0m
            </div>
          )}

          {/* ---- LAUNCH TIMER ---- */}
          <LaunchTimer
            active={screen === 'APPROACH'}
            onLaunch={handleLaunch}
            gameScale={scale}
          />

          {/* ---- LANDING TIMER ---- */}
          <LandingTimer
            active={screen === 'FLIGHT'}
            flightProgress={flightProgress}
            onLand={handleLand}
            jumperPos={jumperPos}
            gameScale={scale}
          />

          {/* ---- TUTORIAL OVERLAY ---- */}
          {screen === 'TUTORIAL' && (
            <Tutorial onDismiss={handleTutorialDismiss} gameScale={scale} />
          )}

          {/* ---- ROUND INTRO OVERLAY ---- */}
          {screen === 'ROUND_INTRO' && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                zIndex: 50,
              }}
            >
              <div
                style={{
                  fontSize: 18 * scale,
                  fontWeight: 700,
                  color: BRAND.grayLight,
                  letterSpacing: '1px',
                  marginBottom: 8 * scale,
                  animation: 'fadeUp 0.4s ease-out',
                  fontFamily: FONT,
                }}
              >
                Round {currentRound + 1}/{ROUNDS_PER_GAME}
              </div>
              <div
                style={{
                  fontSize: 32 * scale,
                  lineHeight: 1.2,
                  marginBottom: 6 * scale,
                  animation: 'popIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275) 0.1s both',
                }}
              >
                {jumper.emoji}
              </div>
              <div
                style={{
                  fontSize: 22 * scale,
                  fontWeight: 800,
                  color: BRAND.white,
                  letterSpacing: '0.5px',
                  marginBottom: 12 * scale,
                  animation: 'fadeUp 0.4s ease-out 0.15s both',
                  fontFamily: FONT,
                  textShadow: `0 0 16px ${jumper.color}66`,
                }}
              >
                {jumper.name}
              </div>
              <div
                style={{
                  fontSize: 13 * scale,
                  fontWeight: 600,
                  color:
                    currentWind > 0
                      ? BRAND.green
                      : currentWind < 0
                        ? BRAND.red
                        : BRAND.grayLight,
                  animation: 'fadeUp 0.4s ease-out 0.25s both',
                  fontFamily: FONT,
                }}
              >
                Wind: {windText}
              </div>
            </div>
          )}

          {/* ---- SCORE DISPLAY OVERLAY ---- */}
          {screen === 'SCORE_DISPLAY' && currentScore && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                zIndex: 50,
              }}
            >
              {/* Distance */}
              <div
                style={{
                  fontSize: 48 * scale,
                  fontWeight: 800,
                  color: BRAND.white,
                  letterSpacing: '-1px',
                  animation: 'popIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275)',
                  fontFamily: FONT,
                  textShadow: '0 2px 16px rgba(0,0,0,0.5)',
                  lineHeight: 1.1,
                }}
              >
                {currentScore.distance.toFixed(1)}m
              </div>

              {/* Landing grade */}
              <div
                style={{
                  fontSize: 16 * scale,
                  fontWeight: 700,
                  color: LANDING_BADGE_BG[currentScore.landingGrade] || BRAND.white,
                  marginTop: 8 * scale,
                  animation: 'fadeUp 0.4s ease-out 0.2s both',
                  fontFamily: FONT,
                  letterSpacing: '0.5px',
                }}
              >
                {currentScore.landingGrade === 'telemark' && '\u2708\uFE0F '}
                {currentScore.landingGrade === 'clean' && '\uD83C\uDFBF '}
                {currentScore.landingGrade === 'shaky' && '\uD83D\uDE2C '}
                {currentScore.landingGrade === 'crash' && '\uD83D\uDCA5 '}
                {LANDING_LABEL[currentScore.landingGrade]}
                {' '}({currentScore.multiplier}x)
              </div>

              {/* Contextual message */}
              <div
                style={{
                  fontSize: 14 * scale,
                  fontWeight: 500,
                  color: BRAND.grayLight,
                  marginTop: 10 * scale,
                  animation: 'fadeUp 0.4s ease-out 0.35s both',
                  fontFamily: FONT,
                  fontStyle: 'italic',
                }}
              >
                {getDistanceMessage(currentScore.distance)}
              </div>
            </div>
          )}

          {/* ---- LANDING state: brief pause, jumper stays visible ---- */}
          {/* (No extra overlay needed — jumper ref is still rendered) */}
        </SkiJumpScene>
      </div>
    </div>
  )
}
