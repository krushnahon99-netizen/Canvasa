'use client'

import * as React from 'react'
import {
  CopyIcon,
  LayoutGridIcon,
  MinusIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { StudioPage } from '@/lib/studio-types'
import { cn } from '@/lib/utils'

interface BottomPageBarProps {
  pages: StudioPage[]
  activePageIndex: number
  onSelectPage: (index: number) => void
  onAddPage: () => void
  onDuplicatePage: (index: number) => void
  onDeletePage: (index: number) => void
  zoom: number
  isAutoFit: boolean
  onZoomChange: (zoom: number) => void
  onResetFit: () => void
  isGridView: boolean
  onToggleGridView: () => void
}

export function BottomPageBar({
  pages,
  activePageIndex,
  onSelectPage,
  onAddPage,
  onDuplicatePage,
  onDeletePage,
  zoom,
  isAutoFit,
  onZoomChange,
  onResetFit,
  isGridView,
  onToggleGridView,
}: BottomPageBarProps) {
  const zoomPercent = Math.round(zoom * 100)

  return (
    <footer className="flex h-10 shrink-0 items-center justify-between gap-2 border-t bg-card px-2.5 md:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
        {pages.map((p, idx) => {
          const isActive = idx === activePageIndex
          return (
            <div key={p.id} className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                onClick={() => onSelectPage(idx)}
                className={cn(
                  'flex h-7 items-center gap-1.5 rounded-md border px-2 text-xs font-medium transition-colors',
                  isActive
                    ? 'border-primary bg-accent text-accent-foreground'
                    : 'bg-background text-muted-foreground hover:text-foreground'
                )}
              >
                <span
                  className="size-3 rounded-[3px] border"
                  style={{
                    background: p.backgroundGradient || p.background,
                  }}
                />
                <span>Page {idx + 1}</span>
              </button>
            </div>
          )
        })}

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="icon-sm"
                className="size-7 shrink-0"
                onClick={onAddPage}
                aria-label="Add blank page"
              />
            }
          >
            <PlusIcon />
          </TooltipTrigger>
          <TooltipContent>Add Blank Page</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="hidden size-7 shrink-0 sm:inline-flex"
                onClick={() => onDuplicatePage(activePageIndex)}
                aria-label="Duplicate current page"
              />
            }
          >
            <CopyIcon />
          </TooltipTrigger>
          <TooltipContent>Duplicate Page</TooltipContent>
        </Tooltip>

        {pages.length > 1 && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="hidden size-7 shrink-0 text-muted-foreground hover:text-destructive sm:inline-flex"
                  onClick={() => onDeletePage(activePageIndex)}
                  aria-label="Delete current page"
                />
              }
            >
              <Trash2Icon />
            </TooltipTrigger>
            <TooltipContent>Delete Page</TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant={isGridView ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={onToggleGridView}
              />
            }
          >
            <LayoutGridIcon data-icon="inline-start" />
            <span className="hidden sm:inline">Pages ({pages.length})</span>
          </TooltipTrigger>
          <TooltipContent>Page Sorter Grid</TooltipContent>
        </Tooltip>

        <div className="hidden w-24 items-center md:flex">
          <Slider
            value={[zoomPercent]}
            min={20}
            max={180}
            onValueChange={(v) => {
              const next = Array.isArray(v) ? v[0] : v
              onZoomChange(next / 100)
            }}
          />
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          className="size-7 md:hidden"
          onClick={() => onZoomChange(Math.max(0.2, zoom - 0.1))}
          aria-label="Zoom out"
        >
          <MinusIcon />
        </Button>

        <Button
          variant={isAutoFit ? 'secondary' : 'outline'}
          size="sm"
          className="h-7 px-2 font-mono text-xs tabular-nums"
          onClick={onResetFit}
          title="Click to Fit to Screen"
        >
          {isAutoFit ? `Fit ${zoomPercent}%` : `${zoomPercent}%`}
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          className="size-7 md:hidden"
          onClick={() => onZoomChange(Math.min(1.8, zoom + 0.1))}
          aria-label="Zoom in"
        >
          <PlusIcon />
        </Button>
      </div>
    </footer>
  )
}
