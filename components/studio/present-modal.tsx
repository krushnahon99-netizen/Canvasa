'use client'

import * as React from 'react'
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ShapeRenderer } from './shape-renderer'
import { getFontCssFamily, IMAGE_FILTER_STYLES } from '@/lib/studio-presets'
import type { StudioPage } from '@/lib/studio-types'
import { cn } from '@/lib/utils'

interface PresentModalProps {
  pages: StudioPage[]
  width: number
  height: number
  initialIndex: number
  onClose: () => void
}

export function PresentModal({
  pages,
  width,
  height,
  initialIndex,
  onClose,
}: PresentModalProps) {
  const [index, setIndex] = React.useState(initialIndex)
  const stageRef = React.useRef<HTMLDivElement>(null)
  const [scale, setScale] = React.useState(0.5)

  React.useEffect(() => {
    const update = () => {
      const el = stageRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const s = Math.min((r.width - 48) / width, (r.height - 80) / height)
      setScale(Math.max(0.1, s))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [width, height])

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' || e.key === ' ') {
        setIndex((i) => Math.min(pages.length - 1, i + 1))
      }
      if (e.key === 'ArrowLeft') {
        setIndex((i) => Math.max(0, i - 1))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pages.length, onClose])

  const page = pages[index] ?? pages[0]

  return (
    <div
      ref={stageRef}
      role="dialog"
      aria-modal="true"
      aria-label="Presentation preview"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 text-white"
    >
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <span className="rounded-full bg-white/10 px-3 py-1 font-mono text-xs">
          {index + 1} / {pages.length}
        </span>
        <Button
          variant="secondary"
          size="icon-sm"
          onClick={onClose}
          aria-label="Exit presentation"
        >
          <XIcon />
        </Button>
      </div>

      <div
        className="relative overflow-hidden shadow-2xl"
        style={{
          width: `${Math.round(width * scale)}px`,
          height: `${Math.round(height * scale)}px`,
        }}
      >
        <div
          className="relative origin-top-left overflow-hidden"
          style={{
            width: `${width}px`,
            height: `${height}px`,
            transform: `scale(${scale})`,
            background: page.backgroundGradient || page.background,
          }}
        >
          {page.elements.map((el) => {
            if (!el.visible) return null
            return (
              <div
                key={el.id}
                style={{
                  position: 'absolute',
                  left: `${el.x}px`,
                  top: `${el.y}px`,
                  width: `${el.width}px`,
                  height: `${el.height}px`,
                  transform: el.rotation
                    ? `rotate(${el.rotation}deg)`
                    : undefined,
                  opacity: el.opacity / 100,
                }}
              >
                {el.type === 'shape' && <ShapeRenderer element={el} />}
                {el.type === 'image' && (
                  <img
                    src={el.src}
                    alt={el.alt}
                    className="size-full"
                    style={{
                      objectFit: el.objectFit,
                      borderRadius: el.archClip
                        ? '9999px 9999px 0 0'
                        : `${el.cornerRadius}px`,
                      filter: IMAGE_FILTER_STYLES[el.filterPreset].filter(
                        el.brightness,
                        el.contrast,
                        el.saturate
                      ),
                    }}
                  />
                )}
                {el.type === 'text' && (
                  <div
                    style={{
                      fontFamily: getFontCssFamily(el.fontFamily),
                      fontSize: `${el.fontSize}px`,
                      fontWeight: el.fontWeight,
                      fontStyle: el.fontStyle,
                      textDecoration: el.textDecoration,
                      textTransform: el.textTransform,
                      textAlign: el.textAlign,
                      color: el.color,
                      lineHeight: el.lineHeight,
                      letterSpacing: `${el.letterSpacing}em`,
                      backgroundColor: el.backgroundColor || undefined,
                      borderRadius: el.borderRadius
                        ? `${el.borderRadius}px`
                        : undefined,
                      paddingLeft: el.paddingX ? `${el.paddingX}px` : undefined,
                      paddingRight: el.paddingX ? `${el.paddingX}px` : undefined,
                      paddingTop: el.paddingY ? `${el.paddingY}px` : undefined,
                      paddingBottom: el.paddingY ? `${el.paddingY}px` : undefined,
                    }}
                    className={cn(
                      'size-full whitespace-pre-wrap break-words',
                      el.backgroundColor && 'flex items-center justify-center'
                    )}
                  >
                    {el.text}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {pages.length > 1 && (
        <div className="absolute bottom-4 flex items-center gap-2">
          <Button
            variant="secondary"
            size="icon-sm"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            aria-label="Previous slide"
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="secondary"
            size="icon-sm"
            disabled={index === pages.length - 1}
            onClick={() => setIndex((i) => Math.min(pages.length - 1, i + 1))}
            aria-label="Next slide"
          >
            <ChevronRightIcon />
          </Button>
        </div>
      )}
    </div>
  )
}
