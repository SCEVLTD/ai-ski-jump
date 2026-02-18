// =============================================================================
// AI Ski Jump Championship — Responsive Scaling Hook
// Fits the game canvas to any viewport from 320px phones to 2560px ultrawide.
// Pattern mirrors the BrandedAI curling game scaling approach.
// =============================================================================

import { useState, useEffect, useCallback, useRef } from 'react'
import { GAME_W, GAME_H } from './constants'

// ---------------------------------------------------------------------------
// usePreventScroll — standalone hook for iOS Safari bounce / pull-to-refresh
// ---------------------------------------------------------------------------
export function usePreventScroll() {
  useEffect(() => {
    // Save originals
    const origOverflow = document.body.style.overflow
    const origPosition = document.body.style.position
    const origWidth = document.body.style.width

    // Lock body
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'

    // Block touchmove on the body to prevent pull-to-refresh
    const preventTouch = (e) => {
      // Only prevent default if the touch target is within the game area
      // (i.e. not a scrollable child like a modal or list)
      if (e.target.closest('[data-game-container]')) {
        e.preventDefault()
      }
    }

    document.addEventListener('touchmove', preventTouch, { passive: false })

    return () => {
      document.body.style.overflow = origOverflow
      document.body.style.position = origPosition
      document.body.style.width = origWidth
      document.removeEventListener('touchmove', preventTouch)
    }
  }, [])
}

// ---------------------------------------------------------------------------
// useGameScale — main hook: calculates scale + container style
// ---------------------------------------------------------------------------
export default function useGameScale() {
  const [scale, setScale] = useState(1)
  const debounceRef = useRef(null)

  const recalculate = useCallback(() => {
    const HUD_AND_CHROME = 120 // px reserved for HUD (36px) + footer (40px) + padding
    const availH = window.innerHeight - HUD_AND_CHROME
    const scaleH = availH / GAME_H
    const scaleW = window.innerWidth / GAME_W
    setScale(Math.min(scaleH, scaleW, 1.6)) // cap at 1.6x for large screens
  }, [])

  useEffect(() => {
    // Initial calculation
    recalculate()

    // Debounced handler for resize / orientation change
    const debouncedRecalc = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(recalculate, 150)
    }

    window.addEventListener('resize', debouncedRecalc)
    window.addEventListener('orientationchange', debouncedRecalc)

    return () => {
      window.removeEventListener('resize', debouncedRecalc)
      window.removeEventListener('orientationchange', debouncedRecalc)
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [recalculate])

  // Scroll & bounce prevention (body lock + touchmove)
  useEffect(() => {
    const origOverflow = document.body.style.overflow
    const origPosition = document.body.style.position
    const origWidth = document.body.style.width

    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'

    const preventTouch = (e) => {
      if (e.target.closest('[data-game-container]')) {
        e.preventDefault()
      }
    }

    document.addEventListener('touchmove', preventTouch, { passive: false })

    return () => {
      document.body.style.overflow = origOverflow
      document.body.style.position = origPosition
      document.body.style.width = origWidth
      document.removeEventListener('touchmove', preventTouch)
    }
  }, [])

  const containerStyle = {
    width: GAME_W,
    height: GAME_H,
    transform: `scale(${scale})`,
    transformOrigin: 'top center',
    position: 'relative',
    margin: '0 auto',
  }

  return { scale, containerStyle }
}
