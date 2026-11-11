'use client'

import * as React from 'react'
import {
  CheckIcon,
  ChevronDownIcon,
  DownloadIcon,
  FileCodeIcon,
  FileJsonIcon,
  ImageIcon,
  LayersIcon,
  PlayIcon,
  Redo2Icon,
  Undo2Icon,
  UploadIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { CANVAS_SIZE_PRESETS } from '@/lib/studio-presets'
import type { CanvasSizePreset } from '@/lib/studio-types'

interface TopHeaderProps {
  title: string
  onTitleChange: (title: string) => void
  presetId: string
  width: number
  height: number
  onResizePreset: (preset: CanvasSizePreset) => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onPresent: () => void
  onExportPng: () => void
  onExportSvg: () => void
  onExportJson: () => void
  onImportJsonFile: (file: File) => void
  isExporting: boolean
}

export function TopHeader({
  title,
  onTitleChange,
  presetId,
  width,
  height,
  onResizePreset,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onPresent,
  onExportPng,
  onExportSvg,
  onExportJson,
  onImportJsonFile,
  isExporting,
}: TopHeaderProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const activePreset = CANVAS_SIZE_PRESETS.find((p) => p.id === presetId)

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b bg-card px-2.5 md:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex items-center gap-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            <LayersIcon className="size-4" />
          </div>
          <span className="hidden text-sm font-bold tracking-tight sm:inline">
            Canvasa
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 px-2 text-xs font-medium"
              />
            }
          >
            <span className="max-w-24 truncate sm:max-w-36">
              {activePreset ? activePreset.name : `${width}×${height}`}
            </span>
            <span className="hidden text-muted-foreground lg:inline">
              {width}×{height}
            </span>
            <ChevronDownIcon data-icon="inline-end" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-60" align="start">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Resize Artboard</DropdownMenuLabel>
              {CANVAS_SIZE_PRESETS.map((preset) => (
                <DropdownMenuItem
                  key={preset.id}
                  onClick={() => onResizePreset(preset)}
                  className="flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{preset.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {preset.width} × {preset.height} px
                    </span>
                  </div>
                  {preset.id === presetId && (
                    <CheckIcon className="size-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={!canUndo}
                  onClick={onUndo}
                  aria-label="Undo"
                />
              }
            >
              <Undo2Icon />
            </TooltipTrigger>
            <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={!canRedo}
                  onClick={onRedo}
                  aria-label="Redo"
                />
              }
            >
              <Redo2Icon />
            </TooltipTrigger>
            <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="hidden max-w-60 flex-1 md:flex">
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          aria-label="Project title"
          className="h-7 border-transparent bg-transparent text-center text-xs font-medium hover:border-border focus-visible:bg-background"
        />
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={onPresent}
          className="hidden h-7 sm:inline-flex"
        >
          <PlayIcon data-icon="inline-start" />
          Present
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onImportJsonFile(f)
            e.target.value = ''
          }}
        />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button size="sm" className="h-7" disabled={isExporting} />
            }
          >
            <DownloadIcon data-icon="inline-start" />
            <span>{isExporting ? 'Exporting...' : 'Share / Export'}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Download Current Page</DropdownMenuLabel>
              <DropdownMenuItem onClick={onExportPng}>
                <ImageIcon />
                <div className="flex flex-col">
                  <span>PNG Image (High-Res)</span>
                  <span className="text-[11px] text-muted-foreground">
                    {width} × {height} px raster
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportSvg}>
                <FileCodeIcon />
                <div className="flex flex-col">
                  <span>SVG Vector</span>
                  <span className="text-[11px] text-muted-foreground">
                    Scalable vector markup
                  </span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Project File</DropdownMenuLabel>
              <DropdownMenuItem onClick={onExportJson}>
                <FileJsonIcon />
                <span>Save Project (.json)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <UploadIcon />
                <span>Open Project (.json)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onPresent} className="sm:hidden">
                <PlayIcon />
                <span>Present Slides</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
