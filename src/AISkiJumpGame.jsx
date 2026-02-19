// =============================================================================
// AI Ski Jump Championship — Main Game Orchestrator (T7 + T8)
// Camera-tracked scene with two-layer rendering:
//   1. Scrolling layer: scene + jumper + trail + timers (moves with camera)
//   2. Fixed layer: HUD + overlays (stays in viewport)
// =============================================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import './styles.css'

import {
  BRAND,
  GAME_W,
  GAME_H,
  SCENE_W,
  RAMP_TOP,
  RAMP_LIP,
  JUMPERS,
  ROUNDS_PER_GAME,
  BEST_N,
  WIND_RANGE,
  APPROACH_DURATION,
  ROUND_INTRO_DURATION,
  ROUND_INTRO_FAST,
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
  getHillY,
  PIXELS_PER_METRE,
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
// Constants
// ---------------------------------------------------------------------------
const LS_BEST = 'skijump_bestScore'
const LS_GAMES_PLAYED = 'skijump_gamesPlayed'
const LS_TUTORIAL = 'skijump_tutorialSeen'
const LS_MUTED = 'skijump_muted'

const FONT = "'Open Sans','Segoe UI',system-ui,sans-serif"
const DISPLAY_FONT = "'Barlow Condensed','Open Sans',system-ui,sans-serif"

// Camera tracking
const CAMERA_FOLLOW_X = GAME_W * 0.35 // jumper kept at 35% from left
const CAMERA_MAX_X = SCENE_W - GAME_W  // max pan (400px)
const CAMERA_LERP = 0.12               // smooth follow speed

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
// Helpers
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
    // quota exceeded — ignore
  }
}

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
  const { scale, containerStyle } = useGameScale()

  // ---- Game state machine ----
  const [screen, setScreen] = useState('TITLE')
  const [currentRound, setCurrentRound] = useState(0)
  const [scores, setScores] = useState([])
  const [currentWind, setCurrentWind] = useState(0)
  const [flightProgress, setFlightProgress] = useState(0)
  const [bestScore, setBestScore] = useState(null)
  const [gamesPlayed, setGamesPlayed] = useState(0)
  const [soundMuted, setSoundMuted] = useState(false)
  const [liveDistance, setLiveDistance] = useState(0)

  const [challengerName, setChallengerName] = useState(null)
  const [challengerScore, setChallengerScore] = useState(null)

  const [finalScores, setFinalScores] = useState([])
  const [totalScore, setTotalScore] = useState(0)
  const [finalGrade, setFinalGrade] = useState(null)
  const [isNewRecord, setIsNewRecord] = useState(false)

  const [jumperPos, setJumperPos] = useState({ x: RAMP_TOP.x, y: RAMP_TOP.y })
  const [landingGrade, setLandingGrade] = useState(null)

  // ---- Refs ----
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
  const flightTotalTimeEstRef = useRef(3)
  const jumperBodyRef = useRef(null)
  const telemarkVRef = useRef(null)
  const gameContainerRef = useRef(null)

  // Camera tracking refs
  const scrollLayerRef = useRef(null)
  const shakeWrapperRef = useRef(null)
  const cameraXRef = useRef(0)

  // ---- Snow burst particles (appended to trail container) ----
  const spawnSnowBurst = useCallback((landX, landY, grade) => {
    const container = trailRef.current
    if (!container) return

    const count = grade === 'telemark' ? 8 : grade === 'clean' ? 12 : grade === 'shaky' ? 16 : 22
    const spread = grade === 'telemark' ? 40 : grade === 'clean' ? 60 : grade === 'shaky' ? 80 : 120

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div')
      const size = 4 + Math.random() * 4
      const angle = Math.random() * Math.PI * 2
      const speed = (0.3 + Math.random() * 0.7) * spread
      const dx = Math.cos(angle) * speed
      const dy = Math.sin(angle) * speed - Math.abs(Math.sin(angle)) * spread * 0.3

      particle.style.cssText = `
        position:absolute;
        left:${landX}px;
        top:${landY}px;
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
  }, [])

  // ---- Camera shake on landing (uses shakeWrapper to avoid clobbering container scale) ----
  const applyCameraShake = useCallback((grade) => {
    const wrapper = shakeWrapperRef.current
    if (!wrapper) return
    if (grade === 'telemark') return

    const anim = grade === 'clean' ? 'shakeLight' : grade === 'shaky' ? 'shakeMedium' : 'shakeHeavy'
    const dur = grade === 'clean' ? '50ms' : grade === 'shaky' ? '200ms' : '400ms'

    wrapper.style.animation = `${anim} ${dur} ease-out`
    const cleanup = () => {
      wrapper.style.animation = ''
      wrapper.removeEventListener('animationend', cleanup)
    }
    wrapper.addEventListener('animationend', cleanup)
  }, [])

  // ---- Camera helper: update scroll layer position ----
  const updateCamera = useCallback((targetX) => {
    const clamped = Math.max(0, Math.min(targetX, CAMERA_MAX_X))
    cameraXRef.current += (clamped - cameraXRef.current) * CAMERA_LERP
    if (scrollLayerRef.current) {
      scrollLayerRef.current.style.transform = `translateX(${-cameraXRef.current}px)`
    }
  }, [])

  const resetCameraInstant = useCallback(() => {
    cameraXRef.current = 0
    if (scrollLayerRef.current) {
      scrollLayerRef.current.style.transform = 'translateX(0px)'
    }
  }, [])

  // ---- On mount: read localStorage + parse challenge params ----
  useEffect(() => {
    setBestScore(lsGet(LS_BEST, null))
    setGamesPlayed(lsGet(LS_GAMES_PLAYED, 0))
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

  // ---- Keyboard integration ----
  useEffect(() => {
    function handleKey(e) {
      if (e.code === 'KeyM') toggleMute()
      if (e.code === 'KeyR' && screen === 'RESULTS') handlePlayAgain()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [screen, toggleMute])

  // ---- Generate wind ----
  const generateWind = useCallback(() => {
    const w = Math.round(
      (Math.random() * (WIND_RANGE.max - WIND_RANGE.min) + WIND_RANGE.min) * 10
    ) / 10
    setCurrentWind(w)
    return w
  }, [])

  // ---- Cleanup on unmount ----
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

  const handleStart = useCallback(() => {
    const tutorialSeen = lsGet(LS_TUTORIAL, false)
    setCurrentRound(0)
    setScores([])
    setFinalScores([])
    setTotalScore(0)
    setFinalGrade(null)
    setIsNewRecord(false)
    resetCameraInstant()

    if (!tutorialSeen) {
      setScreen('TUTORIAL')
    } else {
      generateWind()
      setScreen('ROUND_INTRO')
    }
  }, [generateWind, resetCameraInstant])

  const handleTutorialDismiss = useCallback(() => {
    lsSet(LS_TUTORIAL, true)
    generateWind()
    setScreen('ROUND_INTRO')
  }, [generateWind])

  // ---- ROUND_INTRO → APPROACH (with camera reset animation) ----
  useEffect(() => {
    if (screen !== 'ROUND_INTRO') return
    playSound('countdown')

    // Animate camera back to ramp
    let raf = null
    function resetTick() {
      if (cameraXRef.current > 0.5) {
        cameraXRef.current *= 0.9
        if (scrollLayerRef.current) {
          scrollLayerRef.current.style.transform = `translateX(${-cameraXRef.current}px)`
        }
        raf = requestAnimationFrame(resetTick)
      } else {
        cameraXRef.current = 0
        if (scrollLayerRef.current) {
          scrollLayerRef.current.style.transform = 'translateX(0px)'
        }
      }
    }
    raf = requestAnimationFrame(resetTick)

    const introDuration = currentRound === 0 ? ROUND_INTRO_DURATION : ROUND_INTRO_FAST
    const timer = setTimeout(() => {
      setScreen('APPROACH')
    }, introDuration)
    return () => {
      clearTimeout(timer)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [screen, currentRound])

  // ---- APPROACH animation loop ----
  useEffect(() => {
    if (screen !== 'APPROACH') return

    playSound('whoosh')
    approachStartRef.current = performance.now()
    let lastSpeedLineTime = 0

    if (jumperBodyRef.current) {
      jumperBodyRef.current.style.animation = ''
      jumperBodyRef.current.style.transition = 'transform 0.15s ease-out'
      jumperBodyRef.current.style.transform = 'scaleX(0.85) scaleY(1.1)' // tuck pose
    }

    function tick() {
      const elapsed = performance.now() - approachStartRef.current
      const pos = calculateApproach(elapsed, APPROACH_DURATION)

      // Jumper position — game coordinates, centered on path
      if (jumperRef.current) {
        jumperRef.current.style.transform =
          `translate(${pos.x - 18}px, ${pos.y - 18}px) rotate(38deg)`
      }
      if (jumperBodyRef.current) {
        jumperBodyRef.current.style.transform = 'scaleX(0.85) scaleY(1.1)' // tuck pose
      }

      // Camera: ensure at 0 during approach
      if (cameraXRef.current > 0.5) {
        cameraXRef.current *= 0.92
        if (scrollLayerRef.current) {
          scrollLayerRef.current.style.transform = `translateX(${-cameraXRef.current}px)`
        }
      }

      // Speed lines behind jumper
      if (elapsed - lastSpeedLineTime > 100 && elapsed < APPROACH_DURATION && trailRef.current) {
        lastSpeedLineTime = elapsed
        const lineCount = 3 + Math.floor(Math.random() * 3)
        for (let i = 0; i < lineCount; i++) {
          const line = document.createElement('div')
          const offsetBack = 10 + Math.random() * 25
          const spread = (Math.random() - 0.5) * 16
          const rad38 = 38 * Math.PI / 180
          const lx = pos.x - offsetBack * Math.cos(rad38) + spread * Math.sin(rad38)
          const ly = pos.y - offsetBack * Math.sin(rad38) - spread * Math.cos(rad38)
          const w = 25 + Math.random() * 25
          line.style.cssText = `
            position:absolute;
            left:${lx}px;
            top:${ly}px;
            width:${w}px;
            height:3px;
            background:linear-gradient(90deg, white, transparent);
            opacity:0.6;
            pointer-events:none;
            border-radius:2px;
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
        animFrameRef.current = requestAnimationFrame(tick)
      }
    }

    animFrameRef.current = requestAnimationFrame(tick)

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [screen])

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
        const cx = RAMP_LIP.x
        const cy = RAMP_LIP.y
        for (let i = 0; i < burstCount; i++) {
          const angle = (i / burstCount) * 360
          const burst = document.createElement('div')
          burst.style.cssText = `
            position:absolute;
            left:${cx}px;
            top:${cy}px;
            width:15px;
            height:2px;
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

      // Spring effect — brief scale pop then settle to flight pose
      if (jumperBodyRef.current) {
        jumperBodyRef.current.style.transition = 'transform 0.1s cubic-bezier(0.34, 1.56, 0.64, 1)'
        jumperBodyRef.current.style.transform = 'scale(1.2)'
        setTimeout(() => {
          if (jumperBodyRef.current) {
            jumperBodyRef.current.style.transition = 'transform 0.2s ease-out'
            jumperBodyRef.current.style.transform = 'scale(1)' // SVG is already in flight shape
          }
        }, 100)
      }

      // Calculate launch velocity
      const vel = calculateLaunchVelocity(grade, currentWind)
      launchVelRef.current = vel

      const startPos = { x: RAMP_LIP.x, y: RAMP_LIP.y }
      const fState = createFlightState(vel, startPos)
      flightStateRef.current = fState

      // Estimate total flight time
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

      const ws = playSound('wind')
      windSoundRef.current = ws

      setScreen('FLIGHT')
    },
    [currentWind],
  )

  // ---- FLIGHT animation loop (with camera tracking) ----
  useEffect(() => {
    if (screen !== 'FLIGHT') return
    if (!flightStateRef.current) return

    const startPos = { x: RAMP_LIP.x, y: RAMP_LIP.y }
    lastTimeRef.current = performance.now()

    function tick() {
      const now = performance.now()
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05)
      lastTimeRef.current = now

      const state = flightStateRef.current
      if (!state || state.landed) return

      simulateFlight(state, startPos, dt)

      // Update jumper position — game coordinates, centered
      if (jumperRef.current) {
        const angle = Math.atan2(state.vy, state.vx) * (180 / Math.PI)
        jumperRef.current.style.transform =
          `translate(${state.x - 18}px, ${state.y - 18}px) rotate(${angle}deg)`
      }
      if (jumperBodyRef.current) {
        jumperBodyRef.current.style.transform = 'scale(1)' // flight pose (SVG is already in flight shape)
      }

      // ---- CAMERA TRACKING ----
      const targetCameraX = Math.max(0, Math.min(state.x - CAMERA_FOLLOW_X, CAMERA_MAX_X))
      cameraXRef.current += (targetCameraX - cameraXRef.current) * CAMERA_LERP
      if (scrollLayerRef.current) {
        scrollLayerRef.current.style.transform = `translateX(${-cameraXRef.current}px)`
      }

      // Trail dots every 2nd frame — altitude-based colouring
      // Blue (high/safe) → Orange (getting close) → Red (land now!)
      frameCountRef.current++
      if (frameCountRef.current % 2 === 0 && trailRef.current) {
        const hillY = getHillY(state.x)
        const altitude = hillY - state.y // positive = above hill
        const altRatio = Math.max(0, Math.min(1, altitude / 120)) // 0=on hill, 1=high up
        // Colour: red(low) → orange(mid) → blue(high)
        let trailColor, trailGlow
        if (altRatio > 0.5) {
          trailColor = BRAND.blueLight
          trailGlow = `0 0 6px ${BRAND.blue}88`
        } else if (altRatio > 0.2) {
          trailColor = BRAND.orange
          trailGlow = `0 0 8px ${BRAND.orange}88`
        } else {
          trailColor = BRAND.red
          trailGlow = `0 0 10px ${BRAND.red}aa`
        }
        const dot = document.createElement('div')
        dot.style.cssText = `
          position:absolute;
          left:${state.x - 4}px;
          top:${state.y - 4}px;
          width:8px;
          height:8px;
          border-radius:50%;
          background:${trailColor};
          opacity:0.7;
          pointer-events:none;
          transition:opacity 1.2s ease;
          box-shadow:${trailGlow};
        `
        trailRef.current.appendChild(dot)
        requestAnimationFrame(() => {
          dot.style.opacity = '0'
        })
        setTimeout(() => {
          if (dot.parentNode) dot.parentNode.removeChild(dot)
        }, 1300)
      }

      // Live distance (using correct PIXELS_PER_METRE)
      const currentDist =
        Math.max(0, Math.round(((state.x - startPos.x) / PIXELS_PER_METRE) * 10) / 10)
      if (liveDistRef.current) {
        liveDistRef.current.textContent = `${currentDist.toFixed(1)}m`
      }

      const fp = Math.min(state.flightTime / flightTotalTimeEstRef.current, 1)
      setFlightProgress(fp)
      setLiveDistance(currentDist)
      setJumperPos({ x: state.x, y: state.y })

      if (!state.landed) {
        animFrameRef.current = requestAnimationFrame(tick)
      }
    }

    animFrameRef.current = requestAnimationFrame(tick)

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [screen])

  // ---- onLand callback from LandingTimer ----
  const handleLand = useCallback(
    ({ grade, multiplier }) => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }

      if (windSoundRef.current) {
        windSoundRef.current.stop()
        windSoundRef.current = null
      }

      if (grade === 'telemark') {
        playSound('landing_perfect')
      } else if (grade === 'clean') {
        playSound('landing_good')
      } else {
        playSound('landing_bad')
      }

      vibrate(grade === 'crash' ? [50, 30, 50] : [20])
      setLandingGrade(grade)

      if (jumperBodyRef.current) {
        jumperBodyRef.current.style.transition = 'none'
        if (grade === 'crash') {
          jumperBodyRef.current.style.animation = 'crashTumble 0.4s ease-out forwards'
        } else {
          jumperBodyRef.current.style.transform = 'scale(1)'
          jumperBodyRef.current.style.transition = 'transform 0.15s ease-out'
        }
      }

      if ((grade === 'telemark' || grade === 'clean') && telemarkVRef.current) {
        telemarkVRef.current.style.opacity = '1'
        setTimeout(() => {
          if (telemarkVRef.current) {
            telemarkVRef.current.style.opacity = '0'
          }
        }, 500)
      }

      // Calculate score using PIXELS_PER_METRE (not hardcoded 1.265)
      const state = flightStateRef.current
      const rawDist = state
        ? Math.max(0, (state.x - RAMP_LIP.x) / PIXELS_PER_METRE)
        : 0
      const result = calculateScore(rawDist, multiplier)

      if (state) {
        spawnSnowBurst(state.x, state.y, grade)
      }

      applyCameraShake(grade)

      const roundResult = {
        round: currentRound,
        distance: result.finalDistance,
        rawDistance: result.raw,
        multiplier: result.multiplier,
        landingGrade: grade,
        jumper: JUMPERS[currentRound],
        wind: currentWind,
        counted: false,
      }

      setScores((prev) => [...prev, roundResult])
      setLiveDistance(result.finalDistance)

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
        finishGame()
      } else {
        setCurrentRound(nextRound)
        clearTrail()
        generateWind()
        setScreen('ROUND_INTRO')
      }
    }, SCORE_DISPLAY_DURATION)

    return () => clearTimeout(timer)
  }, [screen, currentRound])

  // ---- Finish game ----
  const finishGame = useCallback(() => {
    setScores((prevScores) => {
      const sorted = [...prevScores].sort((a, b) => b.distance - a.distance)
      const counted = sorted.map((s, i) => ({ ...s, counted: i < BEST_N }))
      const ordered = counted.sort((a, b) => a.round - b.round)

      const total =
        Math.round(
          ordered
            .filter((s) => s.counted)
            .reduce((sum, s) => sum + s.distance, 0) * 10
        ) / 10
      const grade = getGrade(total)

      const prevBest = lsGet(LS_BEST, 0)
      const newRecord = total > prevBest

      if (newRecord) {
        lsSet(LS_BEST, total)
        setBestScore(total)
        playSound('crowd')
      }

      const newGamesPlayed = lsGet(LS_GAMES_PLAYED, 0) + 1
      lsSet(LS_GAMES_PLAYED, newGamesPlayed)
      setGamesPlayed(newGamesPlayed)

      setFinalScores(ordered)
      setTotalScore(total)
      setFinalGrade(grade)
      setIsNewRecord(newRecord)
      setScreen('RESULTS')

      return ordered
    })
  }, [])

  // ---- Play again ----
  const handlePlayAgain = useCallback(() => {
    clearTrail()
    flightStateRef.current = null
    launchVelRef.current = null
    setFlightProgress(0)
    setLiveDistance(0)
    setJumperPos({ x: RAMP_TOP.x, y: RAMP_TOP.y })
    resetCameraInstant()
    setScreen('TITLE')
  }, [clearTrail, resetCameraInstant])

  // ---- Share / Challenge handlers ----
  const handleShare = useCallback((text) => {
    if (navigator.share) {
      navigator.share({ text }).catch(() => {
        navigator.clipboard?.writeText(text)
      })
    } else {
      navigator.clipboard?.writeText(text)
    }
  }, [])

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

  const currentScore = scores.length > 0 ? scores[scores.length - 1] : null

  const windText =
    currentWind > 0
      ? `${currentWind.toFixed(1)}m/s \u2192`
      : currentWind < 0
        ? `${Math.abs(currentWind).toFixed(1)}m/s \u2190`
        : '0.0m/s'

  // ===========================================================================
  // RENDER
  // ===========================================================================

  if (screen === 'TITLE') {
    return (
      <TitleScreen
        onStart={handleStart}
        bestScore={bestScore}
        gamesPlayed={gamesPlayed}
        challengerName={challengerName}
        challengerScore={challengerScore}
      />
    )
  }

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

  // ---- GAMEPLAY ----
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
          height: Math.round(36 * Math.max(scale, 0.65)),
          background: 'rgba(17,24,39,0.9)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `0 ${Math.round(12 * Math.max(scale, 0.65))}px`,
          boxSizing: 'border-box',
          zIndex: 100,
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: Math.round(13 * Math.max(scale, 0.65)), fontWeight: 700, color: BRAND.white, letterSpacing: '0.5px' }}>
          Round {currentRound + 1}/{ROUNDS_PER_GAME}
        </div>
        <div style={{ fontSize: Math.round(13 * Math.max(scale, 0.65)), fontWeight: 600, color: BRAND.grayLight, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>{jumper.emoji}</span>
          <span>{jumper.name}</span>
        </div>
        <button
          onClick={toggleMute}
          style={{
            background: 'none',
            border: 'none',
            fontSize: Math.round(18 * Math.max(scale, 0.65)),
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
      {scores.length > 0 && (() => {
        // Compute running best-3 total
        const sortedDists = [...scores].map(s => s.distance).sort((a, b) => b - a)
        const bestN = sortedDists.slice(0, BEST_N)
        const runningTotal = Math.round(bestN.reduce((sum, d) => sum + d, 0) * 10) / 10

        return (
          <div
            style={{
              display: 'flex',
              gap: 6,
              padding: '6px 12px',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              maxWidth: GAME_W * scale,
              zIndex: 100,
              flexShrink: 0,
            }}
          >
            {scores.map((s, i) => (
              <div
                key={i}
                style={{
                  padding: `${Math.round(3 * Math.max(scale, 0.65))}px ${Math.round(10 * Math.max(scale, 0.65))}px`,
                  borderRadius: 12,
                  background: LANDING_BADGE_BG[s.landingGrade] || BRAND.gray,
                  fontSize: Math.round(11 * Math.max(scale, 0.65)),
                  fontWeight: 700,
                  color: BRAND.white,
                  opacity: 0.85,
                  letterSpacing: '0.3px',
                }}
              >
                {s.distance.toFixed(1)}m
              </div>
            ))}
            {/* Running best-3 total */}
            {scores.length >= 2 && (
              <div style={{
                padding: `${Math.round(3 * Math.max(scale, 0.65))}px ${Math.round(10 * Math.max(scale, 0.65))}px`,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.1)',
                fontSize: Math.round(11 * Math.max(scale, 0.65)),
                fontWeight: 800,
                color: BRAND.blueLight,
                letterSpacing: '0.3px',
                fontFamily: DISPLAY_FONT,
              }}>
                Best {Math.min(scores.length, BEST_N)}: {runningTotal.toFixed(1)}m
              </div>
            )}
          </div>
        )
      })()}

      {/* ================================================================= */}
      {/* GAME CONTAINER — scaled game area with overflow hidden            */}
      {/* ================================================================= */}
      <div ref={gameContainerRef} style={{ ...containerStyle, overflow: 'hidden' }} data-game-container>
        {/* Shake wrapper — prevents camera shake from clobbering scale transform */}
        <div ref={shakeWrapperRef} style={{ position: 'absolute', inset: 0 }}>

          {/* ============================================================= */}
          {/* SCROLLING LAYER — moves with camera during flight             */}
          {/* ============================================================= */}
          <div
            ref={scrollLayerRef}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: SCENE_W,
              height: GAME_H,
            }}
          >
            <SkiJumpScene>
              {/* ---- JUMPER (SVG ski jumper with pose states) ---- */}
              {(screen === 'APPROACH' ||
                screen === 'FLIGHT' ||
                screen === 'LANDING') && (
                <div
                  ref={jumperRef}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: 48,
                    height: 28,
                    zIndex: 5,
                    transform: `translate(${RAMP_TOP.x - 18}px, ${RAMP_TOP.y - 18}px)`,
                    transformOrigin: 'center center',
                    pointerEvents: 'none',
                  }}
                >
                  <div
                    ref={jumperBodyRef}
                    style={{
                      width: '100%',
                      height: '100%',
                      transformOrigin: 'center center',
                      transition: 'transform 0.15s ease-out',
                      filter: `drop-shadow(0 2px 6px rgba(0,0,0,0.6)) drop-shadow(0 0 12px ${jumper.color}66)`,
                    }}
                  >
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: jumper.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                    }}>
                      {jumper.emoji}
                    </div>
                  </div>
                  {/* Telemark landing indicator */}
                  <div
                    ref={telemarkVRef}
                    style={{
                      position: 'absolute',
                      top: -10,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      opacity: 0,
                      transition: 'opacity 0.3s ease-out',
                      pointerEvents: 'none',
                      display: 'flex',
                      gap: 2,
                    }}
                  >
                    <div style={{
                      width: 3,
                      height: 14,
                      background: BRAND.green,
                      borderRadius: 2,
                      transform: 'rotate(-20deg)',
                      boxShadow: `0 0 6px ${BRAND.green}88`,
                    }} />
                    <div style={{
                      width: 3,
                      height: 14,
                      background: BRAND.green,
                      borderRadius: 2,
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

              {/* ---- LAUNCH TIMER (inside scrolling layer) ---- */}
              <LaunchTimer
                active={screen === 'APPROACH'}
                onLaunch={handleLaunch}
                gameScale={1}
              />

              {/* ---- LANDING TIMER (inside scrolling layer) ---- */}
              <LandingTimer
                active={screen === 'FLIGHT'}
                flightProgress={flightProgress}
                onLand={handleLand}
                jumperPos={jumperPos}
                gameScale={1}
              />
            </SkiJumpScene>
          </div>

          {/* ============================================================= */}
          {/* FIXED HUD LAYER — stays in viewport                          */}
          {/* ============================================================= */}

          {/* Wind indicator */}
          {(screen === 'APPROACH' || screen === 'FLIGHT') && (
            <div
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                padding: '3px 8px',
                borderRadius: 8,
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(4px)',
                fontSize: 11,
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

          {/* Live distance counter — display font */}
          {screen === 'FLIGHT' && (
            <div
              ref={liveDistRef}
              style={{
                position: 'absolute',
                top: 8,
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: 32,
                fontWeight: 800,
                color: BRAND.white,
                zIndex: 20,
                fontFamily: DISPLAY_FONT,
                textShadow: '0 2px 12px rgba(0,0,0,0.6), 0 0 24px rgba(37,99,235,0.3)',
                letterSpacing: '1px',
                pointerEvents: 'none',
              }}
            >
              0.0m
            </div>
          )}

          {/* ============================================================= */}
          {/* OVERLAY LAYER — fullscreen overlays                           */}
          {/* ============================================================= */}

          {/* Tutorial */}
          {screen === 'TUTORIAL' && (
            <Tutorial onDismiss={handleTutorialDismiss} gameScale={1} />
          )}

          {/* Round intro */}
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
                  fontSize: 18,
                  fontWeight: 700,
                  color: BRAND.grayLight,
                  letterSpacing: '1px',
                  marginBottom: 8,
                  animation: 'fadeUp 0.4s ease-out',
                  fontFamily: FONT,
                }}
              >
                Round {currentRound + 1}/{ROUNDS_PER_GAME}
              </div>
              <div
                style={{
                  fontSize: 32,
                  lineHeight: 1.2,
                  marginBottom: 6,
                  animation: 'popIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275) 0.1s both',
                }}
              >
                {jumper.emoji}
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: BRAND.white,
                  letterSpacing: '0.5px',
                  marginBottom: 12,
                  animation: 'fadeUp 0.4s ease-out 0.15s both',
                  fontFamily: FONT,
                  textShadow: `0 0 16px ${jumper.color}66`,
                }}
              >
                {jumper.name}
              </div>
              <div
                style={{
                  fontSize: 13,
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

          {/* Score display */}
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
              <div
                style={{
                  fontSize: 56,
                  fontWeight: 800,
                  color: BRAND.white,
                  letterSpacing: '1px',
                  animation: 'popIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275)',
                  fontFamily: DISPLAY_FONT,
                  textShadow: '0 2px 16px rgba(0,0,0,0.5)',
                  lineHeight: 1.1,
                }}
              >
                {currentScore.distance.toFixed(1)}m
              </div>

              {/* Raw distance x multiplier breakdown */}
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: BRAND.grayLight,
                  marginTop: 6,
                  animation: 'fadeUp 0.3s ease-out 0.15s both',
                  fontFamily: FONT,
                  letterSpacing: '0.3px',
                }}
              >
                {currentScore.rawDistance.toFixed(1)}m × {currentScore.multiplier}x
              </div>

              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: LANDING_BADGE_BG[currentScore.landingGrade] || BRAND.white,
                  marginTop: 8,
                  animation: 'fadeUp 0.4s ease-out 0.25s both',
                  fontFamily: FONT,
                  letterSpacing: '0.5px',
                }}
              >
                {LANDING_LABEL[currentScore.landingGrade]}
              </div>

              <div
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: BRAND.grayLight,
                  marginTop: 10,
                  animation: 'fadeUp 0.4s ease-out 0.4s both',
                  fontFamily: FONT,
                  fontStyle: 'italic',
                }}
              >
                {getDistanceMessage(currentScore.distance)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
