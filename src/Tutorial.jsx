// =============================================================================
// AI Ski Jump Championship — Tutorial Screen
// Overlay explaining the two-tap mechanics before the first game.
// =============================================================================

import { useState, useEffect } from 'react'
import { BRAND, GAME_W, GAME_H } from './constants'

const FONT = "'Open Sans','Segoe UI',system-ui,sans-serif"
const DISPLAY_FONT = "'Barlow Condensed','Open Sans',system-ui,sans-serif"

export default function Tutorial({ onDismiss, gameScale }) {
  const [step, setStep] = useState(0)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)')
    setIsDesktop(mq.matches)
  }, [])

  // Allow clicking/tapping anywhere to advance
  useEffect(() => {
    const handleTap = (e) => {
      // If it's a keydown, only accept Space
      if (e.type === 'keydown' && e.code !== 'Space') return
      e.preventDefault() // prevent space from scrolling
      
      if (step === 2) { // 3 steps total
        onDismiss()
      } else {
        setStep(s => s + 1)
      }
    }

    window.addEventListener('keydown', handleTap)
    window.addEventListener('pointerdown', handleTap)
    
    return () => {
      window.removeEventListener('keydown', handleTap)
      window.removeEventListener('pointerdown', handleTap)
    }
  }, [step, onDismiss])

  const steps = [
    {
      title: "1. THE LAUNCH",
      desc: "Tap when the moving ring perfectly aligns with the centre circle to maximize launch velocity.",
      visual: (
        <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto' }}>
          <div style={{
            position: 'absolute', inset: 10, borderRadius: '50%',
            border: `3px solid ${BRAND.white}`, opacity: 0.3,
          }} />
          <div style={{
            position: 'absolute', inset: 25, borderRadius: '50%',
            background: BRAND.blue, opacity: 0.5,
          }} />
          <div style={{
            position: 'absolute', inset: 35, borderRadius: '50%',
            background: BRAND.white,
          }} />
          {/* Animated shrinking ring */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: `4px solid ${BRAND.blueLight}`,
            animation: 'shrinkRing 1.5s ease-out infinite'
          }} />
        </div>
      )
    },
    {
      title: "2. MID-AIR BOOST",
      desc: isDesktop ? "Press any Arrow key or Space to boost distance mid-air (max 3 times)!" : "Tap the screen mid-air to boost your distance (max 3 times)!",
      visual: (
        <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', background: BRAND.orange,
            animation: 'pulse 0.5s ease-in-out infinite alternate',
            boxShadow: `0 0 15px ${BRAND.orange}`
          }} />
        </div>
      )
    },
    {
      title: "3. THE LANDING",
      desc: isDesktop ? "Press Space exactly as you hit the slope to stick a perfect landing." : "Tap exactly as you hit the slope to stick a perfect landing.",
      visual: (
        <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto', overflow: 'hidden' }}>
          {/* Slope */}
          <div style={{
            position: 'absolute', top: 50, left: -20, right: -20, height: 100,
            background: '#CBD5E1', transform: 'rotate(20deg)'
          }} />
          {/* Jumper dropping */}
          <div style={{
            position: 'absolute', top: 10, left: 35, width: 30, height: 30,
            borderRadius: '50%', background: BRAND.blue,
            animation: 'dropLand 2s ease-in forwards infinite'
          }} />
        </div>
      )
    }
  ]

  const current = steps[step]

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(17, 24, 39, 0.85)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      zIndex: 60,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <style>{`
        @keyframes shrinkRing {
          0% { transform: scale(1); opacity: 0; }
          20% { opacity: 1; }
          80% { transform: scale(0.35); opacity: 1; }
          100% { transform: scale(0.35); opacity: 0; }
        }
        @keyframes dropLand {
          0% { transform: translateY(0); opacity: 0; }
          20% { opacity: 1; }
          80% { transform: translateY(50px); opacity: 1; }
          90% { transform: translateY(50px) scale(1.5, 0.5); opacity: 1; }
          100% { transform: translateY(50px); opacity: 0; }
        }
      `}</style>
      
      <div style={{
        background: '#1F2937', // BRAND.darkMid
        borderRadius: '16px',
        padding: '32px 24px',
        width: '100%',
        maxWidth: '320px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        animation: 'popIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275)',
      }}>
        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: i === step ? BRAND.blue : '#374151',
              transition: 'background 0.3s'
            }} />
          ))}
        </div>

        {/* Content */}
        <div style={{ minHeight: '180px', display: 'flex', flexDirection: 'column' }}>
          {current.visual}
          
          <h2 style={{
            fontSize: '24px',
            fontWeight: 800,
            color: BRAND.white,
            textAlign: 'center',
            margin: '20px 0 12px',
            fontFamily: DISPLAY_FONT,
            letterSpacing: '1px',
          }}>
            {current.title}
          </h2>
          
          <p style={{
            fontSize: '15px',
            color: BRAND.grayLight,
            textAlign: 'center',
            lineHeight: 1.5,
            margin: 0,
            fontFamily: FONT,
          }}>
            {current.desc}
          </p>
        </div>

        {/* Action */}
        <div style={{
          marginTop: 32,
          textAlign: 'center',
          fontSize: '13px',
          fontWeight: 600,
          color: BRAND.blueLight,
          animation: 'pulse 1.5s infinite',
        }}>
          {isDesktop ? "Press SPACE to continue" : "Tap anywhere to continue"}
        </div>
      </div>
    </div>
  )
}
