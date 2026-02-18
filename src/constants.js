// =============================================================================
// AI Ski Jump Championship — Game Constants & Brand Config
// Single source of truth for ALL game constants.
// =============================================================================

// ---------------------------------------------------------------------------
// BRAND colours (shared across all BrandedAI games)
// ---------------------------------------------------------------------------
export const BRAND = {
  blue: "#2563EB",
  blueDark: "#1D4ED8",
  blueLight: "#60A5FA",
  purple: "#7C3AED",
  purpleLight: "#A78BFA",
  green: "#10B981",
  orange: "#F59E0B",
  dark: "#111827",
  darkMid: "#1F2937",
  gray: "#6B7280",
  grayLight: "#9CA3AF",
  light: "#F9FAFB",
  white: "#FFFFFF",
  red: "#EF4444",
}

// ---------------------------------------------------------------------------
// Game dimensions (portrait-first, scaled to fit viewport)
// ---------------------------------------------------------------------------
export const GAME_W = 400
export const GAME_H = 700

// ---------------------------------------------------------------------------
// Ramp geometry
// The ramp goes from top-left down to the lip near center.
// ---------------------------------------------------------------------------
export const RAMP_ANGLE = 38 // degrees from horizontal
export const RAMP_TOP = { x: 60, y: 120 } // top of ramp (where jumper starts)
export const RAMP_LIP = { x: 175, y: 380 } // lip of ramp (launch point)

// ---------------------------------------------------------------------------
// Landing hill
// Hill equation: y(x) = RAMP_LIP.y + (x - RAMP_LIP.x) * LANDING_HILL_SLOPE
// ---------------------------------------------------------------------------
export const LANDING_HILL_START = { x: 175, y: 380 } // same as lip
export const LANDING_HILL_SLOPE = 0.38 // rise/run — hill slopes downward to the right

// ---------------------------------------------------------------------------
// Physics
// ---------------------------------------------------------------------------
export const GRAVITY = 9.81
export const AIR_RESISTANCE = 0.015
export const RAMP_HEIGHT = 260 // vertical drop of ramp in game units (RAMP_TOP.y to RAMP_LIP.y)
export const MAX_DISTANCE = 170 // theoretical max in metres

// ---------------------------------------------------------------------------
// Timing windows (milliseconds from optimal moment)
// ---------------------------------------------------------------------------
export const TIMING = {
  perfect: 50, // +/-50ms
  good: 150, // +/-150ms
  ok: 300, // +/-300ms
}

// ---------------------------------------------------------------------------
// Launch angle results based on timing quality (degrees)
// ---------------------------------------------------------------------------
export const LAUNCH_ANGLES = {
  perfect: 38, // optimal launch
  good_min: 30,
  good_max: 42,
  ok_min: 22,
  ok_max: 48,
  miss_min: 12,
  miss_max: 55,
}

// ---------------------------------------------------------------------------
// Speed multipliers based on timing quality
// ---------------------------------------------------------------------------
export const SPEED_MULT = {
  perfect: 1.15,
  good: 1.0,
  ok: 0.85,
  miss: 0.7,
}

// ---------------------------------------------------------------------------
// Landing style multipliers
// ---------------------------------------------------------------------------
export const LANDING_MULT = {
  telemark: 1.5, // perfect landing
  clean: 1.2, // good landing
  shaky: 1.0, // ok landing
  crash: 0.7, // missed/late
}

// ---------------------------------------------------------------------------
// Rounds
// ---------------------------------------------------------------------------
export const ROUNDS_PER_GAME = 5
export const BEST_N = 3 // best N rounds count toward total

// ---------------------------------------------------------------------------
// Themed jumpers (one per round)
// ---------------------------------------------------------------------------
export const JUMPERS = [
  { id: 1, name: "Data Pipeline", emoji: "🔄", color: BRAND.blue },
  { id: 2, name: "Neural Network", emoji: "🧠", color: BRAND.purple },
  { id: 3, name: "Cloud Deploy", emoji: "☁️", color: BRAND.green },
  { id: 4, name: "API Gateway", emoji: "🔗", color: BRAND.orange },
  { id: 5, name: "Auto Scaler", emoji: "📈", color: BRAND.blueLight },
]

// ---------------------------------------------------------------------------
// Grade tiers (based on total score = sum of best 3 distances)
// Ordered highest-first so the first match wins.
// ---------------------------------------------------------------------------
export const GRADE_TIERS = [
  { min: 420, label: "Olympic Champion", emoji: "🥇" },
  { min: 350, label: "World Class", emoji: "🏆" },
  { min: 280, label: "Pro Jumper", emoji: "🎿" },
  { min: 200, label: "Ski Enthusiast", emoji: "⛷️" },
  { min: 100, label: "Snow Bunny", emoji: "🐰" },
  { min: 0, label: "Après-Ski Only", emoji: "🍺" },
]

// ---------------------------------------------------------------------------
// Distance messages (shown after each round)
// ---------------------------------------------------------------------------
export const DISTANCE_MESSAGES = {
  legendary: [
    // 150m+
    "LEGENDARY flight!",
    "Record-breaking deployment!",
    "That's enterprise-grade distance!",
  ],
  great: [
    // 120-149m
    "Massive jump!",
    "Your AI soared!",
    "Production-ready distance!",
  ],
  good: [
    // 90-119m
    "Solid flight!",
    "Good momentum!",
    "Scaling nicely!",
  ],
  ok: [
    // 60-89m
    "Decent effort!",
    "Room to optimise!",
    "MVP distance!",
  ],
  poor: [
    // <60m
    "Needs more training data!",
    "Back to the drawing board!",
    "Have you tried turning it off and on?",
  ],
}

// ---------------------------------------------------------------------------
// Get a random message for a given distance
// ---------------------------------------------------------------------------
export function getDistanceMessage(distance) {
  let tier
  if (distance >= 150) tier = "legendary"
  else if (distance >= 120) tier = "great"
  else if (distance >= 90) tier = "good"
  else if (distance >= 60) tier = "ok"
  else tier = "poor"
  const msgs = DISTANCE_MESSAGES[tier]
  return msgs[Math.floor(Math.random() * msgs.length)]
}

// ---------------------------------------------------------------------------
// Get grade tier for a total score (sum of best 3 distances)
// ---------------------------------------------------------------------------
export function getGrade(totalScore) {
  for (const tier of GRADE_TIERS) {
    if (totalScore >= tier.min) return tier
  }
  return GRADE_TIERS[GRADE_TIERS.length - 1]
}

// ---------------------------------------------------------------------------
// Wind range per round
// Negative = headwind, positive = tailwind
// ---------------------------------------------------------------------------
export const WIND_RANGE = { min: -2.0, max: 2.0 } // m/s

// ---------------------------------------------------------------------------
// Animation timing (milliseconds)
// ---------------------------------------------------------------------------
export const APPROACH_DURATION = 1500 // jumper slides down ramp
export const ROUND_INTRO_DURATION = 1500 // "Round 3/5" display
export const SCORE_DISPLAY_DURATION = 2000 // show score after landing
export const AUTO_LAUNCH_DELAY = 500 // auto-launch if player doesn't tap
