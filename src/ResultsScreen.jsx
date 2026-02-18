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
  const shareText = generateShareText(scores, totalScore, grade)
  const beatChallenger = challengerScore != null && totalScore > challengerScore

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
      animation: 'fadeUp 0.6s ease-out',
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

        {/* ---- 1. Grade Header ---- */}
        <div style={{
          fontSize: '64px',
          lineHeight: 1,
          animation: 'popIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275) 0.1s both',
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
          animation: 'popIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275) 0.2s both',
          letterSpacing: '1px',
          lineHeight: 1.2,
        }}>
          {grade.label}
        </h1>

        {/* ---- 2. Total Score ---- */}
        <div style={{
          fontSize: 'clamp(48px, 10vw, 72px)',
          fontWeight: 800,
          textAlign: 'center',
          margin: '12px 0 0',
          color: BRAND.white,
          letterSpacing: '-1px',
          animation: 'fadeUp 0.6s ease-out 0.3s both',
          lineHeight: 1.1,
        }}>
          {totalScore.toFixed(1)}m
        </div>
        <div style={{
          fontSize: '14px',
          color: BRAND.grayLight,
          fontWeight: 600,
          textAlign: 'center',
          margin: '4px 0 12px',
          animation: 'fadeUp 0.6s ease-out 0.35s both',
        }}>
          Best 3 of 5 jumps
        </div>

        {/* New Personal Best badge */}
        {isNewRecord && (
          <div style={{
            animation: 'fadeUp 0.6s ease-out 0.4s both',
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
            {/* Shimmer overlay */}
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
            animation: 'fadeUp 0.6s ease-out 0.4s both',
            fontSize: '13px',
            color: BRAND.gray,
            marginBottom: '8px',
          }}>
            Personal best: {bestScore}m
          </div>
        )}

        {/* ---- 3. Challenge Comparison ---- */}
        {challengerName && (
          <div style={{
            animation: 'fadeUp 0.6s ease-out 0.45s both',
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

        {/* ---- 4. Round Breakdown ---- */}
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
            const delay = 0.5 + i * 0.2

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
                  animation: `popIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275) ${delay}s both`,
                  boxSizing: 'border-box',
                }}
              >
                {/* Round number + jumper emoji */}
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

        {/* ---- 6. Action Buttons ---- */}
        <div style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          animation: 'fadeUp 0.6s ease-out 1.6s both',
        }}>
          {/* Share Result */}
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

          {/* Challenge a Friend */}
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

          {/* Jump Again */}
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

        {/* ---- 7. CTA ---- */}
        <div style={{
          width: '100%',
          marginTop: '28px',
          paddingTop: '20px',
          borderTop: `1px solid ${BRAND.gray}33`,
          textAlign: 'center',
          animation: 'fadeUp 0.6s ease-out 1.8s both',
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

        {/* ---- 8. Footer ---- */}
        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          animation: 'fadeUp 0.6s ease-out 2.0s both',
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

      {/* Keyframe animations injected via style tag */}
      <style>{`
        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeUp {
          0% { transform: translateY(16px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}
