// =============================================================================
// AI Ski Jump Championship — Physics Module (T4)
// Pure JavaScript — no React, no DOM, no side effects.
// All functions are pure: given inputs → outputs.
// =============================================================================

import {
  GRAVITY,
  AIR_RESISTANCE,
  RAMP_HEIGHT,
  MAX_DISTANCE,
  RAMP_TOP,
  RAMP_LIP,
  LANDING_HILL_SLOPE,
  LAUNCH_ANGLES,
  SPEED_MULT,
  GAME_W,
  GAME_H,
} from './constants'

// ---------------------------------------------------------------------------
// Tuning constants
// ---------------------------------------------------------------------------
// PIXELS_PER_METRE: maps pixel distance along the hill to metres.
// The scene's hill run is ~215px (GAME_W-10 - RAMP_LIP.x) spanning ~170m,
// giving 215/170 ≈ 1.265 — matches the scene's distance markers exactly.
const PIXELS_PER_METRE = 1.265

// PIXEL_SCALE: converts the energy-conservation base speed (m/s) to px/s.
// Tuned so a perfect jump peaks ~100px above the lip and covers ~160-170m.
const PIXEL_SCALE = 3.2

// GRAVITY_SCALE: converts real gravity (9.81 m/s²) to px/s² for the game.
// Tuned together with PIXEL_SCALE so flight time is ~3s and arcs look good.
const GRAVITY_SCALE = 10

// VERT_DRAG_RATIO: vertical air resistance is this fraction of horizontal.
// Real ski jumpers create frontal drag (horizontal) but minimal vertical drag.
// Reducing vertical drag produces taller, more visually satisfying arcs
// without extending horizontal distance.
const VERT_DRAG_RATIO = 0.3

// Derived gravity in px/s²
const G_PX = GRAVITY * GRAVITY_SCALE

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const DEG_TO_RAD = Math.PI / 180

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val))
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

/** Random float between min and max (inclusive) */
function randBetween(min, max) {
  return min + Math.random() * (max - min)
}

// ---------------------------------------------------------------------------
// 1. calculateApproach(t, duration)
// ---------------------------------------------------------------------------
/**
 * Given time t (ms) and total approach duration (ms), return the jumper's
 * position on the ramp surface and a 0-1 progress value.
 *
 * The jumper moves from RAMP_TOP to RAMP_LIP with an accelerating feel
 * (gravity on slope), modelled by progress = (t/duration)^1.3.
 */
export function calculateApproach(t, duration) {
  const raw = clamp(t / duration, 0, 1)
  const progress = Math.pow(raw, 1.3) // acceleration feel

  const x = lerp(RAMP_TOP.x, RAMP_LIP.x, progress)
  const y = lerp(RAMP_TOP.y, RAMP_LIP.y, progress)

  return { x, y, progress }
}

// ---------------------------------------------------------------------------
// 2. calculateLaunchVelocity(timingGrade, windSpeed)
// ---------------------------------------------------------------------------
/**
 * Compute launch velocity vector based on timing grade and wind.
 *
 * timingGrade: 'perfect' | 'good' | 'ok' | 'miss'
 * windSpeed: m/s (negative = headwind, positive = tailwind)
 *
 * Returns { vx, vy, speed, angle } in px/s (screen coords: vy negative = up).
 */
export function calculateLaunchVelocity(timingGrade, windSpeed) {
  // --- Determine launch angle (degrees) ---
  let angleDeg
  switch (timingGrade) {
    case 'perfect':
      angleDeg = LAUNCH_ANGLES.perfect
      break
    case 'good':
      angleDeg = randBetween(LAUNCH_ANGLES.good_min, LAUNCH_ANGLES.good_max)
      break
    case 'ok':
      angleDeg = randBetween(LAUNCH_ANGLES.ok_min, LAUNCH_ANGLES.ok_max)
      break
    case 'miss':
    default:
      angleDeg = randBetween(LAUNCH_ANGLES.miss_min, LAUNCH_ANGLES.miss_max)
      break
  }

  // --- Compute base speed from energy conservation ---
  // v = sqrt(2 * g * rampHeight) gives the theoretical exit speed (~71.4 m/s),
  // multiplied by the timing grade's speed factor, then scaled to px/s.
  const baseSpeedMs = Math.sqrt(2 * GRAVITY * RAMP_HEIGHT) // ~71.4 m/s
  const mult = SPEED_MULT[timingGrade] ?? SPEED_MULT.miss
  const gradedSpeed = baseSpeedMs * mult
  const speed = gradedSpeed * PIXEL_SCALE // px/s

  // --- Decompose into vx, vy ---
  const angleRad = angleDeg * DEG_TO_RAD
  let vx = speed * Math.cos(angleRad)  // rightward (positive)
  let vy = -speed * Math.sin(angleRad) // upward (negative in screen coords)

  // --- Wind effect on horizontal velocity ---
  // Wind is in m/s; scale to px/s and apply 30% factor
  vx += windSpeed * PIXEL_SCALE * 0.3

  return { vx, vy, speed, angle: angleDeg }
}

// ---------------------------------------------------------------------------
// 3. simulateFlight(state, startPos, dt)
// ---------------------------------------------------------------------------
/**
 * Advance the flight simulation by one time step.
 *
 * state: mutable state object { x, y, vx, vy, landed, distance, flightTime }
 *   — initialise via createFlightState().
 * startPos: { x, y } — the RAMP_LIP position (launch origin).
 * dt: time step in seconds (typically 1/60).
 *
 * Mutates and returns the state object for convenience.
 */
export function simulateFlight(state, startPos, dt) {
  if (state.landed) return state

  // --- Apply gravity (downward = positive y in screen coords) ---
  state.vy += G_PX * dt

  // --- Apply air resistance ---
  // AIR_RESISTANCE (0.015) is calibrated as a per-frame factor at 60fps.
  // Scale to dt for framerate independence: drag = (1 - AIR_RESISTANCE)^(dt*60)
  // Horizontal drag is full strength (frontal resistance in flight posture).
  // Vertical drag is reduced (VERT_DRAG_RATIO) for taller, more dramatic arcs.
  const hDrag = Math.pow(1 - AIR_RESISTANCE, dt * 60)
  const vDrag = Math.pow(1 - AIR_RESISTANCE * VERT_DRAG_RATIO, dt * 60)
  state.vx *= hDrag
  state.vy *= vDrag

  // --- Update position ---
  state.x += state.vx * dt
  state.y += state.vy * dt

  // --- Track flight time ---
  state.flightTime += dt

  // --- Check landing: has the jumper reached the hill surface? ---
  const hillY = getHillY(state.x)

  if (state.y >= hillY && state.x > startPos.x) {
    // Snap to hill surface
    state.y = hillY
    state.landed = true

    // Calculate distance in metres
    const dx = state.x - startPos.x
    state.distance = clamp(dx / PIXELS_PER_METRE, 0, MAX_DISTANCE)
  }

  // --- Safety: clamp to game bounds ---
  if (state.x > GAME_W + 20 || state.y > GAME_H + 20) {
    state.landed = true
    const dx = clamp(state.x - startPos.x, 0, GAME_W)
    state.distance = clamp(dx / PIXELS_PER_METRE, 0, MAX_DISTANCE)
  }

  return state
}

/**
 * Create an initial flight state from launch velocity and start position.
 */
export function createFlightState(launchVel, startPos) {
  return {
    x: startPos.x,
    y: startPos.y,
    vx: launchVel.vx,
    vy: launchVel.vy,
    landed: false,
    distance: 0,
    flightTime: 0,
  }
}

// ---------------------------------------------------------------------------
// 4. calculateFlightPath(launchVel, startPos)
// ---------------------------------------------------------------------------
/**
 * Pre-calculate the entire flight path from launch to landing.
 * Useful for prediction lines or knowing total flight time / landing point.
 *
 * Returns Array<{ x, y, t }> — positions sampled at 60fps.
 */
export function calculateFlightPath(launchVel, startPos) {
  const path = []
  const dt = 1 / 60
  const maxTime = 10 // safety cap: 10 seconds max

  const state = createFlightState(launchVel, startPos)

  while (!state.landed && state.flightTime < maxTime) {
    path.push({ x: state.x, y: state.y, t: state.flightTime })
    simulateFlight(state, startPos, dt)
  }

  // Add the landing point
  path.push({ x: state.x, y: state.y, t: state.flightTime })

  return path
}

// ---------------------------------------------------------------------------
// 5. getHillY(x)
// ---------------------------------------------------------------------------
/**
 * Given an x coordinate, return the y coordinate of the landing hill surface.
 * hillY = RAMP_LIP.y + (x - RAMP_LIP.x) * LANDING_HILL_SLOPE
 * Clamped to game bounds.
 */
export function getHillY(x) {
  if (x < RAMP_LIP.x) return RAMP_LIP.y
  const hillY = RAMP_LIP.y + (x - RAMP_LIP.x) * LANDING_HILL_SLOPE
  return clamp(hillY, 0, GAME_H)
}

// ---------------------------------------------------------------------------
// 6. calculateScore(distanceMetres, landingMultiplier)
// ---------------------------------------------------------------------------
/**
 * Calculate final score from distance and landing quality.
 *
 * distanceMetres: raw flight distance in metres.
 * landingMultiplier: from LANDING_MULT (telemark/clean/shaky/crash).
 *
 * Returns { finalDistance, raw, multiplier }.
 */
export function calculateScore(distanceMetres, landingMultiplier) {
  const raw = Math.round(distanceMetres * 10) / 10
  const multiplier = landingMultiplier
  const finalDistance = Math.round(raw * multiplier * 10) / 10

  return { finalDistance, raw, multiplier }
}
