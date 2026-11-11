'use client'

import * as React from 'react'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  EyeIcon,
  EyeOffIcon,
  ImagePlusIcon,
  LockIcon,
  PanelLeftCloseIcon,
  PlusIcon,
  SparklesIcon,
  Trash2Icon,
  UnlockIcon,
  WandSparklesIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { ShapeRenderer } from './shape-renderer'
import {
  createElementId,
  getFontCssFamily,
  STUDIO_COLOR_SWATCHES,
  STUDIO_GRADIENTS,
  STUDIO_PHOTOS,
  STUDIO_TEMPLATES,
  TYPOGRAPHY_LOCKUPS,
} from '@/lib/studio-presets'
import type {
  ActiveSidebarTab,
  CanvasElement,
  ShapeKind,
  StudioPage,
  StudioTemplate,
} from '@/lib/studio-types'
import { cn } from '@/lib/utils'

interface AssetPanelProps {
  activeTab: ActiveSidebarTab
  currentPage: StudioPage
  canvasWidth: number
  canvasHeight: number
  selectedElement: CanvasElement | null
  onClosePanel: () => void
  onApplyTemplate: (template: StudioTemplate, asNewPage: boolean) => void
  onAddElements: (elements: CanvasElement[]) => void
  onAddShape: (kind: ShapeKind, fill?: string) => void
  onAddTextPreset: (preset: 'heading' | 'subheading' | 'body' | 'pill') => void
  onAddPhoto: (src: string, title: string) => void
  onUpdatePageBackground: (bg: string, gradient?: string) => void
  onSelectElement: (id: string) => void
  onUpdateElement: (id: string, patch: Partial<CanvasElement>) => void
  onDeleteElement: (id: string) => void
  onLayerMove: (id: string, direction: 'up' | 'down' | 'front' | 'back') => void
  onApplyAiDesign: (payload: {
    pageTitle: string
    background: string
    elements: CanvasElement[]
  }) => void
}

const SHAPE_LIBRARY: {
  kind: ShapeKind
  label: string
  defaultFill: string
}[] = [
  { kind: 'rect', label: 'Rounded Card', defaultFill: '#4F46E5' },
  { kind: 'circle', label: 'Circle', defaultFill: '#EA580C' },
  { kind: 'pill', label: 'Pill Capsule', defaultFill: '#0F172A' },
  { kind: 'arch', label: 'Editorial Arch', defaultFill: '#D97706' },
  { kind: 'star', label: '5-Point Star', defaultFill: '#E11D48' },
  { kind: 'burst', label: 'Promo Sunburst', defaultFill: '#059669' },
  { kind: 'triangle', label: 'Triangle', defaultFill: '#2563EB' },
  { kind: 'diamond', label: 'Diamond', defaultFill: '#6D28D9' },
  { kind: 'line', label: 'Divider Line', defaultFill: '#0F172A' },
]

const MAGIC_STARTER_PROMPTS = [
  'Artisan sourdough bakery weekend pop-up in Copenhagen, warm linen & terracotta',
  'Minimalist AI developer conference keynote slide, deep midnight indigo & electric cyan',
  'Summer rooftop vinyl DJ session poster, bold retro typography & sunset coral',
]

export function AssetPanel({
  activeTab,
  currentPage,
  canvasWidth,
  canvasHeight,
  selectedElement,
  onClosePanel,
  onApplyTemplate,
  onAddElements,
  onAddShape,
  onAddTextPreset,
  onAddPhoto,
  onUpdatePageBackground,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  onLayerMove,
  onApplyAiDesign,
}: AssetPanelProps) {
  const uploadInputRef = React.useRef<HTMLInputElement>(null)
  const [templateFilter, setTemplateFilter] = React.useState<string>('All')
  const [magicPrompt, setMagicPrompt] = React.useState('')
  const [isGeneratingDesign, setIsGeneratingDesign] = React.useState(false)
  const [isRewriting, setIsRewriting] = React.useState(false)
  const [rewriteTone, setRewriteTone] = React.useState<string>('punchy')
  const [rewriteResults, setRewriteResults] = React.useState<
    { label: string; text: string }[]
  >([])

  const filteredTemplates = React.useMemo(() => {
    if (templateFilter === 'All') return STUDIO_TEMPLATES
    return STUDIO_TEMPLATES.filter((t) => t.category === templateFilter)
  }, [templateFilter])

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onAddPhoto(reader.result, file.name.replace(/\.[^.]+$/, ''))
        toast.success('Uploaded image added to canvas')
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleGenerateMagicDesign = async () => {
    const cleanPrompt = magicPrompt.trim()
    if (!cleanPrompt) {
      toast.error('Describe the poster, slide, or social post you want first.')
      return
    }
    setIsGeneratingDesign(true)
    try {
      const res = await fetch('/api/magic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'design',
          prompt: cleanPrompt,
          width: canvasWidth,
          height: canvasHeight,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.design) {
        throw new Error(data.error || 'Magic Design failed')
      }
      const d = data.design
      const w = canvasWidth
      const h = canvasHeight
      const minDim = Math.min(w, h)

      const generatedElements: CanvasElement[] = [
        {
          id: createElementId('shape'),
          type: 'shape',
          name: 'Accent Backdrop Circle',
          shapeKind: d.layoutStyle === 'poster-bold' ? 'burst' : 'circle',
          x: Math.round(w * 0.62),
          y: Math.round(h * 0.08),
          width: Math.round(minDim * 0.34),
          height: Math.round(minDim * 0.34),
          rotation: -8,
          opacity: 90,
          locked: false,
          visible: true,
          fill: d.accentColor,
          stroke: 'transparent',
          strokeWidth: 0,
          cornerRadius: 0,
        },
        {
          id: createElementId('shape'),
          type: 'shape',
          name: 'Frame Border',
          shapeKind: 'rect',
          x: Math.round(w * 0.05),
          y: Math.round(h * 0.05),
          width: Math.round(w * 0.9),
          height: Math.round(h * 0.9),
          rotation: 0,
          opacity: 30,
          locked: false,
          visible: true,
          fill: 'transparent',
          stroke: d.secondaryShapeColor,
          strokeWidth: 2,
          cornerRadius: 28,
        },
        {
          id: createElementId('text'),
          type: 'text',
          name: 'AI Kicker Pill',
          x:
            d.layoutStyle === 'editorial-centered'
              ? Math.round(w * 0.5 - minDim * 0.16)
              : Math.round(w * 0.09),
          y: Math.round(h * 0.14),
          width: Math.round(minDim * 0.32),
          height: Math.round(minDim * 0.048),
          rotation: 0,
          opacity: 100,
          locked: false,
          visible: true,
          text: d.kicker,
          fontFamily: 'jetbrains',
          fontSize: Math.max(14, Math.round(minDim * 0.017)),
          fontWeight: 600,
          fontStyle: 'normal',
          textDecoration: 'none',
          textTransform: 'uppercase',
          textAlign: 'center',
          color: d.kickerColor,
          backgroundColor: d.kickerBg,
          borderRadius: 999,
          paddingX: 16,
          paddingY: 8,
          lineHeight: 1.2,
          letterSpacing: 0.12,
        },
        {
          id: createElementId('text'),
          type: 'text',
          name: 'AI Headline',
          x: Math.round(w * 0.09),
          y: Math.round(h * 0.3),
          width: Math.round(w * 0.82),
          height: Math.round(h * 0.28),
          rotation: 0,
          opacity: 100,
          locked: false,
          visible: true,
          text: d.headline,
          fontFamily: d.headlineFont,
          fontSize: Math.max(32, Math.round(minDim * 0.082)),
          fontWeight: 800,
          fontStyle: 'normal',
          textDecoration: 'none',
          textTransform: d.headlineFont === 'syne' ? 'uppercase' : 'none',
          textAlign: d.layoutStyle === 'editorial-centered' ? 'center' : 'left',
          color: d.headlineColor,
          lineHeight: 1.04,
          letterSpacing: -0.02,
        },
        {
          id: createElementId('text'),
          type: 'text',
          name: 'AI Subheadline',
          x:
            d.layoutStyle === 'editorial-centered'
              ? Math.round(w * 0.16)
              : Math.round(w * 0.09),
          y: Math.round(h * 0.62),
          width: Math.round(w * (d.layoutStyle === 'editorial-centered' ? 0.68 : 0.72)),
          height: Math.round(h * 0.14),
          rotation: 0,
          opacity: 90,
          locked: false,
          visible: true,
          text: d.subheadline,
          fontFamily: 'jakarta',
          fontSize: Math.max(16, Math.round(minDim * 0.024)),
          fontWeight: 500,
          fontStyle: 'normal',
          textDecoration: 'none',
          textTransform: 'none',
          textAlign: d.layoutStyle === 'editorial-centered' ? 'center' : 'left',
          color: d.subheadlineColor,
          lineHeight: 1.42,
          letterSpacing: 0,
        },
        {
          id: createElementId('text'),
          type: 'text',
          name: 'AI Action Pill',
          x:
            d.layoutStyle === 'editorial-centered'
              ? Math.round(w * 0.5 - minDim * 0.14)
              : Math.round(w * 0.09),
          y: Math.round(h * 0.81),
          width: Math.round(minDim * 0.28),
          height: Math.round(minDim * 0.056),
          rotation: 0,
          opacity: 100,
          locked: false,
          visible: true,
          text: d.ctaText,
          fontFamily: 'jakarta',
          fontSize: Math.max(15, Math.round(minDim * 0.019)),
          fontWeight: 700,
          fontStyle: 'normal',
          textDecoration: 'none',
          textTransform: 'uppercase',
          textAlign: 'center',
          color: d.kickerColor,
          backgroundColor: d.accentColor,
          borderRadius: 999,
          paddingX: 20,
          paddingY: 12,
          lineHeight: 1.2,
          letterSpacing: 0.08,
        },
      ]

      onApplyAiDesign({
        pageTitle: d.pageTitle,
        background: d.background,
        elements: generatedElements,
      })
      toast.success('Magic Design generated on artboard')
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not generate layout'
      )
    } finally {
      setIsGeneratingDesign(false)
    }
  }

  const handleMagicRewrite = async () => {
    if (!selectedElement || selectedElement.type !== 'text') return
    setIsRewriting(true)
    try {
      const res = await fetch('/api/magic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'rewrite',
          text: selectedElement.text,
          tone: rewriteTone,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.variations) {
        throw new Error(data.error || 'Magic Write failed')
      }
      setRewriteResults(data.variations)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Magic Write failed')
    } finally {
      setIsRewriting(false)
    }
  }

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex h-11 shrink-0 items-center justify-between border-b px-3.5">
        <span className="text-xs font-semibold tracking-wide uppercase text-foreground">
          {activeTab === 'templates' && 'Templates'}
          {activeTab === 'magic' && 'Magic Studio AI'}
          {activeTab === 'elements' && 'Shapes & Elements'}
          {activeTab === 'text' && 'Typography'}
          {activeTab === 'photos' && 'Studio Photos & Uploads'}
          {activeTab === 'background' && 'Canvas Backdrop'}
          {activeTab === 'layers' && `Layers (${currentPage.elements.length})`}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClosePanel}
          className="hidden size-7 md:inline-flex"
          aria-label="Collapse tool drawer"
        >
          <PanelLeftCloseIcon />
        </Button>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-3.5 p-3.5">
          {activeTab === 'templates' && (
            <>
              <div className="flex flex-wrap gap-1">
                {['All', 'Social', 'Presentation', 'Poster', 'Brand'].map(
                  (cat) => (
                    <Button
                      key={cat}
                      variant={templateFilter === cat ? 'default' : 'secondary'}
                      size="sm"
                      className="h-6 px-2.5 text-[11px]"
                      onClick={() => setTemplateFilter(cat)}
                    >
                      {cat}
                    </Button>
                  )
                )}
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {filteredTemplates.map((tpl) => {
                  const previewImg = tpl.elements.find(
                    (el) => el.type === 'image'
                  )
                  const previewHeading = tpl.elements.find(
                    (el) => el.type === 'text' && el.fontSize >= 50
                  )
                  return (
                    <div
                      key={tpl.id}
                      className="group flex flex-col overflow-hidden rounded-xl border bg-background transition-all hover:border-primary/50 hover:shadow-sm"
                    >
                      <button
                        type="button"
                        onClick={() => onApplyTemplate(tpl, false)}
                        className="relative flex h-28 w-full items-end justify-between gap-2 overflow-hidden p-3 text-left"
                        style={{
                          background: tpl.backgroundGradient || tpl.background,
                        }}
                      >
                        <div
                          className="pointer-events-none absolute -top-5 -right-5 size-24 rounded-full opacity-25 transition-transform group-hover:scale-110"
                          style={{ backgroundColor: tpl.accent }}
                        />
                        {previewImg && previewImg.type === 'image' && (
                          <img
                            src={previewImg.src}
                            alt=""
                            className="pointer-events-none absolute top-2.5 right-2.5 h-22 w-20 rounded-lg object-cover shadow-xs transition-transform duration-300 group-hover:scale-105"
                          />
                        )}
                        <div className="relative z-10 flex max-w-[62%] flex-col gap-1.5">
                          {previewHeading && previewHeading.type === 'text' && (
                            <span
                              className="line-clamp-2 text-sm leading-tight font-bold tracking-tight"
                              style={{ color: previewHeading.color }}
                            >
                              {previewHeading.text.replace(/\n/g, ' ')}
                            </span>
                          )}
                          <Badge
                            variant="secondary"
                            className="w-fit bg-background/90 text-[10px] backdrop-blur-xs"
                          >
                            {tpl.category}
                          </Badge>
                        </div>
                      </button>
                      <div className="flex items-center justify-between gap-2 px-3 py-2">
                        <span className="truncate text-xs font-medium">
                          {tpl.name}
                        </span>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[11px]"
                            onClick={() => onApplyTemplate(tpl, false)}
                          >
                            Replace
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-6 px-2 text-[11px]"
                            onClick={() => onApplyTemplate(tpl, true)}
                          >
                            + Page
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {activeTab === 'magic' && (
            <>
              <div className="flex flex-col gap-2.5 rounded-xl border bg-accent/40 p-3">
                <div className="flex items-center gap-1.5">
                  <SparklesIcon className="size-4 text-primary" />
                  <span className="text-xs font-semibold">
                    Magic Design Layout
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Describe an event poster, pitch slide, or social card and AI
                  will compose editable layers directly on your canvas.
                </p>
                <Textarea
                  value={magicPrompt}
                  onChange={(e) => setMagicPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.nativeEvent.isComposing || e.keyCode === 229) return
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault()
                      handleGenerateMagicDesign()
                    }
                  }}
                  placeholder="e.g. Tokyo specialty coffee tasting workshop poster, warm minimalist cream & espresso palette..."
                  className="min-h-22 bg-background text-xs"
                />
                <Button
                  size="sm"
                  disabled={isGeneratingDesign}
                  onClick={handleGenerateMagicDesign}
                  className="w-full"
                >
                  {isGeneratingDesign ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    <WandSparklesIcon data-icon="inline-start" />
                  )}
                  {isGeneratingDesign
                    ? 'Composing Layout...'
                    : 'Generate Editable Design'}
                </Button>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Try an idea
                </span>
                {MAGIC_STARTER_PROMPTS.map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => setMagicPrompt(sample)}
                    className="rounded-lg border bg-background p-2 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    {sample}
                  </button>
                ))}
              </div>

              <Separator />

              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold">Magic Write Copy</span>
                {selectedElement?.type === 'text' ? (
                  <>
                    <div className="flex flex-wrap gap-1">
                      {['punchy', 'editorial', 'luxury', 'playful'].map(
                        (tone) => (
                          <Button
                            key={tone}
                            variant={
                              rewriteTone === tone ? 'default' : 'outline'
                            }
                            size="sm"
                            className="h-6 px-2 text-[11px] capitalize"
                            onClick={() => setRewriteTone(tone)}
                          >
                            {tone}
                          </Button>
                        )
                      )}
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={isRewriting}
                      onClick={handleMagicRewrite}
                    >
                      {isRewriting ? (
                        <Spinner data-icon="inline-start" />
                      ) : (
                        <SparklesIcon data-icon="inline-start" />
                      )}
                      Rewrite Selected Text
                    </Button>
                    {rewriteResults.map((item, idx) => (
                      <button
                        key={`${item.label}-${idx}`}
                        type="button"
                        onClick={() => {
                          onUpdateElement(selectedElement.id, {
                            text: item.text,
                          })
                          toast.success('Updated text layer')
                        }}
                        className="flex flex-col gap-0.5 rounded-lg border bg-background p-2.5 text-left transition-colors hover:border-primary"
                      >
                        <span className="text-[10px] font-semibold uppercase text-primary">
                          {item.label}
                        </span>
                        <span className="text-xs">{item.text}</span>
                      </button>
                    ))}
                  </>
                ) : (
                  <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                    Select any text layer on the canvas to rewrite headlines or
                    body copy with AI.
                  </p>
                )}
              </div>
            </>
          )}

          {activeTab === 'elements' && (
            <>
              <span className="text-[11px] font-medium text-muted-foreground">
                Geometric & Vector Shapes
              </span>
              <div className="grid grid-cols-3 gap-2">
                {SHAPE_LIBRARY.map((item) => (
                  <button
                    key={item.kind}
                    type="button"
                    onClick={() => onAddShape(item.kind, item.defaultFill)}
                    className="flex flex-col items-center gap-1.5 rounded-xl border bg-background p-2.5 transition-all hover:border-primary/50 hover:bg-accent/40"
                  >
                    <div className="flex size-11 items-center justify-center p-1">
                      <ShapeRenderer
                        element={{
                          id: `preview-${item.kind}`,
                          type: 'shape',
                          name: item.label,
                          shapeKind: item.kind,
                          x: 0,
                          y: 0,
                          width: 44,
                          height: item.kind === 'line' ? 8 : 44,
                          rotation: 0,
                          opacity: 100,
                          locked: false,
                          visible: true,
                          fill: item.defaultFill,
                          stroke: 'transparent',
                          strokeWidth: 0,
                          cornerRadius: 8,
                        }}
                      />
                    </div>
                    <span className="truncate text-[10px] font-medium">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>

              <Separator />

              <span className="text-[11px] font-medium text-muted-foreground">
                Editorial Accent Stickers
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    label: 'NEW DROP',
                    bg: '#4F46E5',
                    fg: '#FFFFFF',
                  },
                  {
                    label: 'LIMITED EDITION',
                    bg: '#111827',
                    fg: '#F8FAFC',
                  },
                  {
                    label: 'RSVP TODAY',
                    bg: '#EA580C',
                    fg: '#FFFFFF',
                  },
                  {
                    label: 'STUDIO PICK',
                    bg: '#059669',
                    fg: '#FFFFFF',
                  },
                ].map((pill) => (
                  <button
                    key={pill.label}
                    type="button"
                    onClick={() =>
                      onAddElements([
                        {
                          id: createElementId('text'),
                          type: 'text',
                          name: `Badge ${pill.label}`,
                          x: Math.round(canvasWidth / 2 - 130),
                          y: Math.round(canvasHeight / 2 - 24),
                          width: 260,
                          height: 48,
                          rotation: 0,
                          opacity: 100,
                          locked: false,
                          visible: true,
                          text: pill.label,
                          fontFamily: 'jetbrains',
                          fontSize: 18,
                          fontWeight: 700,
                          fontStyle: 'normal',
                          textDecoration: 'none',
                          textTransform: 'uppercase',
                          textAlign: 'center',
                          color: pill.fg,
                          backgroundColor: pill.bg,
                          borderRadius: 999,
                          paddingX: 18,
                          paddingY: 12,
                          lineHeight: 1.2,
                          letterSpacing: 0.1,
                        },
                      ])
                    }
                    className="rounded-full py-2 text-center font-mono text-[10px] font-bold tracking-wider transition-transform hover:scale-[1.02]"
                    style={{ backgroundColor: pill.bg, color: pill.fg }}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {activeTab === 'text' && (
            <>
              <div className="flex flex-col gap-2">
                <Button
                  variant="default"
                  className="h-10 justify-start font-bold"
                  onClick={() => onAddTextPreset('heading')}
                >
                  <PlusIcon data-icon="inline-start" />
                  Add a Heading
                </Button>
                <Button
                  variant="secondary"
                  className="h-9 justify-start font-medium"
                  onClick={() => onAddTextPreset('subheading')}
                >
                  <PlusIcon data-icon="inline-start" />
                  Add a Subheading
                </Button>
                <Button
                  variant="outline"
                  className="h-8 justify-start text-xs"
                  onClick={() => onAddTextPreset('body')}
                >
                  <PlusIcon data-icon="inline-start" />
                  Add a little bit of body text
                </Button>
              </div>

              <Separator />

              <span className="text-[11px] font-medium text-muted-foreground">
                Curated Font Combinations
              </span>
              <div className="flex flex-col gap-2">
                {TYPOGRAPHY_LOCKUPS.map((lockup) => (
                  <button
                    key={lockup.id}
                    type="button"
                    onClick={() => {
                      const items = lockup
                        .create(
                          Math.round(canvasWidth / 2),
                          Math.round(canvasHeight / 2)
                        )
                        .map((item) => ({
                          ...item,
                          id: createElementId('text'),
                        })) as CanvasElement[]
                      onAddElements(items)
                    }}
                    className="flex flex-col gap-1 rounded-xl border bg-background p-3 text-left transition-all hover:border-primary/50 hover:bg-accent/30"
                  >
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {lockup.previewSub}
                    </span>
                    <span
                      className="text-xl font-bold leading-tight text-foreground"
                      style={{
                        fontFamily: getFontCssFamily(lockup.fontPreview),
                      }}
                    >
                      {lockup.previewTitle}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {activeTab === 'photos' && (
            <>
              <input
                ref={uploadInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleUploadImage}
              />
              <Button
                variant="default"
                onClick={() => uploadInputRef.current?.click()}
                className="w-full"
              >
                <ImagePlusIcon data-icon="inline-start" />
                Upload Image from Device
              </Button>

              <Separator />

              <span className="text-[11px] font-medium text-muted-foreground">
                Studio Photography Library
              </span>
              <div className="grid grid-cols-2 gap-2">
                {STUDIO_PHOTOS.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => onAddPhoto(photo.src, photo.title)}
                    className="group relative flex flex-col overflow-hidden rounded-xl border bg-muted text-left transition-all hover:border-primary"
                  >
                    <img
                      src={photo.src}
                      alt={photo.title}
                      className="aspect-square w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                    <div className="bg-card px-2 py-1.5">
                      <p className="truncate text-[11px] font-medium">
                        {photo.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {photo.category}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {activeTab === 'background' && (
            <>
              <span className="text-[11px] font-medium text-muted-foreground">
                Solid Studio Colors
              </span>
              <div className="grid grid-cols-5 gap-2">
                {STUDIO_COLOR_SWATCHES.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    aria-label={`Canvas color ${hex}`}
                    onClick={() => onUpdatePageBackground(hex, undefined)}
                    className={cn(
                      'aspect-square rounded-lg border transition-transform hover:scale-105',
                      !currentPage.backgroundGradient &&
                        currentPage.background.toLowerCase() ===
                          hex.toLowerCase() &&
                        'ring-2 ring-primary ring-offset-2'
                    )}
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>

              <Separator />

              <span className="text-[11px] font-medium text-muted-foreground">
                Editorial Gradients
              </span>
              <div className="grid grid-cols-2 gap-2">
                {STUDIO_GRADIENTS.map((g) => (
                  <button
                    key={g.name}
                    type="button"
                    onClick={() => onUpdatePageBackground(g.stops[0], g.value)}
                    className="flex h-14 items-end rounded-xl border p-2 text-left transition-transform hover:scale-[1.02]"
                    style={{ background: g.value }}
                  >
                    <span className="rounded bg-black/45 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs">
                      {g.name}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {activeTab === 'layers' && (
            <div className="flex flex-col gap-1.5">
              {currentPage.elements.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                  No layers on this page yet. Add a template, shape, photo, or
                  text to get started.
                </p>
              ) : (
                [...currentPage.elements].reverse().map((el) => {
                  const isSelected = selectedElement?.id === el.id
                  return (
                    <div
                      key={el.id}
                      onClick={() => onSelectElement(el.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onSelectElement(el.id)
                        }
                      }}
                      className={cn(
                        'flex items-center justify-between gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors',
                        isSelected
                          ? 'border-primary bg-accent/60 font-medium'
                          : 'bg-background hover:bg-muted/60'
                      )}
                    >
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate">
                          {el.type === 'text' ? el.text || el.name : el.name}
                        </span>
                        <span className="text-[10px] capitalize text-muted-foreground">
                          {el.type}
                        </span>
                      </div>

                      <div
                        className="flex shrink-0 items-center gap-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="size-6"
                          onClick={() => onLayerMove(el.id, 'up')}
                          aria-label="Move layer up"
                        >
                          <ArrowUpIcon />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="size-6"
                          onClick={() => onLayerMove(el.id, 'down')}
                          aria-label="Move layer down"
                        >
                          <ArrowDownIcon />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="size-6"
                          onClick={() =>
                            onUpdateElement(el.id, { visible: !el.visible })
                          }
                          aria-label={el.visible ? 'Hide layer' : 'Show layer'}
                        >
                          {el.visible ? <EyeIcon /> : <EyeOffIcon />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="size-6"
                          onClick={() =>
                            onUpdateElement(el.id, { locked: !el.locked })
                          }
                          aria-label={el.locked ? 'Unlock layer' : 'Lock layer'}
                        >
                          {el.locked ? <LockIcon /> : <UnlockIcon />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="size-6 text-destructive hover:text-destructive"
                          onClick={() => onDeleteElement(el.id)}
                          aria-label="Delete layer"
                        >
                          <Trash2Icon />
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
