'use client'

import * as React from 'react'
import type { ShapeCanvasElement } from '@/lib/studio-types'

interface ShapeRendererProps {
  element: ShapeCanvasElement
}

export function ShapeRenderer({ element }: ShapeRendererProps) {
  const { shapeKind, fill, gradient, stroke, strokeWidth, cornerRadius, id } =
    element
  const gradId = `grad-${id}`

  const parseStops = (css?: string) => {
    if (!css) return null
    const matches = css.match(/#[0-9a-fA-F]{6}/g)
    return matches && matches.length >= 2 ? matches : null
  }

  const stops = parseStops(gradient)
  const resolvedFill = stops
    ? `url(#${gradId})`
    : fill === 'transparent'
      ? 'none'
      : fill
  const resolvedStroke =
    strokeWidth > 0 && stroke !== 'transparent' ? stroke : 'none'

  if (shapeKind === 'rect' || shapeKind === 'pill' || shapeKind === 'badge') {
    const radius =
      shapeKind === 'pill' || shapeKind === 'badge'
        ? 9999
        : cornerRadius
    return (
      <div
        className="pointer-events-none size-full select-none"
        style={{
          background: gradient || (fill === 'transparent' ? 'transparent' : fill),
          borderRadius: `${radius}px`,
          border:
            strokeWidth > 0 && stroke !== 'transparent'
              ? `${strokeWidth}px solid ${stroke}`
              : undefined,
        }}
      />
    )
  }

  if (shapeKind === 'line') {
    const thickness = Math.max(2, Math.min(element.height, strokeWidth || 4))
    return (
      <div className="pointer-events-none flex size-full items-center select-none">
        <div
          className="w-full rounded-full"
          style={{
            height: `${thickness}px`,
            background: gradient || fill || stroke || '#0F172A',
          }}
        />
      </div>
    )
  }

  return (
    <svg
      viewBox="0 0 200 200"
      preserveAspectRatio="none"
      className="pointer-events-none size-full overflow-visible select-none"
      aria-hidden="true"
    >
      {stops && (
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            {stops.map((hex, i) => (
              <stop
                key={`${hex}-${i}`}
                offset={`${(i / (stops.length - 1)) * 100}%`}
                stopColor={hex}
              />
            ))}
          </linearGradient>
        </defs>
      )}

      {shapeKind === 'circle' && (
        <ellipse
          cx="100"
          cy="100"
          rx={100 - strokeWidth / 2}
          ry={100 - strokeWidth / 2}
          fill={resolvedFill}
          stroke={resolvedStroke}
          strokeWidth={strokeWidth}
          vectorEffect="non-scaling-stroke"
        />
      )}

      {shapeKind === 'arch' && (
        <path
          d="M 4,100 A 96,96 0 0,1 196,100 L 196,198 L 4,198 Z"
          fill={resolvedFill}
          stroke={resolvedStroke}
          strokeWidth={strokeWidth}
          vectorEffect="non-scaling-stroke"
        />
      )}

      {shapeKind === 'triangle' && (
        <polygon
          points="100,4 196,196 4,196"
          fill={resolvedFill}
          stroke={resolvedStroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      )}

      {shapeKind === 'diamond' && (
        <polygon
          points="100,4 196,100 100,196 4,100"
          fill={resolvedFill}
          stroke={resolvedStroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      )}

      {shapeKind === 'star' && (
        <polygon
          points="100,6 124,72 195,74 139,117 159,185 100,145 41,185 61,117 5,74 76,72"
          fill={resolvedFill}
          stroke={resolvedStroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      )}

      {shapeKind === 'burst' && (
        <polygon
          points={Array.from({ length: 24 }, (_, i) => {
            const r = i % 2 === 0 ? 96 : 70
            const angle = (i * Math.PI) / 12 - Math.PI / 2
            const x = 100 + Math.cos(angle) * r
            const y = 100 + Math.sin(angle) * r
            return `${x.toFixed(1)},${y.toFixed(1)}`
          }).join(' ')}
          fill={resolvedFill}
          stroke={resolvedStroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  )
}
