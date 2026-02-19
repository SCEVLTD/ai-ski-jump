import { useEffect, useRef, useState } from 'react'
import { BRAND, ROUNDS_PER_GAME } from './constants'

const FONT = "'Open Sans','Segoe UI',system-ui,sans-serif"

// ---------------------------------------------------------------------------
// Landing grade display config
// ---------------------------------------------------------------------------
const LANDING_DISPLAY = {
  telemark: { icon: "\u2708\uFE0F", label: "Telemark!", color: BRAND.green },
  clean:    { icon: "\uD83C\uDFBF", label: "Clean",     color: BRAND.blue },
  shaky:    { icon: "\uD83D\uDE2C", label: "Shaky",     color: BRAND.orange },
  crash:    { icon: "\uD83D\uDCA5", label: "Crash!",    color: BRAND.red },
}

// ---------------------------------------------------------------------------
// Generate shareable text summary
// ---------------------------------------------------------------------------
export function generateShareText(scores, totalScore, grade) {
  const lines = scores.map((s, i) => {
    const ld = LANDING_DISPLAY[s.landingGrade] || LANDING_DISPLAY.clean
    return `Round ${i + 1}: ${s.distance.toFixed(1)}m ${ld.icon} ${ld.label}`
  })

  const countedStars = scores.filter((s) => s.counted).length
  const starLine = "\u2B50".repeat(countedStars) + "\u2606".repeat(ROUNDS_PER_GAME - countedStars)

  return [
    "\uD83C\uDFBF AI Ski Jump Championship",
    "",
    ...lines,
    "",
    `Total: ${totalScore.toFixed(1)}m \u2014 ${grade.label} ${grade.emoji}`,
    `Best 3: ${starLine}`,
    "",
    "Can you beat my distance?",
    "\uD83D\uDD17 skijump.brandedai.net",
  ].join("\n")
}

// ---------------------------------------------------------------------------
// Ease-out cubic for counter animation
// ---------------------------------------------------------------------------
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3)
}

// ---------------------------------------------------------------------------
// ResultsScreen component
// ---------------------------------------------------------------------------
export default function ResultsScreen({
  scores,
  totalScore,
  grade,
  bestScore,
  isNewRecord,
  challengerName,
  challengerScore,
  onPlayAgain,
  onShare,
  onChallenge,
}) {
  const counterRef = useRef(null)
  const [gradeVisible, setGradeVisible] = useState(false)

  // Unlock body scroll so results can scroll on mobile
  useEffect(() => {
    document.body.style.overflow = 'auto'
    document.body.style.position = 'static'
    return () => {
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
    }
  }, [])

  // Counter roll-up animation: 0 → totalScore over 1.5s with ease-out
  useEffect(() => {
    const duration = 1500
    let startTime = null
    let raf = null

    function tick(now) {
      if (!startTime) startTime = now
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeOutCubic(progress)
      const current = eased * totalScore

      if (counterRef.current) {
        counterRef.current.textContent = `${current.toFixed(1)}m`
      }

      if (progress < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        // Counter done — reveal grade after 300ms
        setTimeout(() => setGradeVisible(true), 300)
      }
    }

    // Small delay before starting counter (let rounds animate in first)
    const startDelay = setTimeout(() => {
      raf = requestAnimationFrame(tick)
    }, scores.length * 200 + 600)

    return () => {
      clearTimeout(startDelay)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [totalScore, scores.length])

  const shareText = generateShareText(scores, totalScore, grade)
  const beatChallenger = challengerScore != null && totalScore > challengerScore

  // Calculate timing: rounds animate in first, then counter, then grade
  const counterStartDelay = scores.length * 0.2 + 0.6 // seconds
  const gradeDelay = counterStartDelay + 1.5 + 0.3 // after counter + pause
  const buttonsDelay = gradeDelay + 0.5

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: `linear-gradient(160deg, ${BRAND.dark} 0%, #0f1a2e 50%, ${BRAND.darkMid} 100%)`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: FONT,
      color: BRAND.white,
      overflowY: 'auto',
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

        {/* ---- 1. Round Breakdown (staggered reveal first) ---- */}
        <div style={{
          width: '100%',
          marginTop: '8px',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          {scores.map((s, i) => {
            const ld = LANDING_DISPLAY[s.landingGrade] || LANDING_DISPLAY.clean
            const counted = s.counted
            const delay = 0.3 + i * 0.2

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: counted
                    ? `${BRAND.blue}18`
                    : `${BRAND.darkMid}88`,
                  border: counted
                    ? `1px solid ${BRAND.blue}33`
                    : '1px solid transparent',
                  opacity: counted ? 1 : 0.5,
                  animation: `slideIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275) ${delay}s both`,
                  boxSizing: 'border-box',
                }}
              >
                {/* Jumper emoji */}
                <div style={{
                  fontSize: '20px',
                  lineHeight: 1,
                  minWidth: '28px',
                  textAlign: 'center',
                }}>
                  {s.jumper?.emoji || "\uD83C\uDFBF"}
                </div>

                {/* Jumper name + round */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: BRAND.white,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {s.jumper?.name || `Round ${i + 1}`}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: BRAND.grayLight,
                    fontWeight: 600,
                  }}>
                    Round {i + 1}
                  </div>
                </div>

                {/* Distance */}
                <div style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  color: BRAND.white,
                  minWidth: '64px',
                  textAlign: 'right',
                }}>
                  {s.distance.toFixed(1)}m
                </div>

                {/* Landing grade */}
                <div style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: ld.color,
                  minWidth: '90px',
                  textAlign: 'right',
                  whiteSpace: 'nowrap',
                }}>
                  {ld.icon} {ld.label}
                </div>

                {/* Counted star */}
                <div style={{
                  fontSize: '16px',
                  minWidth: '20px',
                  textAlign: 'center',
                }}>
                  {counted ? "\u2B50" : ""}
                </div>
              </div>
            )
          })}
        </div>

        {/* ---- 2. Total Score (counter roll-up) ---- */}
        <div style={{
          position: 'relative',
          textAlign: 'center',
          margin: '4px 0 0',
          animation: `fadeUp 0.4s ease-out ${counterStartDelay}s both`,
        }}>
          <div
            ref={counterRef}
            style={{
              fontSize: 'clamp(48px, 10vw, 72px)',
              fontWeight: 800,
              color: BRAND.white,
              letterSpacing: '-1px',
              lineHeight: 1.1,
            }}
          >
            0.0m
          </div>
          {/* Gold shimmer overlay for new record */}
          {isNewRecord && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, transparent 0%, rgba(245,158,11,0.25) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: `goldShimmer 2s ease-in-out ${gradeDelay}s infinite`,
              pointerEvents: 'none',
              borderRadius: '8px',
              opacity: 0,
            }} />
          )}
        </div>
        <div style={{
          fontSize: '14px',
          color: BRAND.grayLight,
          fontWeight: 600,
          textAlign: 'center',
          margin: '4px 0 12px',
          animation: `fadeUp 0.4s ease-out ${counterStartDelay + 0.1}s both`,
        }}>
          Best 3 of 5 jumps
        </div>

        {/* New Personal Best badge */}
        {isNewRecord && (
          <div style={{
            animation: `fadeUp 0.4s ease-out ${gradeDelay - 0.1}s both`,
            padding: '8px 20px',
            borderRadius: '20px',
            background: `linear-gradient(135deg, ${BRAND.orange}33, ${BRAND.orange}22)`,
            border: `1px solid ${BRAND.orange}`,
            fontSize: '14px',
            fontWeight: 800,
            color: BRAND.orange,
            letterSpacing: '1px',
            marginBottom: '8px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
              animation: 'shimmer 2s ease-in-out infinite',
              pointerEvents: 'none',
            }} />
            NEW PERSONAL BEST!
          </div>
        )}

        {/* Previous best (if not a new record) */}
        {!isNewRecord && bestScore != null && bestScore > 0 && (
          <div style={{
            animation: `fadeUp 0.4s ease-out ${gradeDelay - 0.1}s both`,
            fontSize: '13px',
            color: BRAND.gray,
            marginBottom: '8px',
          }}>
            Personal best: {bestScore}m
          </div>
        )}

        {/* ---- 3. Grade Header (delayed reveal with bounce) ---- */}
        <div style={{
          textAlign: 'center',
          marginBottom: '12px',
          opacity: gradeVisible ? 1 : 0,
          transform: gradeVisible ? 'scale(1)' : 'scale(0.5)',
          transition: 'opacity 0.4s ease-out, transform 0.5s cubic-bezier(0.175,0.885,0.32,1.275)',
        }}>
          <div style={{
            fontSize: '64px',
            lineHeight: 1,
            marginBottom: '8px',
          }}>
            {grade.emoji}
          </div>
          <h1 style={{
            fontSize: 'clamp(24px, 6vw, 36px)',
            fontWeight: 800,
            textAlign: 'center',
            margin: '0 0 4px',
            background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.purple})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: 'none',
            filter: `drop-shadow(0 2px 12px ${BRAND.blue}44)`,
            letterSpacing: '1px',
            lineHeight: 1.2,
          }}>
            {grade.label}
          </h1>
        </div>

        {/* ---- 4. Challenge Comparison ---- */}
        {challengerName && (
          <div style={{
            animation: `fadeUp 0.4s ease-out ${gradeDelay + 0.2}s both`,
            width: '100%',
            padding: '14px 16px',
            borderRadius: '12px',
            background: beatChallenger ? `${BRAND.green}15` : `${BRAND.orange}15`,
            border: `1px solid ${beatChallenger ? BRAND.green : BRAND.orange}55`,
            marginBottom: '16px',
            boxSizing: 'border-box',
          }}>
            <div style={{
              fontSize: '15px',
              fontWeight: 700,
              color: beatChallenger ? BRAND.green : BRAND.orange,
              textAlign: 'center',
              marginBottom: '10px',
            }}>
              {beatChallenger
                ? `You beat ${challengerName}!`
                : `${challengerName} wins this time!`
              }
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '32px',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: BRAND.grayLight, fontWeight: 600, marginBottom: '2px' }}>
                  You
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: BRAND.white }}>
                  {totalScore.toFixed(1)}m
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: BRAND.grayLight, fontWeight: 600, marginBottom: '2px' }}>
                  {challengerName}
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: BRAND.white }}>
                  {challengerScore.toFixed(1)}m
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---- 5. Action Buttons ---- */}
        <div style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          animation: `fadeUp 0.4s ease-out ${buttonsDelay}s both`,
        }}>
          <button
            onClick={() => onShare(shareText)}
            style={{
              width: '100%',
              background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.blueDark})`,
              border: 'none',
              borderRadius: '12px',
              padding: '14px 32px',
              fontSize: '16px',
              fontWeight: 600,
              color: BRAND.white,
              cursor: 'pointer',
              fontFamily: FONT,
              boxShadow: `0 4px 20px ${BRAND.blue}44`,
              letterSpacing: '0.5px',
            }}
          >
            Share Result
          </button>

          <button
            onClick={onChallenge}
            style={{
              width: '100%',
              background: 'transparent',
              border: `2px solid ${BRAND.purple}`,
              borderRadius: '12px',
              padding: '14px 32px',
              fontSize: '16px',
              fontWeight: 600,
              color: BRAND.purple,
              cursor: 'pointer',
              fontFamily: FONT,
              letterSpacing: '0.5px',
            }}
          >
            Challenge a Friend
          </button>

          <button
            onClick={onPlayAgain}
            style={{
              width: '100%',
              background: 'transparent',
              border: `2px solid ${BRAND.gray}`,
              borderRadius: '12px',
              padding: '14px 32px',
              fontSize: '16px',
              fontWeight: 600,
              color: BRAND.grayLight,
              cursor: 'pointer',
              fontFamily: FONT,
              letterSpacing: '0.5px',
            }}
          >
            Jump Again
          </button>
        </div>

        {/* ---- 6. CTA ---- */}
        <div style={{
          width: '100%',
          marginTop: '28px',
          paddingTop: '20px',
          borderTop: `1px solid ${BRAND.gray}33`,
          textAlign: 'center',
          animation: `fadeUp 0.4s ease-out ${buttonsDelay + 0.3}s both`,
        }}>
          <div style={{
            fontSize: '13px',
            color: BRAND.gray,
            marginBottom: '6px',
          }}>
            Want to see AI automation in action?
          </div>
          <a
            href="https://brandedai.net"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: BRAND.blueLight,
              textDecoration: 'none',
              letterSpacing: '0.5px',
            }}
          >
            Book a Discovery Call
          </a>
        </div>

        {/* ---- 7. Footer ---- */}
        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          animation: `fadeUp 0.4s ease-out ${buttonsDelay + 0.5}s both`,
        }}>
          <div style={{
            fontSize: '12px',
            color: BRAND.gray,
            fontWeight: 600,
            letterSpacing: '0.5px',
            marginBottom: '6px',
          }}>
            Built by BrandedAI
          </div>
          <a
            href="https://curling.brandedai.net"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '12px',
              color: BRAND.grayLight,
              textDecoration: 'none',
            }}
          >
            Play AI Curling too! {"\uD83E\uDD4C"}
          </a>
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes slideIn {
          0% { transform: translateX(-20px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeUp {
          0% { transform: translateY(16px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes goldShimmer {
          0% { opacity: 0; background-position: -200% center; }
          10% { opacity: 1; }
          50% { background-position: 200% center; }
          90% { opacity: 1; }
          100% { opacity: 0; background-position: 200% center; }
        }
      `}</style>
    </div>
  )
}
