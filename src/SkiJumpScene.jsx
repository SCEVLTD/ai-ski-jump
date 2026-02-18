// =============================================================================
// AI Ski Jump Championship — Ski Jump Scene (T2)
// Pure SVG rendering of the ski jump venue at night.
// Static visuals only — animations handled by game layer via {children}.
// =============================================================================

import { GAME_W, GAME_H, RAMP_TOP, RAMP_LIP, LANDING_HILL_SLOPE, BRAND } from './constants'

// ---------------------------------------------------------------------------
// Derived geometry
// ---------------------------------------------------------------------------

// Hill surface: from the lip downward-right to the edge of the scene
const HILL_END_X = GAME_W - 10
const HILL_END_Y = RAMP_LIP.y + (HILL_END_X - RAMP_LIP.x) * LANDING_HILL_SLOPE

// Outrun flat area — begins where the hill meets the bottom region
const OUTRUN_Y = Math.min(HILL_END_Y, GAME_H - 60)

// Distance markers along the hill (in metres)
const DISTANCE_MARKERS = [40, 60, 80, 100, 120, 140, 160]
const K_POINT_DISTANCE = 120

// Pixels-per-metre along the hill (approximate mapping)
// The hill run from lip to HILL_END_X spans roughly 170m max
const HILL_RUN_PX = HILL_END_X - RAMP_LIP.x // ~215px
const PX_PER_METRE = HILL_RUN_PX / 170

// ---------------------------------------------------------------------------
// Stars (pre-computed for consistency)
// ---------------------------------------------------------------------------
function makeStars(count, seed) {
  const stars = []
  let s = seed
  for (let i = 0; i < count; i++) {
    s = (s * 16807 + 7) % 2147483647
    const x = (s % GAME_W)
    s = (s * 16807 + 7) % 2147483647
    const y = (s % 200) // upper portion only
    s = (s * 16807 + 7) % 2147483647
    const r = 0.4 + (s % 100) / 100 * 0.8
    s = (s * 16807 + 7) % 2147483647
    const opacity = 0.3 + (s % 100) / 100 * 0.7
    stars.push({ x, y, r, opacity })
  }
  return stars
}
const STARS = makeStars(28, 42)

// ---------------------------------------------------------------------------
// Snow specks (static dots on ground surfaces)
// ---------------------------------------------------------------------------
function makeSnowSpecks(count, seed) {
  const specks = []
  let s = seed
  for (let i = 0; i < count; i++) {
    s = (s * 16807 + 13) % 2147483647
    const x = (s % GAME_W)
    s = (s * 16807 + 13) % 2147483647
    const y = OUTRUN_Y + (s % (GAME_H - OUTRUN_Y))
    s = (s * 16807 + 13) % 2147483647
    const r = 0.5 + (s % 100) / 100 * 1.0
    s = (s * 16807 + 13) % 2147483647
    const opacity = 0.15 + (s % 100) / 100 * 0.3
    specks.push({ x, y, r, opacity })
  }
  return specks
}
const SNOW_SPECKS = makeSnowSpecks(40, 99)

// ---------------------------------------------------------------------------
// Trees (simple triangles along the sides)
// ---------------------------------------------------------------------------
const TREES = [
  // Left side behind ramp
  { x: 15, y: 240, h: 28, w: 12 },
  { x: 5, y: 280, h: 35, w: 14 },
  { x: 22, y: 310, h: 24, w: 10 },
  { x: 8, y: 350, h: 30, w: 12 },
  { x: 18, y: 390, h: 26, w: 11 },
  { x: 10, y: 430, h: 32, w: 13 },
  { x: 25, y: 460, h: 22, w: 10 },
  // Right side
  { x: 380, y: 300, h: 30, w: 12 },
  { x: 390, y: 340, h: 26, w: 11 },
  { x: 375, y: 380, h: 34, w: 14 },
  { x: 388, y: 420, h: 24, w: 10 },
]

// ---------------------------------------------------------------------------
// Spectator dots (crowd near outrun)
// ---------------------------------------------------------------------------
function makeSpectators(count, seed) {
  const people = []
  let s = seed
  const colours = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#14B8A6']
  for (let i = 0; i < count; i++) {
    s = (s * 16807 + 31) % 2147483647
    const x = 120 + (s % 200)
    s = (s * 16807 + 31) % 2147483647
    const y = GAME_H - 28 + (s % 18)
    s = (s * 16807 + 31) % 2147483647
    const colour = colours[s % colours.length]
    s = (s * 16807 + 31) % 2147483647
    const r = 1.5 + (s % 100) / 100 * 1.2
    people.push({ x, y, colour, r })
  }
  return people
}
const SPECTATORS = makeSpectators(35, 77)

// ---------------------------------------------------------------------------
// Helper: position along the hill at a given metre distance
// ---------------------------------------------------------------------------
function hillPosAtDistance(metres) {
  const dx = metres * PX_PER_METRE
  const x = RAMP_LIP.x + dx
  const y = RAMP_LIP.y + dx * LANDING_HILL_SLOPE
  return { x, y }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function SkiJumpScene({ children }) {
  return (
    <div style={{
      position: 'relative',
      width: GAME_W,
      height: GAME_H,
      overflow: 'hidden',
      borderRadius: 8,
      boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
    }}>
      <svg
        viewBox={`0 0 ${GAME_W} ${GAME_H}`}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ============================================================= */}
        {/* DEFS: gradients, filters                                      */}
        {/* ============================================================= */}
        <defs>
          {/* Sky gradient */}
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0B1628" />
            <stop offset="45%" stopColor="#1E3A5F" />
            <stop offset="100%" stopColor="#111827" />
          </linearGradient>

          {/* Landing hill snow gradient */}
          <linearGradient id="hillSnowGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E8EDF2" />
            <stop offset="40%" stopColor="#D1D9E6" />
            <stop offset="100%" stopColor="#B8C4D4" />
          </linearGradient>

          {/* Ramp surface gradient */}
          <linearGradient id="rampSurfaceGrad" x1="0" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>

          {/* Ramp side (darker for 3D depth) */}
          <linearGradient id="rampSideGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          {/* Floodlight glow */}
          <radialGradient id="floodGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#FCD34D" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FCD34D" stopOpacity="0" />
          </radialGradient>

          {/* Outrun flat gradient */}
          <linearGradient id="outrunGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>

          {/* Mountain silhouette fill */}
          <linearGradient id="mountainGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
        </defs>

        {/* ============================================================= */}
        {/* SKY                                                           */}
        {/* ============================================================= */}
        <rect x="0" y="0" width={GAME_W} height={GAME_H} fill="url(#skyGrad)" />

        {/* ============================================================= */}
        {/* STARS                                                         */}
        {/* ============================================================= */}
        {STARS.map((s, i) => (
          <circle key={`star-${i}`} cx={s.x} cy={s.y} r={s.r} fill={BRAND.white} opacity={s.opacity} />
        ))}

        {/* ============================================================= */}
        {/* MOUNTAIN SILHOUETTES (background)                             */}
        {/* ============================================================= */}
        {/* Far mountain range */}
        <path
          d="M0,260 L30,200 L70,230 L110,180 L150,210 L190,170 L230,200 L270,160 L310,195 L350,175 L390,210 L400,200 L400,300 L0,300 Z"
          fill="#0F172A"
          opacity="0.6"
        />
        {/* Closer mountain range */}
        <path
          d="M0,300 L40,250 L80,275 L120,240 L160,270 L200,230 L240,260 L280,235 L320,265 L360,245 L400,270 L400,340 L0,340 Z"
          fill="#1E293B"
          opacity="0.5"
        />

        {/* ============================================================= */}
        {/* TREES                                                         */}
        {/* ============================================================= */}
        {TREES.map((t, i) => (
          <g key={`tree-${i}`}>
            {/* Trunk */}
            <rect x={t.x - 1.5} y={t.y} width={3} height={t.h * 0.3} fill="#4A3728" />
            {/* Canopy — two stacked triangles */}
            <polygon
              points={`${t.x},${t.y - t.h} ${t.x - t.w / 2},${t.y - t.h * 0.25} ${t.x + t.w / 2},${t.y - t.h * 0.25}`}
              fill="#1B4332"
              opacity="0.8"
            />
            <polygon
              points={`${t.x},${t.y - t.h * 0.7} ${t.x - t.w * 0.65 / 2},${t.y} ${t.x + t.w * 0.65 / 2},${t.y}`}
              fill="#1B4332"
              opacity="0.7"
            />
          </g>
        ))}

        {/* ============================================================= */}
        {/* RAMP — 3D-ish with side face and surface                      */}
        {/* ============================================================= */}
        {(() => {
          // Ramp surface: a curved path from RAMP_TOP to RAMP_LIP
          // with a slight concave inrun curve at top and a lip curve at bottom
          const topX = RAMP_TOP.x
          const topY = RAMP_TOP.y
          const lipX = RAMP_LIP.x
          const lipY = RAMP_LIP.y
          const rampWidth = 22 // visual width of the ramp track

          // Control points for the ramp bezier (slight curve)
          const cp1x = topX + 20
          const cp1y = topY + 80
          const cp2x = lipX - 40
          const cp2y = lipY - 60

          // Lip curve: small upward kick at the end
          const lipKickX = lipX + 8
          const lipKickY = lipY - 6

          // Surface path (top edge of ramp)
          const surfacePath = `M ${topX},${topY} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${lipX},${lipY} L ${lipKickX},${lipKickY}`

          // Side face (darker, gives 3D depth)
          const sidePath = `M ${topX + rampWidth},${topY + 4} C ${cp1x + rampWidth},${cp1y + 4} ${cp2x + rampWidth},${cp2y + 4} ${lipX + rampWidth},${lipY + 2} L ${lipX + rampWidth},${lipY + 18} L ${topX + rampWidth},${topY + 22} Z`

          // Top surface fill
          const topSurface = `M ${topX},${topY} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${lipX},${lipY} L ${lipX + rampWidth},${lipY + 2} L ${topX + rampWidth},${topY + 4} Z`

          // Support structure underneath (triangular supports)
          const supportBase1Y = topY + 60
          const supportBase2Y = topY + 130

          return (
            <g>
              {/* Ramp tower / support structure */}
              <rect x={topX + 4} y={topY} width={4} height={200} fill="#1E293B" opacity="0.8" />
              <rect x={topX + rampWidth - 2} y={topY + 4} width={4} height={200} fill="#0F172A" opacity="0.8" />
              {/* Cross beams */}
              <line x1={topX + 4} y1={supportBase1Y} x2={topX + rampWidth + 2} y2={supportBase1Y + 4} stroke="#1E293B" strokeWidth="2" opacity="0.6" />
              <line x1={topX + 4} y1={supportBase2Y} x2={topX + rampWidth + 2} y2={supportBase2Y + 4} stroke="#1E293B" strokeWidth="2" opacity="0.6" />
              {/* Diagonal support */}
              <line x1={topX + 6} y1={topY + 180} x2={topX + 6} y2={lipY + 40} stroke="#1E293B" strokeWidth="3" opacity="0.5" />
              <line x1={topX + rampWidth} y1={topY + 180} x2={lipX + rampWidth} y2={lipY + 20} stroke="#0F172A" strokeWidth="2" opacity="0.5" />

              {/* Side face (3D depth) */}
              <path d={sidePath} fill="url(#rampSideGrad)" />

              {/* Top surface */}
              <path d={topSurface} fill="url(#rampSurfaceGrad)" />

              {/* Ramp surface edge line (white track line) */}
              <path d={surfacePath} fill="none" stroke="#CBD5E1" strokeWidth="1.5" opacity="0.9" />

              {/* Track guide lines (thinner lines showing the track) */}
              <path
                d={`M ${topX + 7},${topY + 2} C ${cp1x + 7},${cp1y + 2} ${cp2x + 7},${cp2y + 2} ${lipX + 7},${lipY + 1}`}
                fill="none"
                stroke="#94A3B8"
                strokeWidth="0.5"
                strokeDasharray="4,4"
                opacity="0.5"
              />
              <path
                d={`M ${topX + 15},${topY + 3} C ${cp1x + 15},${cp1y + 3} ${cp2x + 15},${cp2y + 3} ${lipX + 15},${lipY + 1.5}`}
                fill="none"
                stroke="#94A3B8"
                strokeWidth="0.5"
                strokeDasharray="4,4"
                opacity="0.5"
              />

              {/* Lip / takeoff table */}
              <path
                d={`M ${lipX - 2},${lipY + 2} Q ${lipX + 4},${lipY - 3} ${lipKickX + 2},${lipKickY - 2} L ${lipKickX + rampWidth + 2},${lipKickY} Q ${lipX + rampWidth + 4},${lipY - 1} ${lipX + rampWidth - 2},${lipY + 4} Z`}
                fill="#475569"
                stroke="#E2E8F0"
                strokeWidth="1"
              />
              {/* Lip highlight (bright edge to make it visually distinct) */}
              <path
                d={`M ${lipX},${lipY} Q ${lipX + 5},${lipY - 5} ${lipKickX + 2},${lipKickY - 2}`}
                fill="none"
                stroke={BRAND.white}
                strokeWidth="2"
                opacity="0.95"
              />
            </g>
          )
        })()}

        {/* ============================================================= */}
        {/* LANDING HILL                                                  */}
        {/* ============================================================= */}
        {(() => {
          // Hill polygon: from lip, sloping down, then wrapping around
          // the bottom-right corner and back
          const lipX = RAMP_LIP.x
          const lipY = RAMP_LIP.y
          const endX = HILL_END_X
          const endY = RAMP_LIP.y + (endX - lipX) * LANDING_HILL_SLOPE

          // Slight curve at the transition to outrun
          const outrunTransX = endX - 30
          const outrunTransY = RAMP_LIP.y + (outrunTransX - lipX) * LANDING_HILL_SLOPE

          // Hill surface path with slight curve at start (transition from lip)
          // and gentle curve into the outrun at the bottom
          const hillPath = `
            M ${lipX},${lipY}
            Q ${lipX + 20},${lipY + 8} ${lipX + 40},${lipY + 40 * LANDING_HILL_SLOPE}
            L ${outrunTransX},${outrunTransY}
            Q ${endX - 10},${endY + 5} ${endX},${Math.min(endY + 15, GAME_H - 55)}
            L ${endX},${GAME_H}
            L ${lipX - 20},${GAME_H}
            L ${lipX - 20},${lipY + 30}
            Z
          `

          return (
            <g>
              {/* Hill body */}
              <path d={hillPath} fill="url(#hillSnowGrad)" />

              {/* Hill surface line (the actual slope the jumper lands on) */}
              <line
                x1={lipX}
                y1={lipY}
                x2={endX - 20}
                y2={RAMP_LIP.y + (endX - 20 - lipX) * LANDING_HILL_SLOPE}
                stroke="#F1F5F9"
                strokeWidth="2"
                opacity="0.8"
              />

              {/* Secondary surface texture lines */}
              <line
                x1={lipX + 5}
                y1={lipY + 10}
                x2={endX - 30}
                y2={RAMP_LIP.y + (endX - 30 - lipX) * LANDING_HILL_SLOPE + 10}
                stroke="#E2E8F0"
                strokeWidth="0.5"
                opacity="0.4"
              />
              <line
                x1={lipX + 5}
                y1={lipY + 20}
                x2={endX - 40}
                y2={RAMP_LIP.y + (endX - 40 - lipX) * LANDING_HILL_SLOPE + 20}
                stroke="#E2E8F0"
                strokeWidth="0.5"
                opacity="0.3"
              />
            </g>
          )
        })()}

        {/* ============================================================= */}
        {/* DISTANCE MARKERS along the hill                               */}
        {/* ============================================================= */}
        {DISTANCE_MARKERS.map((m) => {
          const pos = hillPosAtDistance(m)
          if (pos.x > GAME_W - 20 || pos.y > GAME_H - 30) return null
          const isKPoint = m === K_POINT_DISTANCE

          // Tick direction: perpendicular to slope
          // Slope angle = atan(LANDING_HILL_SLOPE)
          const slopeAngle = Math.atan(LANDING_HILL_SLOPE)
          const perpAngle = slopeAngle - Math.PI / 2
          const tickLen = isKPoint ? 14 : 8
          const tx = Math.cos(perpAngle) * tickLen
          const ty = Math.sin(perpAngle) * tickLen

          return (
            <g key={`marker-${m}`}>
              {/* Tick mark */}
              <line
                x1={pos.x}
                y1={pos.y}
                x2={pos.x + tx}
                y2={pos.y + ty}
                stroke={isKPoint ? '#EF4444' : '#64748B'}
                strokeWidth={isKPoint ? 2 : 1}
                opacity={isKPoint ? 1 : 0.7}
              />
              {/* K-point: additional horizontal line */}
              {isKPoint && (
                <line
                  x1={pos.x - 6}
                  y1={pos.y}
                  x2={pos.x + 6}
                  y2={pos.y}
                  stroke="#EF4444"
                  strokeWidth="2"
                  opacity="0.8"
                />
              )}
              {/* Label */}
              <text
                x={pos.x + tx + (tx > 0 ? 2 : -2)}
                y={pos.y + ty - 2}
                fill={isKPoint ? '#EF4444' : '#94A3B8'}
                fontSize={isKPoint ? 8 : 6}
                fontFamily="'Open Sans', sans-serif"
                fontWeight={isKPoint ? 700 : 400}
                textAnchor="middle"
                opacity={isKPoint ? 1 : 0.7}
              >
                {isKPoint ? `K${m}m` : `${m}m`}
              </text>
            </g>
          )
        })}

        {/* ============================================================= */}
        {/* OUTRUN (flat area at bottom)                                  */}
        {/* ============================================================= */}
        <rect
          x={0}
          y={GAME_H - 55}
          width={GAME_W}
          height={55}
          fill="url(#outrunGrad)"
          opacity="0.6"
        />
        {/* Outrun edge line */}
        <line
          x1={0}
          y1={GAME_H - 55}
          x2={GAME_W}
          y2={GAME_H - 55}
          stroke="#CBD5E1"
          strokeWidth="0.5"
          opacity="0.3"
        />

        {/* ============================================================= */}
        {/* SNOW SPECKS on ground                                         */}
        {/* ============================================================= */}
        {SNOW_SPECKS.map((s, i) => (
          <circle
            key={`snow-${i}`}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill={BRAND.white}
            opacity={s.opacity}
          />
        ))}

        {/* ============================================================= */}
        {/* JUDGES' TOWER                                                 */}
        {/* ============================================================= */}
        {(() => {
          const towerX = 280
          const towerBaseY = GAME_H - 55
          const towerH = 45
          const towerW = 18

          return (
            <g>
              {/* Tower legs */}
              <line x1={towerX + 3} y1={towerBaseY} x2={towerX + 5} y2={towerBaseY - towerH + 10} stroke="#374151" strokeWidth="2" />
              <line x1={towerX + towerW - 3} y1={towerBaseY} x2={towerX + towerW - 5} y2={towerBaseY - towerH + 10} stroke="#374151" strokeWidth="2" />
              {/* Tower cabin */}
              <rect
                x={towerX}
                y={towerBaseY - towerH}
                width={towerW}
                height={14}
                rx={1}
                fill="#1F2937"
                stroke="#475569"
                strokeWidth="1"
              />
              {/* Windows */}
              <rect x={towerX + 2} y={towerBaseY - towerH + 2} width={4} height={4} rx={0.5} fill="#FCD34D" opacity="0.8" />
              <rect x={towerX + 8} y={towerBaseY - towerH + 2} width={4} height={4} rx={0.5} fill="#FCD34D" opacity="0.7" />
              <rect x={towerX + 14} y={towerBaseY - towerH + 2} width={3} height={4} rx={0.5} fill="#FCD34D" opacity="0.6" />
              {/* Roof */}
              <rect
                x={towerX - 2}
                y={towerBaseY - towerH - 3}
                width={towerW + 4}
                height={4}
                rx={1}
                fill="#374151"
              />
              {/* "JUDGES" label */}
              <text
                x={towerX + towerW / 2}
                y={towerBaseY - towerH + 12}
                fill="#94A3B8"
                fontSize="4"
                fontFamily="'Open Sans', sans-serif"
                textAnchor="middle"
              >
                JUDGES
              </text>
            </g>
          )
        })()}

        {/* ============================================================= */}
        {/* FLOODLIGHTS (2 tall poles with bright circles — night event)   */}
        {/* ============================================================= */}
        {[
          { x: 130, baseY: GAME_H - 55, h: 160 },
          { x: 330, baseY: GAME_H - 55, h: 140 },
        ].map((light, i) => (
          <g key={`flood-${i}`}>
            {/* Pole */}
            <rect
              x={light.x - 1.5}
              y={light.baseY - light.h}
              width={3}
              height={light.h}
              fill="#4B5563"
            />
            {/* Light housing */}
            <rect
              x={light.x - 6}
              y={light.baseY - light.h - 4}
              width={12}
              height={5}
              rx={1}
              fill="#6B7280"
            />
            {/* Light glow */}
            <circle
              cx={light.x}
              cy={light.baseY - light.h - 1}
              r={16}
              fill="url(#floodGlow)"
              opacity="0.5"
            />
            {/* Bright centre */}
            <circle
              cx={light.x}
              cy={light.baseY - light.h - 1}
              r={3}
              fill="#FDE68A"
              opacity="0.95"
            />
            {/* Light beam cone (subtle) */}
            <polygon
              points={`${light.x - 4},${light.baseY - light.h + 2} ${light.x + 4},${light.baseY - light.h + 2} ${light.x + 40},${light.baseY - 10} ${light.x - 30},${light.baseY - 10}`}
              fill="#FDE68A"
              opacity="0.03"
            />
          </g>
        ))}

        {/* ============================================================= */}
        {/* SPECTATORS (crowd dots near outrun)                           */}
        {/* ============================================================= */}
        {SPECTATORS.map((p, i) => (
          <circle
            key={`spec-${i}`}
            cx={p.x}
            cy={p.y}
            r={p.r}
            fill={p.colour}
            opacity="0.7"
          />
        ))}

        {/* ============================================================= */}
        {/* CROWD BARRIER line                                            */}
        {/* ============================================================= */}
        <line
          x1={100}
          y1={GAME_H - 30}
          x2={340}
          y2={GAME_H - 30}
          stroke="#475569"
          strokeWidth="1"
          opacity="0.5"
        />

        {/* ============================================================= */}
        {/* RAMP TOP PLATFORM (starting gate area)                        */}
        {/* ============================================================= */}
        <rect
          x={RAMP_TOP.x - 8}
          y={RAMP_TOP.y - 8}
          width={40}
          height={10}
          rx={2}
          fill="#475569"
          stroke="#64748B"
          strokeWidth="0.5"
        />
        {/* Starting bar */}
        <rect
          x={RAMP_TOP.x - 10}
          y={RAMP_TOP.y - 14}
          width={3}
          height={16}
          fill="#64748B"
        />
        <rect
          x={RAMP_TOP.x + 30}
          y={RAMP_TOP.y - 12}
          width={3}
          height={14}
          fill="#64748B"
        />
        <line
          x1={RAMP_TOP.x - 10}
          y1={RAMP_TOP.y - 14}
          x2={RAMP_TOP.x + 33}
          y2={RAMP_TOP.y - 12}
          stroke="#64748B"
          strokeWidth="1.5"
        />
      </svg>

      {/* Children (game layer: jumper, particles, UI overlays) */}
      {children}
    </div>
  )
}
