# AI Ski Jump Championship - Tasks

> **Goal**: Addictive, mobile-first ski jump game with 5-8 second rounds, "beat my score" challenge links, and weekly leaderboard. Drives discovery calls for BrandedAI.
> **Target URL**: https://skijump.brandedai.net/
> **Deploy**: Vercel (same pattern as curling game)
> **Reference**: `c:\BrandedAI\3_PRODUCTS\Curling\ai-curling\` (proven template)
> **Stack**: React 18, Vite, pure DOM rendering (no canvas), Web Audio API, Vercel Analytics
> **Last updated**: 2026-02-18
> **Build status**: COMPILES — 205KB bundle (63KB gzip), builds in 481ms

---

## Status Summary

| Wave | Tasks | Status |
|------|-------|--------|
| Wave 1 — Foundation | T1, T2, T3 | DONE |
| Wave 2 — Core Mechanic | T4, T5, T6 | DONE |
| Wave 3 — Game Loop | T7, T8 | DONE (integrated as T7+T8) |
| Wave 4 — Screens/UX | T9, T10, T11, T12 | DONE |
| Wave 5 — Polish | T13, T14, T15, T16 | T13/T14/T16 DONE (integrated in T7+T8). T15 OPEN |
| Wave 6 — Viral | T17, T18, T19 | DONE (integrated in T7+T8) |
| Wave 7 — Deploy | T20, T21, T22 | OPEN |
| Wave 8 — Post-Launch | T23, T24 | OPEN |

**18/24 tasks COMPLETE. Game compiles and runs. Remaining: T15 (particles), T20-T24.**

---

## Architecture Notes

### Game Concept
- **Side-view ski jump**: Ramp on left, landing hill slopes away to right
- **Two-tap mechanic**: Tap 1 = launch timing at lip, Tap 2 = landing timing
- **Score = distance in metres** (e.g. "147m") — universally shareable
- **5 rounds per game**, best 3 count toward final score
- **Branded jumpers**: Each round uses a different AI-themed jumper (like curling's automation stones)

### Core Physics
- Jumper slides down ramp (accelerates via gravity on slope angle)
- At lip: timing determines launch angle + speed (perfect timing = optimal 45-degree arc)
- Flight: parabolic arc with wind factor (slight random crosswind per round)
- Landing: timing determines style points multiplier (1.0x-1.5x on distance)
- No collision detection needed — just parametric arc calculation

### Visual Layout (Portrait-First)
```
┌─────────────────────────┐
│  HUD: Round 3/5 | Best  │
│                         │
│    ╱                    │
│   ╱  ← ramp            │
│  ╱                      │
│ ╱                       │
│╱·  ·  ·  ← flight arc  │
│ ╲  ·                    │
│  ╲    ← landing hill    │
│   ╲                     │
│    ╲______ distance ──→ │
│                         │
│  [TAP TO JUMP]          │
└─────────────────────────┘
```

### BRAND Constants (Shared with Curling)
```javascript
const BRAND = {
  blue: "#2563EB", blueDark: "#1D4ED8", blueLight: "#60A5FA",
  purple: "#7C3AED", purpleLight: "#A78BFA",
  green: "#10B981", orange: "#F59E0B",
  dark: "#111827", darkMid: "#1F2937",
  gray: "#6B7280", grayLight: "#9CA3AF",
  light: "#F9FAFB", white: "#FFFFFF", red: "#EF4444",
}
```

---

## Dependency Graph

```
Wave 1 (Foundation) — all independent, fully parallel:
  T1: Game constants & BRAND config
  T2: Ramp + hill rendering (side-view SVG/DOM)
  T3: Sound system (Web Audio API)

Wave 2 (Core Mechanic) — depends on Wave 1:
  T4: Jumper physics + flight arc (depends: T1, T2)
  T5: Launch timing mechanic (depends: T1, T2)
  T6: Landing timing mechanic (depends: T4)

Wave 3 (Game Loop) — depends on Wave 2:
  T7: Round system — 5 rounds, scoring, round transitions (depends: T4, T5, T6)
  T8: HUD — round counter, distance display, best score (depends: T7)

Wave 4 (Screens & UX) — partially parallel with Wave 3:
  T9:  Title screen (depends: T1) ← can start in Wave 1
  T10: Results screen with grade tiers (depends: T7)
  T11: Tutorial overlay for first play (depends: T5, T6)
  T12: Responsive scaling for all devices (depends: T2)

Wave 5 (Polish) — depends on Wave 3-4:
  T13: Sound integration — whoosh, wind, landing crunch, crowd (depends: T3, T7)
  T14: Haptic feedback on mobile (depends: T5, T6)
  T15: Particle effects — snow burst on landing, wind streaks (depends: T4)
  T16: Keyboard controls — spacebar for both taps (depends: T5, T6)

Wave 6 (Viral Mechanics) — depends on Wave 4:
  T17: Share card — visual result with distance + grade (depends: T10)
  T18: Challenge link system — URL params, landing page (depends: T10)
  T19: localStorage — high score, streak counter, tutorial seen (depends: T7, T10)

Wave 7 (Deploy & Marketing) — depends on everything:
  T20: Vercel deployment + custom domain (depends: all above)
  T21: OG image — 1200x630 with Winter Olympics 2026 branding (depends: T20)
  T22: LinkedIn post — carousel + copy (depends: T20, T21)

Wave 8 (Post-Launch) — after deploy:
  T23: Weekly leaderboard (localStorage MVP, optional backend later)
  T24: Cross-promo with curling game (link between games)
```

---

## Wave 1 — Foundation (All Parallel)

### T1: Game Constants & Brand Config
- **Status**: OPEN
- **Priority**: P0
- **Depends**: None
- **Parallel**: Yes — independent of T2, T3
- **Agent**: Can be completed by any agent
- **Spec**:
  - Define all game constants at top of `AISkiJumpGame.jsx`:
    - `GAME_W` (400), `GAME_H` (700) — game area dimensions
    - `RAMP_LENGTH` (300) — ramp visual length in px
    - `RAMP_ANGLE` (38) — degrees from horizontal
    - `LAUNCH_ZONE` — {x, y} position of ramp lip
    - `LANDING_HILL_SLOPE` (0.35) — gradient of landing hill
    - `GRAVITY` (9.81), `AIR_RESISTANCE` (0.02)
    - `MAX_DISTANCE` (170) — metres, theoretical max for perfect jump
    - `ROUNDS_PER_GAME` (5), `BEST_N` (3) — best 3 of 5 count
    - `TIMING_WINDOW` — { perfect: 50ms, good: 150ms, ok: 300ms }
  - Define `BRAND` colour palette (same as curling)
  - Define `JUMPERS` array — 5 themed jumpers:
    ```javascript
    { id: 1, name: "Data Pipeline", emoji: "🔄", color: BRAND.blue },
    { id: 2, name: "Neural Network", emoji: "🧠", color: BRAND.purple },
    { id: 3, name: "Cloud Deploy", emoji: "☁️", color: BRAND.green },
    { id: 4, name: "API Gateway", emoji: "🔗", color: BRAND.orange },
    { id: 5, name: "Auto Scaler", emoji: "📈", color: BRAND.blueLight },
    ```
  - Define `GRADE_TIERS` for total score:
    ```javascript
    { min: 450, label: "Olympic Champion", emoji: "🥇" },
    { min: 350, label: "World Class", emoji: "🏆" },
    { min: 250, label: "Pro Jumper", emoji: "🎿" },
    { min: 150, label: "Ski Enthusiast", emoji: "⛷️" },
    { min: 0, label: "Snow Bunny", emoji: "🐰" },
    ```
  - Define `DISTANCE_MESSAGES` per tier (like curling's contextual messages)
- **Acceptance**: Constants exported/accessible, game renders without errors

### T2: Ramp + Landing Hill Rendering
- **Status**: OPEN
- **Priority**: P0
- **Depends**: None
- **Parallel**: Yes — independent of T1, T3
- **Agent**: Can be completed by any agent
- **Spec**:
  - Render side-view ski jump using pure DOM/inline SVG (no canvas):
    - **Ramp**: Angled slope rising from bottom-left to upper-centre
    - **Lip**: Curved transition at top of ramp (the launch point)
    - **Landing hill**: Downward slope extending to the right
    - **Distance markers**: Every 10m marked along the landing hill
    - **Background**: Dark gradient sky (#111827 → #1E3A5F), snow ground
    - **Snow particles**: Static decorative snow on ground areas
  - Use CSS transforms for the angled ramp (rotate + position)
  - Entire scene fits in a `GAME_W x GAME_H` container
  - Scene must be a stateless visual — no game logic, just rendering divs/SVGs
  - Export as a React component `<SkiJumpScene />` or inline in main game component
- **Acceptance**: Ramp and hill render correctly, visually recognisable as a ski jump

### T3: Sound System (Web Audio API)
- **Status**: OPEN
- **Priority**: P0
- **Depends**: None
- **Parallel**: Yes — independent of T1, T2
- **Agent**: Can be completed by any agent
- **Spec**:
  - Create sound synthesis functions (same pattern as curling — no audio files):
    - `whoosh` — descending tone for ramp slide (400Hz→200Hz, 300ms)
    - `launch` — sharp ascending pop (200Hz→600Hz, 100ms)
    - `wind` — filtered white noise loop during flight (continuous, stop on land)
    - `landing_good` — satisfying crunch + ascending ding (300ms)
    - `landing_perfect` — double ascending tone + crowd cheer (white noise burst, 500ms)
    - `landing_bad` — low thud (200Hz, 150ms)
    - `crowd` — white noise burst with bandpass filter (simulates crowd roar, 400ms)
    - `tick` — UI click sound (800Hz square, 30ms) for round transitions
  - `playSound(type)` function with AudioContext lazy init on first user interaction
  - `vibrate(pattern)` wrapper for haptic feedback
  - Mute toggle support (store in ref, check before playing)
- **Acceptance**: All sounds play correctly, no errors on mobile Safari, mute works

---

## Wave 2 — Core Mechanic (Depends: Wave 1)

### T4: Jumper Physics & Flight Arc
- **Status**: OPEN
- **Priority**: P0
- **Depends**: T1, T2
- **Parallel**: Yes — independent of T5 (T5 feeds into T4 at integration but can be built separately)
- **Agent**: Needs physics understanding
- **Spec**:
  - **Ramp slide**: Jumper accelerates down ramp via `a = g * sin(angle)`
    - Speed at lip = `sqrt(2 * g * rampHeight)` (energy conservation)
    - Visual: jumper div slides from top of ramp to lip over ~1.5 seconds
  - **Flight arc**: Parabolic trajectory from lip
    - Initial velocity components: `vx = speed * cos(launchAngle)`, `vy = speed * sin(launchAngle)`
    - Position: `x(t) = vx * t`, `y(t) = vy * t - 0.5 * g * t²`
    - `launchAngle` determined by timing (T5 provides this — use a default 35° for testing)
    - Light air resistance: `v *= (1 - AIR_RESISTANCE)` per frame
    - Optional: wind factor (random -1 to +1 m/s crosswind per round, visual only)
  - **Landing detection**: Jumper intersects with landing hill slope
    - Hill equation: `hillY(x) = lipY + (x - lipX) * LANDING_HILL_SLOPE`
    - When `jumperY >= hillY(jumperX)`, jumper has landed
    - Distance = horizontal distance from lip to landing point, converted to metres
  - **Animation**: `requestAnimationFrame` loop, direct DOM manipulation (same as curling)
    - Update jumper position via refs, not React state
    - Draw trail dots during flight (small circles fading behind jumper)
  - **Jumper rendering**: Small div with emoji + colour from JUMPERS array
- **Acceptance**: Jumper flies in a realistic arc, lands on hill, distance calculated correctly

### T5: Launch Timing Mechanic
- **Status**: OPEN
- **Priority**: P0
- **Depends**: T1, T2
- **Parallel**: Yes — independent of T4 (produces launchAngle consumed by T4)
- **Agent**: Can be completed by any agent
- **Spec**:
  - **Approach phase**: Jumper slides down ramp automatically (1.5s duration)
  - **Timing indicator**: Pulsing circle/bar near the lip — player must tap at the right moment
    - Visual: expanding ring that reaches "perfect" size at the optimal moment
    - Or: moving bar that crosses a target zone (like a golf swing meter)
  - **Timing windows**:
    - `perfect` (±50ms): optimal launch angle (38°), bonus speed +10%
    - `good` (±150ms): decent angle (30-45°), normal speed
    - `ok` (±300ms): poor angle (20-50°), speed -10%
    - `miss` (>300ms): terrible angle (10-60°), speed -25%
  - **Input**: Single tap/click anywhere on screen, or spacebar on desktop
  - **Visual feedback**: Flash colour on timing (green=perfect, yellow=good, orange=ok, red=miss)
  - **Output**: `{ launchAngle, speedMultiplier, timingGrade }` passed to physics (T4)
  - **Auto-launch**: If player doesn't tap within 500ms after optimal window, auto-launch at worst timing
- **Acceptance**: Tapping at different times produces different launch angles, visual feedback clear

### T6: Landing Timing Mechanic
- **Status**: OPEN
- **Priority**: P0
- **Depends**: T4
- **Parallel**: No — needs flight arc to know when landing approaches
- **Agent**: Can be completed by any agent
- **Spec**:
  - **During flight**: Player watches arc and must tap to "prepare landing"
  - **Timing target**: Tap when jumper is within optimal landing zone (last 20% of arc before ground)
  - **Style multiplier**:
    - `telemark` (perfect, ±50ms): 1.5x distance multiplier, celebration animation
    - `clean` (good, ±150ms): 1.2x multiplier
    - `shaky` (ok, ±300ms): 1.0x multiplier (no bonus)
    - `crash` (miss/too late): 0.7x multiplier, crash animation, crowd groan
  - **Visual**: Jumper body angle changes based on timing:
    - Perfect: leaning forward, skis aligned (CSS rotate)
    - Crash: tumbling animation (CSS rotate rapidly)
  - **Input**: Same as launch — tap anywhere or spacebar
  - **Snow burst on landing**: Particle explosion from landing point (white circles expanding and fading)
  - **Final score for round**: `distance * styleMultiplier` → displayed as metres (e.g. "143.7m")
- **Acceptance**: Landing timing affects score, visual feedback for each grade, crash looks funny

---

## Wave 3 — Game Loop (Depends: Wave 2)

### T7: Round System & Scoring
- **Status**: OPEN
- **Priority**: P0
- **Depends**: T4, T5, T6
- **Parallel**: No — integrates all Wave 2 outputs
- **Agent**: Needs to integrate T4+T5+T6
- **Spec**:
  - **Game flow**: Title → Round 1 → Round 2 → ... → Round 5 → Results
  - **Per round**:
    1. Show round intro: "Round 3/5 — Neural Network 🧠" (1.5s)
    2. Approach phase (jumper slides down ramp)
    3. Launch timing (player taps)
    4. Flight animation
    5. Landing timing (player taps)
    6. Score display: "143.7m — Clean Landing! (1.2x)" (2s)
    7. Transition to next round
  - **Scoring**: Best 3 of 5 rounds count toward total
    - Total = sum of best 3 distances (after style multiplier)
    - Show which rounds counted on results screen
  - **State management**: `screen` state (title/playing/results), `currentRound`, `scores[]`
  - **Round transition**: Brief 1.5s pause showing score, then auto-advance
  - **Wind**: Random wind value per round (shown as arrow + "Wind: 1.3m/s →")
- **Acceptance**: Full 5-round game plays through, scores calculated, transitions smooth

### T8: HUD (Heads-Up Display)
- **Status**: OPEN
- **Priority**: P1
- **Depends**: T7
- **Parallel**: Yes — can be built alongside T9, T10
- **Agent**: Can be completed by any agent
- **Spec**:
  - **Top bar** (36px height):
    - Left: Round counter "Round 3/5"
    - Centre: Current jumper name + emoji
    - Right: Sound toggle button (speaker icon)
  - **Score strip** (below HUD): Previous round scores as small badges
    - Each badge: distance + style grade colour
    - Current best 3 highlighted
  - **Wind indicator**: Small arrow + speed text
  - **Distance meter**: During flight, live-updating distance counter (counts up in real-time)
  - **Best score**: Show personal best (from localStorage) somewhere subtle
- **Acceptance**: All HUD elements visible and update correctly during gameplay

---

## Wave 4 — Screens & UX (Partially Parallel with Wave 3)

### T9: Title Screen
- **Status**: OPEN
- **Priority**: P1
- **Depends**: T1 (brand constants only)
- **Parallel**: Yes — can start in Wave 1, no game logic needed
- **Agent**: Can be completed by any agent
- **Spec**:
  - **Layout** (portrait-first, centred):
    - BrandedAI logo/text at top
    - "AI Ski Jump Championship" title (gradient text, clamp sizing)
    - "Winter Olympics 2026 Edition" badge
    - Ski jump silhouette illustration (CSS/SVG, simple)
    - "Time your launch. Nail the landing." tagline
    - Rules quick-ref: "5 jumps, best 3 count. Tap to launch, tap to land."
    - Best score display (if exists in localStorage)
    - Large "START JUMPING" button (pulse animation)
    - "Built by BrandedAI" footer with link
  - **Background**: Animated subtle snowfall (CSS keyframes, 10-15 dots)
  - **Style**: Same aesthetic as curling title screen — dark bg, blue/purple accents
- **Acceptance**: Title screen renders, button starts game, responsive on mobile/desktop

### T10: Results Screen
- **Status**: OPEN
- **Priority**: P1
- **Depends**: T7
- **Parallel**: Yes — alongside T8
- **Agent**: Can be completed by any agent
- **Spec**:
  - **Layout**:
    - Grade title + emoji (e.g. "Olympic Champion 🥇")
    - Total distance: large number with units (e.g. "437.2m")
    - Breakdown: 5 rows showing each round's distance, style grade, and whether it counted (top 3 highlighted)
    - Personal best indicator (if new record)
  - **Buttons**:
    - "Share Result" — copy shareable text to clipboard + Web Share API on mobile
    - "Challenge a Friend" — generates challenge URL
    - "Jump Again" — restart game
    - "Book a Discovery Call" — CTA to brandedai.net (same as curling)
  - **Share text format**:
    ```
    🎿 AI Ski Jump Championship

    Round 1: 142.3m ✈️ Telemark!
    Round 2: 98.1m 🎿 Clean
    Round 3: 156.7m ✈️ Telemark!
    Round 4: 67.2m 💥 Crash!
    Round 5: 134.9m 🎿 Clean

    Total: 433.9m — Olympic Champion 🥇
    Best 3: ⭐⭐⭐☆☆

    Can you beat my distance?
    🔗 skijump.brandedai.net
    ```
  - **Animation**: Results fade in staggered (each row pops in 200ms apart)
- **Acceptance**: Results display correctly, share works, CTA links work

### T11: Tutorial Overlay
- **Status**: OPEN
- **Priority**: P2
- **Depends**: T5, T6
- **Parallel**: Yes — alongside T10
- **Agent**: Can be completed by any agent
- **Spec**:
  - **First play only** (check localStorage `skipTutorial` flag)
  - **Step 1**: "TAP when the jumper reaches the lip!" with pulsing indicator on ramp
  - **Step 2**: "TAP again to nail the landing!" with indicator on landing zone
  - **Dismiss**: Tap anywhere or "Got it" button
  - **Style**: Semi-transparent dark overlay with highlighted zones
  - Keep it minimal — 2 steps max, game is simple enough
- **Acceptance**: Shows on first visit, dismissed on tap, doesn't show again

### T12: Responsive Scaling
- **Status**: OPEN
- **Priority**: P1
- **Depends**: T2
- **Parallel**: Yes — can be built alongside Wave 2
- **Agent**: Can be completed by any agent
- **Spec**:
  - Same scaling pattern as curling game:
    ```javascript
    const hudAndChrome = 120 // HUD + footer
    const availH = window.innerHeight - hudAndChrome
    const scaleH = availH / GAME_H
    const scaleW = window.innerWidth / GAME_W
    setGameScale(Math.min(scaleH, scaleW, 1.6))
    ```
  - Game container uses `transform: scale(gameScale)` with `transform-origin: top center`
  - Recalculate on window resize (debounced)
  - Test: 320px phone, 375px iPhone, 768px tablet, 1440px desktop
  - Lock viewport: `maximum-scale=1.0, user-scalable=no` (already in index.html)
  - Prevent body scroll bounce on iOS
- **Acceptance**: Game scales correctly from 320px to 2560px, no scrolling during play

---

## Wave 5 — Polish (Depends: Wave 3-4)

### T13: Sound Integration
- **Status**: OPEN
- **Priority**: P1
- **Depends**: T3, T7
- **Parallel**: Yes — alongside T14, T15, T16
- **Agent**: Can be completed by any agent
- **Spec**:
  - Wire up T3 sounds to game events:
    - Ramp slide start → `whoosh`
    - Launch tap → `launch`
    - During flight → `wind` (looping, stop on land)
    - Good/perfect landing → `landing_good` / `landing_perfect` + `crowd`
    - Crash → `landing_bad`
    - Round transition → `tick`
    - New best score → `crowd` (longer burst)
  - Mute button in HUD toggles all sounds
  - Respect user's mute preference (persist in localStorage)
- **Acceptance**: All game events have appropriate sounds, mute works

### T14: Haptic Feedback
- **Status**: OPEN
- **Priority**: P2
- **Depends**: T5, T6
- **Parallel**: Yes — alongside T13, T15, T16
- **Agent**: Can be completed by any agent
- **Spec**:
  - `navigator.vibrate()` on supported devices:
    - Launch tap: `vibrate(15)` — short click
    - Perfect launch: `vibrate([20, 30, 20])` — double tap
    - Landing: `vibrate(25)` — thud
    - Perfect landing: `vibrate([30, 20, 30, 20, 50])` — celebration
    - Crash: `vibrate([100])` — long buzz
  - No-op on unsupported devices (check `navigator.vibrate` exists)
- **Acceptance**: Haptics fire on mobile, no errors on desktop

### T15: Particle Effects
- **Status**: OPEN
- **Priority**: P2
- **Depends**: T4
- **Parallel**: Yes — alongside T13, T14, T16
- **Agent**: Can be completed by any agent
- **Spec**:
  - **Snow burst on landing**: 15-20 white circles expanding outward from landing point
    - Each particle: random angle, random speed, fades to opacity 0 over 500ms
    - Use direct DOM manipulation (same as curling's trail dots)
  - **Wind streaks during flight**: Small horizontal lines that drift across during flight
    - 3-5 streaks, CSS animation, indicate wind direction
  - **Speed lines on ramp**: Horizontal lines behind jumper during approach
  - **Crash particles**: On crash landing, add tumbling ski emojis (🎿) that fly off
  - All particles self-cleanup (remove DOM nodes after animation)
- **Acceptance**: Particles look good, no memory leaks, performant at 60fps

### T16: Keyboard Controls
- **Status**: OPEN
- **Priority**: P2
- **Depends**: T5, T6
- **Parallel**: Yes — alongside T13, T14, T15
- **Agent**: Can be completed by any agent
- **Spec**:
  - **Spacebar**: Primary action (launch tap and landing tap)
  - **Enter**: Start game from title screen, advance from results
  - **M**: Toggle mute
  - **R**: Restart game (from results screen only)
  - Add `keydown` event listener, clean up on unmount
  - Visual hint on title screen: "Press SPACE to jump" (desktop only, detect via hover/mouse events)
- **Acceptance**: Full game playable via keyboard, no conflicts with browser shortcuts

---

## Wave 6 — Viral Mechanics (Depends: Wave 4)

### T17: Share Card
- **Status**: OPEN
- **Priority**: P1
- **Depends**: T10
- **Parallel**: Yes — alongside T18, T19
- **Agent**: Can be completed by any agent
- **Spec**:
  - Generate shareable text (see T10 share format)
  - **Mobile**: Use `navigator.share()` Web Share API (title, text, url)
  - **Desktop**: Copy to clipboard + toast "Copied! Share on LinkedIn"
  - **LinkedIn deep link**: `https://www.linkedin.com/sharing/share-offsite/?url=...`
  - Include direct game URL in share text
- **Acceptance**: Share works on mobile (native sheet) and desktop (clipboard), LinkedIn link works

### T18: Challenge Link System
- **Status**: OPEN
- **Priority**: P1
- **Depends**: T10
- **Parallel**: Yes — alongside T17, T19
- **Agent**: Can be completed by any agent
- **Spec**:
  - **Generate challenge URL**: `skijump.brandedai.net/?challenge=true&name=Scott&score=437`
  - **On load with challenge params**:
    - Title screen shows: "Scott jumped 437.2m. Can you beat it?"
    - Challenger's score displayed as a target line on the results screen
    - After game: "You beat Scott!" / "Scott wins this time!" comparison
  - **"Challenge a Friend" button** on results screen:
    - Generates URL with current player's score
    - Opens share sheet (mobile) or copies to clipboard (desktop)
  - No backend needed — all in URL params + localStorage
- **Acceptance**: Challenge URLs work, comparison shows correctly, generates new challenge after play

### T19: localStorage Persistence
- **Status**: OPEN
- **Priority**: P1
- **Depends**: T7, T10
- **Parallel**: Yes — alongside T17, T18
- **Agent**: Can be completed by any agent
- **Spec**:
  - **High score**: Best total distance across all games
  - **Games played counter**: Increment each complete game
  - **Streak counter**: Days with at least one game played (reset if gap > 36 hours)
  - **Tutorial seen flag**: Skip tutorial after first play
  - **Sound muted preference**: Persist mute state
  - **Last played date**: For streak calculation
  - All stored under `skijump_` prefix to avoid collisions
  - Show streak on title screen: "Day 3 streak 🔥" (if > 1)
- **Acceptance**: High score persists across sessions, streak tracks correctly, tutorial skipped

---

## Wave 7 — Deploy & Marketing (Depends: All Above)

### T20: Vercel Deployment + Custom Domain
- **Status**: OPEN
- **Priority**: P0
- **Depends**: All T1-T19
- **Parallel**: No — sequential, needs complete game
- **Agent**: Needs deploy access
- **Spec**:
  - Create GitHub repo `SCEVLTD/ai-ski-jump`
  - Create deploy clone at `C:\Users\conta\ai-ski-jump-deploy\`
  - Connect to Vercel under `brandedai-projects` team
  - Add custom domain: `skijump.brandedai.net`
  - Verify build passes: `npm run build`
  - Test live URL
  - Enable Vercel Analytics (auto via `@vercel/analytics`)
- **Acceptance**: Live at skijump.brandedai.net, analytics collecting

### T21: OG Image
- **Status**: OPEN
- **Priority**: P1
- **Depends**: T20
- **Parallel**: Yes — alongside T22
- **Agent**: Needs image creation capability
- **Spec**:
  - 1200x630 PNG at `public/og-image.png`
  - Design: Ski jump silhouette, "AI Ski Jump Championship", "Winter Olympics 2026 Edition" badge
  - BrandedAI branding, blue/purple gradient background
  - Match style of curling OG image
- **Acceptance**: OG image renders correctly in LinkedIn link preview

### T22: LinkedIn Post
- **Status**: OPEN
- **Priority**: P1
- **Depends**: T20, T21
- **Parallel**: No — needs everything deployed first
- **Agent**: Marketing/copy
- **Spec**:
  - Post copy with hook: "They cancelled the Olympic ski jump due to snow. So we built our own."
  - Carousel or single image with game screenshots
  - CTA: "How far can you fly? 🎿 skijump.brandedai.net"
  - Cross-promote curling game: "Already played AI Curling? Try the new event."
  - Tag relevant Winter Olympics hashtags
- **Acceptance**: Post published, link works, OG preview shows correctly

---

## Wave 8 — Post-Launch Enhancements

### T23: Weekly Leaderboard (MVP)
- **Status**: OPEN
- **Priority**: P2
- **Depends**: T20
- **Parallel**: Yes
- **Spec**:
  - localStorage-based for MVP (no backend)
  - Show "This Week's Best" on title screen
  - Weekly reset based on ISO week number
  - Future: Simple JSON API backend for global leaderboard

### T24: Cross-Promo with Curling Game
- **Status**: OPEN
- **Priority**: P2
- **Depends**: T20
- **Parallel**: Yes — alongside T23
- **Spec**:
  - Add "Play AI Curling" link on ski jump results screen
  - Add "Play AI Ski Jump" link on curling results screen
  - "BrandedAI Winter Olympics Collection" branding
  - Shared progress: "You've played 2 of 2 events!"

---

## Task Summary

| Wave | Tasks | Status | Can Parallel? |
|------|-------|--------|---------------|
| 1 — Foundation | T1, T2, T3 | OPEN | All 3 parallel |
| 2 — Core Mechanic | T4, T5, T6 | OPEN | T4∥T5, then T6 |
| 3 — Game Loop | T7, T8 | OPEN | T7→T8 sequential |
| 4 — Screens/UX | T9, T10, T11, T12 | OPEN | T9 early; T10∥T11∥T12 after T7 |
| 5 — Polish | T13, T14, T15, T16 | OPEN | All 4 parallel |
| 6 — Viral | T17, T18, T19 | OPEN | All 3 parallel |
| 7 — Deploy | T20, T21, T22 | OPEN | T20→T21→T22 sequential |
| 8 — Post-Launch | T23, T24 | OPEN | Both parallel |

**Critical path**: T1 → T4/T5 → T6 → T7 → T10 → T20 → T22
**Total tasks**: 24
**Estimated build time**: 1-2 days (aggressive, with parallel agents)
