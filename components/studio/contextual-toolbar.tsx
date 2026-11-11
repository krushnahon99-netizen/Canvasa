'use client'

import * as React from 'react'
import {
  AlignCenterIcon,
  AlignHorizontalJustifyCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  AlignVerticalJustifyCenterIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  BoldIcon,
  CaseUpperIcon,
  CopyIcon,
  GridIcon,
  ItalicIcon,
  LockIcon,
  MagnetIcon,
  MinusIcon,
  PaletteIcon,
  PlusIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  Trash2Icon,
  TypeIcon,
  UnderlineIcon,
  UnlockIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  IMAGE_FILTER_STYLES,
  STUDIO_COLOR_SWATCHES,
  STUDIO_FONTS,
  STUDIO_GRADIENTS,
} from '@/lib/studio-presets'
import type {
  ActiveSidebarTab,
  CanvasElement,
  FontKey,
  ImageFilterPreset,
  StudioPage,
} from '@/lib/studio-types'

interface ContextualToolbarProps {
  selectedElement: CanvasElement | null
  currentPage: StudioPage
  onUpdateElement: (id: string, patch: Partial<CanvasElement>) => void
  onDeleteElement: (id: string) => void
  onDuplicateElement: (id: string) => void
  onLayerMove: (id: string, direction: 'up' | 'down' | 'front' | 'back') => void
  onAlignOnCanvas: (id: string, axis: 'center-x' | 'center-y') => void
  onUpdatePageBackground: (bg: string, gradient?: string) => void
  snapEnabled: boolean
  onToggleSnap: () => void
  showGrid: boolean
  onToggleGrid: () => void
  onQuickAddText: () => void
  onOpenTab: (tab: ActiveSidebarTab) => void
}

export function ContextualToolbar({
  selectedElement,
  currentPage,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onLayerMove,
  onAlignOnCanvas,
  onUpdatePageBackground,
  snapEnabled,
  onToggleSnap,
  showGrid,
  onToggleGrid,
  onQuickAddText,
  onOpenTab,
}: ContextualToolbarProps) {
  if (!selectedElement) {
    return (
      <div className="flex h-10 shrink-0 items-center justify-between gap-2 overflow-x-auto border-b bg-background/95 px-2.5 md:px-4">
        <div className="flex items-center gap-1.5">
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 px-2 text-xs"
                />
              }
            >
              <span
                className="size-3.5 shrink-0 rounded-sm border shadow-2xs"
                style={{
                  background:
                    currentPage.backgroundGradient || currentPage.background,
                }}
              />
              <span>Background</span>
            </PopoverTrigger>
            <PopoverContent className="w-68" align="start">
              <PopoverHeader>
                <PopoverTitle>Canvas Background</PopoverTitle>
              </PopoverHeader>
              <div className="grid grid-cols-5 gap-1.5">
                {STUDIO_COLOR_SWATCHES.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    aria-label={`Set background ${hex}`}
                    onClick={() => onUpdatePageBackground(hex, undefined)}
                    className="size-8 rounded-md border transition-transform hover:scale-105"
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
              <Separator />
              <span className="text-xs font-medium text-muted-foreground">
                Studio Gradients
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {STUDIO_GRADIENTS.map((g) => (
                  <button
                    key={g.name}
                    type="button"
                    title={g.name}
                    onClick={() => onUpdatePageBackground(g.stops[0], g.value)}
                    className="h-7 rounded-md border transition-transform hover:scale-105"
                    style={{ background: g.value }}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="h-4" />

          <Button
            variant="ghost"
            size="sm"
            onClick={onQuickAddText}
            className="h-7 px-2 text-xs"
          >
            <TypeIcon data-icon="inline-start" />
            Add Text
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenTab('magic')}
            className="h-7 px-2 text-xs text-primary"
          >
            <SparklesIcon data-icon="inline-start" />
            Magic Design
          </Button>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant={snapEnabled ? 'secondary' : 'ghost'}
                  size="icon-sm"
                  onClick={onToggleSnap}
                  aria-label="Toggle smart snap guides"
                />
              }
            >
              <MagnetIcon />
            </TooltipTrigger>
            <TooltipContent>
              Smart Snap Guides ({snapEnabled ? 'On' : 'Off'})
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant={showGrid ? 'secondary' : 'ghost'}
                  size="icon-sm"
                  onClick={onToggleGrid}
                  aria-label="Toggle artboard grid"
                />
              }
            >
              <GridIcon />
            </TooltipTrigger>
            <TooltipContent>
              Artboard Thirds Grid ({showGrid ? 'On' : 'Off'})
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-10 shrink-0 items-center justify-between gap-1.5 overflow-x-auto border-b bg-background/95 px-2 md:px-4">
      <div className="flex shrink-0 items-center gap-1">
        {selectedElement.type === 'text' && (
          <>
            <Select
              value={selectedElement.fontFamily}
              onValueChange={(val) => {
                if (val) {
                  onUpdateElement(selectedElement.id, {
                    fontFamily: val as FontKey,
                  })
                }
              }}
            >
              <SelectTrigger className="h-7 w-32 text-xs md:w-38">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {STUDIO_FONTS.map((f) => (
                    <SelectItem key={f.key} value={f.key}>
                      <span style={{ fontFamily: f.cssFamily }}>{f.label}</span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <div className="flex items-center rounded-md border bg-background">
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-7 rounded-r-none"
                onClick={() =>
                  onUpdateElement(selectedElement.id, {
                    fontSize: Math.max(10, selectedElement.fontSize - 2),
                  })
                }
                aria-label="Decrease font size"
              >
                <MinusIcon />
              </Button>
              <span className="w-9 text-center font-mono text-xs tabular-nums">
                {selectedElement.fontSize}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-7 rounded-l-none"
                onClick={() =>
                  onUpdateElement(selectedElement.id, {
                    fontSize: Math.min(260, selectedElement.fontSize + 2),
                  })
                }
                aria-label="Increase font size"
              >
                <PlusIcon />
              </Button>
            </div>

            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon-sm"
                    className="size-7"
                    aria-label="Text color"
                  />
                }
              >
                <span
                  className="size-4 rounded-sm border"
                  style={{ backgroundColor: selectedElement.color }}
                />
              </PopoverTrigger>
              <PopoverContent className="w-64" align="start">
                <PopoverHeader>
                  <PopoverTitle>Text & Pill Color</PopoverTitle>
                </PopoverHeader>
                <div className="grid grid-cols-5 gap-1.5">
                  {STUDIO_COLOR_SWATCHES.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      aria-label={`Text color ${hex}`}
                      onClick={() =>
                        onUpdateElement(selectedElement.id, { color: hex })
                      }
                      className="size-7 rounded-md border transition-transform hover:scale-105"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
                <Input
                  value={selectedElement.color}
                  onChange={(e) =>
                    onUpdateElement(selectedElement.id, {
                      color: e.target.value,
                    })
                  }
                  className="h-7 font-mono text-xs"
                  aria-label="Hex text color"
                />
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Badge Fill
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() =>
                      onUpdateElement(selectedElement.id, {
                        backgroundColor: undefined,
                        paddingX: 0,
                        paddingY: 0,
                      })
                    }
                  >
                    Clear
                  </Button>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {STUDIO_COLOR_SWATCHES.slice(0, 10).map((hex) => (
                    <button
                      key={`bg-${hex}`}
                      type="button"
                      aria-label={`Text badge color ${hex}`}
                      onClick={() =>
                        onUpdateElement(selectedElement.id, {
                          backgroundColor: hex,
                          borderRadius: 999,
                          paddingX: 16,
                          paddingY: 8,
                        })
                      }
                      className="size-7 rounded-full border transition-transform hover:scale-105"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant={
                selectedElement.fontWeight >= 700 ? 'secondary' : 'ghost'
              }
              size="icon-sm"
              className="size-7"
              onClick={() =>
                onUpdateElement(selectedElement.id, {
                  fontWeight: selectedElement.fontWeight >= 700 ? 400 : 700,
                })
              }
              aria-label="Bold"
            >
              <BoldIcon />
            </Button>

            <Button
              variant={
                selectedElement.fontStyle === 'italic' ? 'secondary' : 'ghost'
              }
              size="icon-sm"
              className="size-7"
              onClick={() =>
                onUpdateElement(selectedElement.id, {
                  fontStyle:
                    selectedElement.fontStyle === 'italic'
                      ? 'normal'
                      : 'italic',
                })
              }
              aria-label="Italic"
            >
              <ItalicIcon />
            </Button>

            <Button
              variant={
                selectedElement.textDecoration === 'underline'
                  ? 'secondary'
                  : 'ghost'
              }
              size="icon-sm"
              className="hidden size-7 sm:inline-flex"
              onClick={() =>
                onUpdateElement(selectedElement.id, {
                  textDecoration:
                    selectedElement.textDecoration === 'underline'
                      ? 'none'
                      : 'underline',
                })
              }
              aria-label="Underline"
            >
              <UnderlineIcon />
            </Button>

            <Button
              variant={
                selectedElement.textTransform === 'uppercase'
                  ? 'secondary'
                  : 'ghost'
              }
              size="icon-sm"
              className="hidden size-7 sm:inline-flex"
              onClick={() =>
                onUpdateElement(selectedElement.id, {
                  textTransform:
                    selectedElement.textTransform === 'uppercase'
                      ? 'none'
                      : 'uppercase',
                })
              }
              aria-label="Uppercase"
            >
              <CaseUpperIcon />
            </Button>

            <Button
              variant="ghost"
              size="icon-sm"
              className="size-7"
              onClick={() => {
                const order: ('left' | 'center' | 'right')[] = [
                  'left',
                  'center',
                  'right',
                ]
                const next =
                  order[(order.indexOf(selectedElement.textAlign) + 1) % 3]
                onUpdateElement(selectedElement.id, { textAlign: next })
              }}
              aria-label="Cycle text alignment"
            >
              {selectedElement.textAlign === 'left' && <AlignLeftIcon />}
              {selectedElement.textAlign === 'center' && <AlignCenterIcon />}
              {selectedElement.textAlign === 'right' && <AlignRightIcon />}
            </Button>
          </>
        )}

        {selectedElement.type === 'shape' && (
          <>
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 px-2 text-xs"
                  />
                }
              >
                <span
                  className="size-3.5 rounded-sm border"
                  style={{
                    background:
                      selectedElement.gradient ||
                      (selectedElement.fill === 'transparent'
                        ? '#ffffff'
                        : selectedElement.fill),
                  }}
                />
                <span>Fill</span>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="start">
                <PopoverHeader>
                  <PopoverTitle>Shape Fill</PopoverTitle>
                </PopoverHeader>
                <div className="grid grid-cols-5 gap-1.5">
                  {STUDIO_COLOR_SWATCHES.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      aria-label={`Shape fill ${hex}`}
                      onClick={() =>
                        onUpdateElement(selectedElement.id, {
                          fill: hex,
                          gradient: undefined,
                        })
                      }
                      className="size-7 rounded-md border transition-transform hover:scale-105"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() =>
                    onUpdateElement(selectedElement.id, {
                      fill: 'transparent',
                      gradient: undefined,
                    })
                  }
                >
                  Transparent Fill
                </Button>
                <Separator />
                <span className="text-xs font-medium text-muted-foreground">
                  Gradients
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {STUDIO_GRADIENTS.map((g) => (
                    <button
                      key={g.name}
                      type="button"
                      title={g.name}
                      onClick={() =>
                        onUpdateElement(selectedElement.id, {
                          fill: g.stops[0],
                          gradient: g.value,
                        })
                      }
                      className="h-7 rounded-md border transition-transform hover:scale-105"
                      style={{ background: g.value }}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 px-2 text-xs"
                  />
                }
              >
                <PaletteIcon data-icon="inline-start" />
                <span>Border & Corners</span>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="start">
                <PopoverHeader>
                  <PopoverTitle>Stroke & Radius</PopoverTitle>
                </PopoverHeader>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Border Width</span>
                    <span className="font-mono">
                      {selectedElement.strokeWidth}px
                    </span>
                  </div>
                  <Slider
                    value={[selectedElement.strokeWidth]}
                    min={0}
                    max={24}
                    onValueChange={(val) => {
                      const next = Array.isArray(val) ? val[0] : val
                      onUpdateElement(selectedElement.id, { strokeWidth: next })
                    }}
                  />
                  <div className="grid grid-cols-5 gap-1.5 pt-1">
                    {STUDIO_COLOR_SWATCHES.slice(0, 10).map((hex) => (
                      <button
                        key={`stroke-${hex}`}
                        type="button"
                        aria-label={`Stroke color ${hex}`}
                        onClick={() =>
                          onUpdateElement(selectedElement.id, {
                            stroke: hex,
                            strokeWidth: Math.max(
                              2,
                              selectedElement.strokeWidth
                            ),
                          })
                        }
                        className="size-7 rounded-md border"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                  {selectedElement.shapeKind === 'rect' && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Corner Radius
                        </span>
                        <span className="font-mono">
                          {selectedElement.cornerRadius}px
                        </span>
                      </div>
                      <Slider
                        value={[selectedElement.cornerRadius]}
                        min={0}
                        max={240}
                        onValueChange={(val) => {
                          const next = Array.isArray(val) ? val[0] : val
                          onUpdateElement(selectedElement.id, {
                            cornerRadius: next,
                          })
                        }}
                      />
                    </>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </>
        )}

        {selectedElement.type === 'image' && (
          <>
            <Select
              value={selectedElement.filterPreset}
              onValueChange={(val) => {
                if (val) {
                  onUpdateElement(selectedElement.id, {
                    filterPreset: val as ImageFilterPreset,
                  })
                }
              }}
            >
              <SelectTrigger className="h-7 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {(
                    Object.keys(IMAGE_FILTER_STYLES) as ImageFilterPreset[]
                  ).map((key) => (
                    <SelectItem key={key} value={key}>
                      {IMAGE_FILTER_STYLES[key].label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                  />
                }
              >
                <SlidersHorizontalIcon data-icon="inline-start" />
                <span>Adjust</span>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="start">
                <PopoverHeader>
                  <PopoverTitle>Photo Adjustments</PopoverTitle>
                </PopoverHeader>
                <div className="flex flex-col gap-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Brightness</span>
                    <span className="font-mono">
                      {selectedElement.brightness}%
                    </span>
                  </div>
                  <Slider
                    value={[selectedElement.brightness]}
                    min={50}
                    max={150}
                    onValueChange={(v) =>
                      onUpdateElement(selectedElement.id, {
                        brightness: Array.isArray(v) ? v[0] : v,
                      })
                    }
                  />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contrast</span>
                    <span className="font-mono">
                      {selectedElement.contrast}%
                    </span>
                  </div>
                  <Slider
                    value={[selectedElement.contrast]}
                    min={50}
                    max={150}
                    onValueChange={(v) =>
                      onUpdateElement(selectedElement.id, {
                        contrast: Array.isArray(v) ? v[0] : v,
                      })
                    }
                  />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Saturation</span>
                    <span className="font-mono">
                      {selectedElement.saturate}%
                    </span>
                  </div>
                  <Slider
                    value={[selectedElement.saturate]}
                    min={0}
                    max={180}
                    onValueChange={(v) =>
                      onUpdateElement(selectedElement.id, {
                        saturate: Array.isArray(v) ? v[0] : v,
                      })
                    }
                  />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Corner Radius</span>
                    <span className="font-mono">
                      {selectedElement.cornerRadius}px
                    </span>
                  </div>
                  <Slider
                    value={[selectedElement.cornerRadius]}
                    min={0}
                    max={300}
                    onValueChange={(v) =>
                      onUpdateElement(selectedElement.id, {
                        cornerRadius: Array.isArray(v) ? v[0] : v,
                        archClip: false,
                      })
                    }
                  />
                  <Button
                    variant={selectedElement.archClip ? 'secondary' : 'outline'}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() =>
                      onUpdateElement(selectedElement.id, {
                        archClip: !selectedElement.archClip,
                      })
                    }
                  >
                    {selectedElement.archClip
                      ? 'Arch Frame Active'
                      : 'Mask as Arch Frame'}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <Popover>
          <PopoverTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 font-mono text-xs"
              />
            }
          >
            {selectedElement.opacity}%
          </PopoverTrigger>
          <PopoverContent className="w-52" align="end">
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex justify-between font-medium">
                <span>Transparency</span>
                <span className="font-mono">{selectedElement.opacity}%</span>
              </div>
              <Slider
                value={[selectedElement.opacity]}
                min={5}
                max={100}
                onValueChange={(v) =>
                  onUpdateElement(selectedElement.id, {
                    opacity: Array.isArray(v) ? v[0] : v,
                  })
                }
              />
            </div>
          </PopoverContent>
        </Popover>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="hidden size-7 lg:inline-flex"
                onClick={() => onAlignOnCanvas(selectedElement.id, 'center-x')}
                aria-label="Center horizontally"
              />
            }
          >
            <AlignHorizontalJustifyCenterIcon />
          </TooltipTrigger>
          <TooltipContent>Center Horizontally</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="hidden size-7 lg:inline-flex"
                onClick={() => onAlignOnCanvas(selectedElement.id, 'center-y')}
                aria-label="Center vertically"
              />
            }
          >
            <AlignVerticalJustifyCenterIcon />
          </TooltipTrigger>
          <TooltipContent>Center Vertically</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-7"
                onClick={() => onLayerMove(selectedElement.id, 'up')}
                aria-label="Bring forward"
              />
            }
          >
            <ArrowUpIcon />
          </TooltipTrigger>
          <TooltipContent>Bring Forward</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-7"
                onClick={() => onLayerMove(selectedElement.id, 'down')}
                aria-label="Send backward"
              />
            }
          >
            <ArrowDownIcon />
          </TooltipTrigger>
          <TooltipContent>Send Backward</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-7"
                onClick={() => onDuplicateElement(selectedElement.id)}
                aria-label="Duplicate element"
              />
            }
          >
            <CopyIcon />
          </TooltipTrigger>
          <TooltipContent>Duplicate (Ctrl+D)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant={selectedElement.locked ? 'secondary' : 'ghost'}
                size="icon-sm"
                className="size-7"
                onClick={() =>
                  onUpdateElement(selectedElement.id, {
                    locked: !selectedElement.locked,
                  })
                }
                aria-label={selectedElement.locked ? 'Unlock' : 'Lock'}
              />
            }
          >
            {selectedElement.locked ? <LockIcon /> : <UnlockIcon />}
          </TooltipTrigger>
          <TooltipContent>
            {selectedElement.locked ? 'Unlock Layer' : 'Lock Layer'}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-7 text-destructive hover:text-destructive"
                onClick={() => onDeleteElement(selectedElement.id)}
                aria-label="Delete element"
              />
            }
          >
            <Trash2Icon />
          </TooltipTrigger>
          <TooltipContent>Delete (Backspace)</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
