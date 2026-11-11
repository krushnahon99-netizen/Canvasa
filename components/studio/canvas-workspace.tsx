'use client'

import * as React from 'react'
import {
  CopyIcon,
  LockIcon,
  PencilIcon,
  RotateCwIcon,
  Trash2Icon,
  UnlockIcon,
} from 'lucide-react'
import { ShapeRenderer } from './shape-renderer'
import { getFontCssFamily, IMAGE_FILTER_STYLES } from '@/lib/studio-presets'
import type {
  CanvasElement,
  SnapGuide,
  StudioPage,
} from '@/lib/studio-types'
import { cn } from '@/lib/utils'

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

interface LiveTransformState {
  id: string
  mode: 'move' | 'resize' | 'rotate'
  x: number
  y: number
  width: number
  height: number
  rotation: number
  dx: number
  dy: number
  fontSize?: number
}

interface CanvasWorkspaceProps {
  page: StudioPage
  width: number
  height: number
  zoom: number
  isAutoFit: boolean
  onComputedFitZoom: (fit: number) => void
  selectedId: string | null
  onSelectId: (id: string | null) => void
  onCommitElement: (id: string, patch: Partial<CanvasElement>) => void
  onDeleteElement: (id: string) => void
  onDuplicateElement: (id: string) => void
  snapEnabled: boolean
  showGrid: boolean
}

const RESIZE_HANDLE_CONFIG: {
  handle: ResizeHandle
  left: string
  top: string
  cursor: string
}[] = [
  { handle: 'nw', left: '0%', top: '0%', cursor: 'nwse-resize' },
  { handle: 'n', left: '50%', top: '0%', cursor: 'ns-resize' },
  { handle: 'ne', left: '100%', top: '0%', cursor: 'nesw-resize' },
  { handle: 'e', left: '100%', top: '50%', cursor: 'ew-resize' },
  { handle: 'se', left: '100%', top: '100%', cursor: 'nwse-resize' },
  { handle: 's', left: '50%', top: '100%', cursor: 'ns-resize' },
  { handle: 'sw', left: '0%', top: '100%', cursor: 'nesw-resize' },
  { handle: 'w', left: '0%', top: '50%', cursor: 'ew-resize' },
]

const preventNativeDrag = (e: React.DragEvent) => {
  e.preventDefault()
}

interface ElementVisualProps {
  element: CanvasElement
  isEditing: boolean
  liveFontSize?: number
  onChangeText: (id: string, text: string) => void
  onExitEdit: () => void
}

const ElementVisual = React.memo(function ElementVisual({
  element,
  isEditing,
  liveFontSize,
  onChangeText,
  onExitEdit,
}: ElementVisualProps) {
  if (element.type === 'shape') {
    return <ShapeRenderer element={element} />
  }

  if (element.type === 'image') {
    return (
      <img
        src={element.src}
        alt={element.alt}
        draggable={false}
        decoding="async"
        onDragStart={preventNativeDrag}
        className="pointer-events-none size-full select-none"
        style={{
          objectFit: element.objectFit,
          borderRadius: element.archClip
            ? '9999px 9999px 0 0'
            : `${element.cornerRadius}px`,
          filter: IMAGE_FILTER_STYLES[element.filterPreset].filter(
            element.brightness,
            element.contrast,
            element.saturate
          ),
        }}
      />
    )
  }

  const effectiveFontSize = liveFontSize ?? element.fontSize

  if (isEditing) {
    return (
      <textarea
        autoFocus
        value={element.text}
        onPointerDown={(e) => e.stopPropagation()}
        onChange={(e) => onChangeText(element.id, e.target.value)}
        onBlur={onExitEdit}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing || e.keyCode === 229) {
            return
          }
          if (e.key === 'Escape') {
            e.preventDefault()
            onExitEdit()
          }
        }}
        style={{
          fontFamily: getFontCssFamily(element.fontFamily),
          fontSize: `${effectiveFontSize}px`,
          fontWeight: element.fontWeight,
          fontStyle: element.fontStyle,
          textDecoration: element.textDecoration,
          textTransform: element.textTransform,
          textAlign: element.textAlign,
          color: element.color,
          lineHeight: element.lineHeight,
          letterSpacing: `${element.letterSpacing}em`,
          backgroundColor: element.backgroundColor || 'transparent',
          borderRadius: element.borderRadius
            ? `${element.borderRadius}px`
            : undefined,
          paddingLeft: element.paddingX ? `${element.paddingX}px` : undefined,
          paddingRight: element.paddingX ? `${element.paddingX}px` : undefined,
          paddingTop: element.paddingY ? `${element.paddingY}px` : undefined,
          paddingBottom: element.paddingY ? `${element.paddingY}px` : undefined,
        }}
        className="size-full resize-none border-none bg-transparent outline-hidden select-text"
      />
    )
  }

  return (
    <div
      data-text-display="true"
      style={{
        fontFamily: getFontCssFamily(element.fontFamily),
        fontSize: `${effectiveFontSize}px`,
        fontWeight: element.fontWeight,
        fontStyle: element.fontStyle,
        textDecoration: element.textDecoration,
        textTransform: element.textTransform,
        textAlign: element.textAlign,
        color: element.color,
        lineHeight: element.lineHeight,
        letterSpacing: `${element.letterSpacing}em`,
        backgroundColor: element.backgroundColor || undefined,
        borderRadius: element.borderRadius
          ? `${element.borderRadius}px`
          : undefined,
        paddingLeft: element.paddingX ? `${element.paddingX}px` : undefined,
        paddingRight: element.paddingX ? `${element.paddingX}px` : undefined,
        paddingTop: element.paddingY ? `${element.paddingY}px` : undefined,
        paddingBottom: element.paddingY ? `${element.paddingY}px` : undefined,
      }}
      className={cn(
        'pointer-events-none size-full whitespace-pre-wrap break-words select-none',
        element.backgroundColor && 'flex items-center justify-center'
      )}
    >
      {element.text}
    </div>
  )
})

export function CanvasWorkspace({
  page,
  width,
  height,
  zoom,
  isAutoFit,
  onComputedFitZoom,
  selectedId,
  onSelectId,
  onCommitElement,
  onDeleteElement,
  onDuplicateElement,
  snapEnabled,
  showGrid,
}: CanvasWorkspaceProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const artboardRef = React.useRef<HTMLDivElement>(null)
  const elementNodesRef = React.useRef<Map<string, HTMLDivElement>>(new Map())
  const selectionOverlayRef = React.useRef<HTMLDivElement>(null)
  const rotationBadgeRef = React.useRef<HTMLDivElement>(null)
  const cleanupInteractionRef = React.useRef<(() => void) | null>(null)
  const activeLiveRef = React.useRef<LiveTransformState | null>(null)
  const prevGuidesKeyRef = React.useRef<string>('')
  const lastTapRef = React.useRef<{
    id: string
    time: number
    x: number
    y: number
  } | null>(null)

  const [editingTextId, setEditingTextId] = React.useState<string | null>(null)
  const [snapGuides, setSnapGuides] = React.useState<SnapGuide[]>([])

  const setElementNode = React.useCallback(
    (id: string, node: HTMLDivElement | null) => {
      if (node) {
        elementNodesRef.current.set(id, node)
      } else {
        elementNodesRef.current.delete(id)
      }
    },
    []
  )

  const handleChangeText = React.useCallback(
    (id: string, text: string) => {
      onCommitElement(id, { text })
    },
    [onCommitElement]
  )

  const handleExitEdit = React.useCallback(() => {
    setEditingTextId(null)
  }, [])

  React.useEffect(() => {
    return () => {
      cleanupInteractionRef.current?.()
    }
  }, [])

  React.useEffect(() => {
    if (editingTextId && editingTextId !== selectedId) {
      setEditingTextId(null)
    }
  }, [selectedId, editingTextId])

  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const updateFit = () => {
      const rect = el.getBoundingClientRect()
      const pad = rect.width < 520 ? 32 : 72
      const availW = Math.max(120, rect.width - pad)
      const availH = Math.max(120, rect.height - pad)
      const fit = Math.min(availW / width, availH / height, 1.15)
      onComputedFitZoom(Math.max(0.15, Math.round(fit * 1000) / 1000))
    }
    updateFit()
    const ro = new ResizeObserver(updateFit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [width, height, onComputedFitZoom])

  const getEffectiveScale = () => {
    const rect = artboardRef.current?.getBoundingClientRect()
    if (rect && width > 0 && rect.width > 0) {
      return rect.width / width
    }
    return zoom || 1
  }

  const syncGuidesIfChanged = (guides: SnapGuide[]) => {
    const key =
      guides.length === 0
        ? ''
        : guides.map((g) => `${g.orientation}:${g.position}`).join('|')
    if (key !== prevGuidesKeyRef.current) {
      prevGuidesKeyRef.current = key
      setSnapGuides(guides)
    }
  }

  const getMatchedSelectionNode = (id: string) => {
    const node = selectionOverlayRef.current
    return node && node.dataset.selectedFor === id ? node : null
  }

  // Keep DOM transforms synchronized if React re-renders mid-drag (e.g. initial selection or guide toggle)
  React.useLayoutEffect(() => {
    const live = activeLiveRef.current
    if (!live) return
    const elNode = elementNodesRef.current.get(live.id)
    const selNode = getMatchedSelectionNode(live.id)

    if (live.mode === 'move') {
      const tf = `translate3d(${live.dx}px, ${live.dy}px, 0)${
        live.rotation ? ` rotate(${live.rotation}deg)` : ''
      }`
      if (elNode) {
        elNode.style.willChange = 'transform'
        elNode.style.transform = tf
      }
      if (selNode) {
        selNode.style.willChange = 'transform'
        selNode.style.transform = tf
      }
    } else if (live.mode === 'rotate') {
      const tf = `rotate(${live.rotation}deg)`
      if (elNode) elNode.style.transform = tf
      if (selNode) selNode.style.transform = tf
    } else if (live.mode === 'resize') {
      for (const node of [elNode, selNode]) {
        if (!node) continue
        node.style.left = `${live.x}px`
        node.style.top = `${live.y}px`
        node.style.width = `${live.width}px`
        node.style.height = `${live.height}px`
      }
    }
  })

  const startDragMove = (
    e: React.PointerEvent<HTMLDivElement>,
    element: CanvasElement
  ) => {
    if (element.locked || editingTextId === element.id) return
    if (e.pointerType === 'mouse' && e.button !== 0) return

    cleanupInteractionRef.current?.()

    const now = performance.now()
    const prevTap = lastTapRef.current
    if (
      element.type === 'text' &&
      prevTap &&
      prevTap.id === element.id &&
      now - prevTap.time < 340 &&
      Math.hypot(e.clientX - prevTap.x, e.clientY - prevTap.y) < 12
    ) {
      e.stopPropagation()
      lastTapRef.current = null
      onSelectId(element.id)
      setEditingTextId(element.id)
      return
    }

    e.stopPropagation()
    e.preventDefault()

    if (selectedId !== element.id) {
      onSelectId(element.id)
    }

    const captureEl = e.currentTarget
    const pointerId = e.pointerId
    try {
      captureEl.setPointerCapture(pointerId)
    } catch {
      // Ignore if pointer capture is unavailable on synthetic events
    }

    const scale = getEffectiveScale()
    const startClientX = e.clientX
    const startClientY = e.clientY
    let prevClientX = e.clientX
    let prevClientY = e.clientY
    const origX = element.x
    const origY = element.y

    const vTargets: number[] = [width / 2]
    const hTargets: number[] = [height / 2]
    if (snapEnabled) {
      for (const other of page.elements) {
        if (other.id === element.id || !other.visible) continue
        vTargets.push(other.x + other.width / 2, other.x)
        hTargets.push(other.y + other.height / 2, other.y)
      }
    }

    let didMove = false
    let finished = false
    let rafId: number | null = null
    let latestX = origX
    let latestY = origY
    let pendingGuides: SnapGuide[] = []

    const elNodeInit = elementNodesRef.current.get(element.id)
    if (elNodeInit) elNodeInit.style.willChange = 'transform'
    const selNodeInit = getMatchedSelectionNode(element.id)
    if (selNodeInit) {
      selNodeInit.style.willChange = 'transform'
    }

    const applyFrame = () => {
      rafId = null
      const live = activeLiveRef.current
      if (!live || live.id !== element.id) return
      const tf = `translate3d(${live.dx}px, ${live.dy}px, 0)${
        live.rotation ? ` rotate(${live.rotation}deg)` : ''
      }`
      const elNode = elementNodesRef.current.get(element.id)
      if (elNode) elNode.style.transform = tf
      const selNode = getMatchedSelectionNode(element.id)
      if (selNode) {
        selNode.style.transform = tf
      }
      syncGuidesIfChanged(pendingGuides)
    }

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return
      if (ev.pointerType === 'mouse' && ev.buttons === 0) {
        finish()
        return
      }
      ev.preventDefault()

      const distFromStart = Math.hypot(
        ev.clientX - startClientX,
        ev.clientY - startClientY
      )
      if (!didMove && distFromStart < 2) {
        return
      }
      didMove = true

      const stepSpeed = Math.hypot(
        ev.clientX - prevClientX,
        ev.clientY - prevClientY
      )
      prevClientX = ev.clientX
      prevClientY = ev.clientY

      const dx = (ev.clientX - startClientX) / scale
      const dy = (ev.clientY - startClientY) / scale
      let nextX = origX + dx
      let nextY = origY + dy
      const guides: SnapGuide[] = []

      // Only engage gentle magnetic snap during deliberate slow positioning (and when Alt is not held)
      if (snapEnabled && !ev.altKey && stepSpeed <= 4.5) {
        const threshold = Math.min(8, Math.max(2.5, 4 / scale))
        const elCenterX = nextX + element.width / 2
        const elCenterY = nextY + element.height / 2

        let bestVDiff = threshold
        let bestVGuide: number | null = null
        let snappedX = nextX

        for (const targetX of vTargets) {
          const centerDiff = Math.abs(elCenterX - targetX)
          if (centerDiff < bestVDiff) {
            bestVDiff = centerDiff
            bestVGuide = targetX
            snappedX = targetX - element.width / 2
          }
          const edgeDiff = Math.abs(nextX - targetX)
          if (edgeDiff < bestVDiff) {
            bestVDiff = edgeDiff
            bestVGuide = targetX
            snappedX = targetX
          }
        }
        if (bestVGuide !== null) {
          nextX = Math.round(snappedX)
          guides.push({
            orientation: 'vertical',
            position: Math.round(bestVGuide),
          })
        }

        let bestHDiff = threshold
        let bestHGuide: number | null = null
        let snappedY = nextY

        for (const targetY of hTargets) {
          const centerDiff = Math.abs(elCenterY - targetY)
          if (centerDiff < bestHDiff) {
            bestHDiff = centerDiff
            bestHGuide = targetY
            snappedY = targetY - element.height / 2
          }
          const edgeDiff = Math.abs(nextY - targetY)
          if (edgeDiff < bestHDiff) {
            bestHDiff = edgeDiff
            bestHGuide = targetY
            snappedY = targetY
          }
        }
        if (bestHGuide !== null) {
          nextY = Math.round(snappedY)
          guides.push({
            orientation: 'horizontal',
            position: Math.round(bestHGuide),
          })
        }
      }

      latestX = nextX
      latestY = nextY
      pendingGuides = guides
      activeLiveRef.current = {
        id: element.id,
        mode: 'move',
        x: origX,
        y: origY,
        width: element.width,
        height: element.height,
        rotation: element.rotation,
        dx: nextX - origX,
        dy: nextY - origY,
      }

      if (rafId === null) {
        rafId = window.requestAnimationFrame(applyFrame)
      }
    }

    const finish = () => {
      if (finished) return
      finished = true
      cleanupInteractionRef.current = null

      if (rafId !== null) {
        window.cancelAnimationFrame(rafId)
        rafId = null
      }

      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', finish)
      window.removeEventListener('blur', finish)

      try {
        if (captureEl.hasPointerCapture?.(pointerId)) {
          captureEl.releasePointerCapture(pointerId)
        }
      } catch {
        // Ignore
      }

      activeLiveRef.current = null
      syncGuidesIfChanged([])

      const elNode = elementNodesRef.current.get(element.id)
      const selNode = getMatchedSelectionNode(element.id)
      const baseTransform = element.rotation
        ? `rotate(${element.rotation}deg)`
        : ''

      if (didMove) {
        const finalX = Math.round(latestX)
        const finalY = Math.round(latestY)
        if (elNode) {
          elNode.style.left = `${finalX}px`
          elNode.style.top = `${finalY}px`
          elNode.style.transform = baseTransform
          elNode.style.willChange = ''
        }
        if (selNode) {
          selNode.style.left = `${finalX}px`
          selNode.style.top = `${finalY}px`
          selNode.style.transform = baseTransform
          selNode.style.willChange = ''
        }
        onCommitElement(element.id, { x: finalX, y: finalY })
      } else {
        if (elNode) elNode.style.willChange = ''
        if (selNode) selNode.style.willChange = ''
        lastTapRef.current = {
          id: element.id,
          time: performance.now(),
          x: startClientX,
          y: startClientY,
        }
      }
    }

    cleanupInteractionRef.current = finish
    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', finish)
    window.addEventListener('pointercancel', finish)
    window.addEventListener('blur', finish)
  }

  const startResize = (
    e: React.PointerEvent<HTMLDivElement>,
    element: CanvasElement,
    handle: ResizeHandle
  ) => {
    if (element.locked) return
    if (e.pointerType === 'mouse' && e.button !== 0) return

    cleanupInteractionRef.current?.()
    e.stopPropagation()
    e.preventDefault()

    const captureEl = e.currentTarget
    const pointerId = e.pointerId
    try {
      captureEl.setPointerCapture(pointerId)
    } catch {
      // Ignore
    }

    const scale = getEffectiveScale()
    const startClientX = e.clientX
    const startClientY = e.clientY
    const origX = element.x
    const origY = element.y
    const origW = element.width
    const origH = element.height
    const origFontSize = element.type === 'text' ? element.fontSize : 0

    let finished = false
    let didResize = false
    let rafId: number | null = null
    let latestPatch: Partial<CanvasElement> | null = null

    const applyResizeFrame = () => {
      rafId = null
      const live = activeLiveRef.current
      if (!live || live.id !== element.id) return
      const elNode = elementNodesRef.current.get(element.id)
      const selNode = selectionOverlayRef.current

      for (const node of [elNode, selNode]) {
        if (!node) continue
        node.style.left = `${live.x}px`
        node.style.top = `${live.y}px`
        node.style.width = `${live.width}px`
        node.style.height = `${live.height}px`
      }

      if (live.fontSize !== undefined && elNode) {
        const textNode = elNode.querySelector<HTMLElement>(
          '[data-text-display="true"]'
        )
        if (textNode) {
          textNode.style.fontSize = `${live.fontSize}px`
        }
      }
    }

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return
      if (ev.pointerType === 'mouse' && ev.buttons === 0) {
        finish()
        return
      }
      ev.preventDefault()
      didResize = true

      const dx = (ev.clientX - startClientX) / scale
      const dy = (ev.clientY - startClientY) / scale

      let newX = origX
      let newY = origY
      let newW = origW
      let newH = origH

      if (handle.includes('e')) newW = Math.max(28, Math.round(origW + dx))
      if (handle.includes('s')) newH = Math.max(16, Math.round(origH + dy))
      if (handle.includes('w')) {
        const candidateW = Math.max(28, Math.round(origW - dx))
        newX = origX + (origW - candidateW)
        newW = candidateW
      }
      if (handle.includes('n')) {
        const candidateH = Math.max(16, Math.round(origH - dy))
        newY = origY + (origH - candidateH)
        newH = candidateH
      }

      let nextFontSize: number | undefined
      const patch: Partial<CanvasElement> = {
        x: newX,
        y: newY,
        width: newW,
        height: newH,
      }

      if (
        element.type === 'text' &&
        (handle === 'nw' ||
          handle === 'ne' ||
          handle === 'se' ||
          handle === 'sw')
      ) {
        const ratio = newW / Math.max(1, origW)
        nextFontSize = Math.max(
          10,
          Math.min(260, Math.round(origFontSize * ratio))
        )
        ;(patch as Partial<typeof element>).fontSize = nextFontSize
      }

      latestPatch = patch
      activeLiveRef.current = {
        id: element.id,
        mode: 'resize',
        x: newX,
        y: newY,
        width: newW,
        height: newH,
        rotation: element.rotation,
        dx: 0,
        dy: 0,
        fontSize: nextFontSize,
      }

      if (rafId === null) {
        rafId = window.requestAnimationFrame(applyResizeFrame)
      }
    }

    const finish = () => {
      if (finished) return
      finished = true
      cleanupInteractionRef.current = null

      if (rafId !== null) {
        window.cancelAnimationFrame(rafId)
        rafId = null
      }

      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', finish)
      window.removeEventListener('blur', finish)

      try {
        if (captureEl.hasPointerCapture?.(pointerId)) {
          captureEl.releasePointerCapture(pointerId)
        }
      } catch {
        // Ignore
      }

      activeLiveRef.current = null
      if (didResize && latestPatch) {
        applyResizeFrame()
        onCommitElement(element.id, latestPatch)
      }
    }

    cleanupInteractionRef.current = finish
    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', finish)
    window.addEventListener('pointercancel', finish)
    window.addEventListener('blur', finish)
  }

  const startRotate = (
    e: React.PointerEvent<HTMLDivElement>,
    element: CanvasElement
  ) => {
    if (element.locked || !artboardRef.current) return
    if (e.pointerType === 'mouse' && e.button !== 0) return

    cleanupInteractionRef.current?.()
    e.stopPropagation()
    e.preventDefault()

    const captureEl = e.currentTarget
    const pointerId = e.pointerId
    try {
      captureEl.setPointerCapture(pointerId)
    } catch {
      // Ignore
    }

    const scale = getEffectiveScale()
    const boardRect = artboardRef.current.getBoundingClientRect()
    const centerClientX =
      boardRect.left + (element.x + element.width / 2) * scale
    const centerClientY =
      boardRect.top + (element.y + element.height / 2) * scale

    let finished = false
    let didRotate = false
    let rafId: number | null = null
    let latestDeg = element.rotation

    const applyRotateFrame = () => {
      rafId = null
      const live = activeLiveRef.current
      if (!live || live.id !== element.id) return
      const tf = `rotate(${live.rotation}deg)`
      const elNode = elementNodesRef.current.get(element.id)
      if (elNode) elNode.style.transform = tf
      if (selectionOverlayRef.current) {
        selectionOverlayRef.current.style.transform = tf
      }
      if (rotationBadgeRef.current) {
        rotationBadgeRef.current.style.display = 'block'
        rotationBadgeRef.current.textContent = `${live.rotation}°`
      }
    }

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return
      if (ev.pointerType === 'mouse' && ev.buttons === 0) {
        finish()
        return
      }
      ev.preventDefault()
      didRotate = true

      const radians = Math.atan2(
        ev.clientY - centerClientY,
        ev.clientX - centerClientX
      )
      let deg = Math.round((radians * 180) / Math.PI + 90)
      if (deg < 0) deg += 360
      if (ev.shiftKey) {
        deg = Math.round(deg / 15) * 15
      }
      if (Math.abs(deg % 90) <= 3) {
        deg = Math.round(deg / 90) * 90
      }
      deg = ((deg % 360) + 360) % 360
      latestDeg = deg

      activeLiveRef.current = {
        id: element.id,
        mode: 'rotate',
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        rotation: deg,
        dx: 0,
        dy: 0,
      }

      if (rafId === null) {
        rafId = window.requestAnimationFrame(applyRotateFrame)
      }
    }

    const finish = () => {
      if (finished) return
      finished = true
      cleanupInteractionRef.current = null

      if (rafId !== null) {
        window.cancelAnimationFrame(rafId)
        rafId = null
      }

      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', finish)
      window.removeEventListener('blur', finish)

      try {
        if (captureEl.hasPointerCapture?.(pointerId)) {
          captureEl.releasePointerCapture(pointerId)
        }
      } catch {
        // Ignore
      }

      if (rotationBadgeRef.current) {
        rotationBadgeRef.current.style.display = 'none'
      }

      activeLiveRef.current = null
      if (didRotate) {
        onCommitElement(element.id, { rotation: latestDeg })
      }
    }

    cleanupInteractionRef.current = finish
    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', finish)
    window.addEventListener('pointercancel', finish)
    window.addEventListener('blur', finish)
  }

  const scaledW = Math.round(width * zoom)
  const scaledH = Math.round(height * zoom)
  const invScale = 1 / Math.max(0.05, zoom)

  const selectedElement = React.useMemo(
    () =>
      selectedId
        ? page.elements.find((el) => el.id === selectedId && el.visible) ?? null
        : null,
    [page.elements, selectedId]
  )

  const isSelectedEditing =
    selectedElement !== null && editingTextId === selectedElement.id

  const placeFloatingBarInside =
    selectedElement !== null && selectedElement.y * zoom < 44

  return (
    <div
      ref={containerRef}
      onPointerDown={(e) => {
        if (
          e.target === e.currentTarget ||
          (e.target as HTMLElement).dataset.stageBackdrop
        ) {
          onSelectId(null)
          setEditingTextId(null)
        }
      }}
      data-stage-backdrop="true"
      className={cn(
        'studio-stage-bg relative flex min-h-0 flex-1 overflow-auto',
        isAutoFit ? 'items-center justify-center p-3 md:p-6' : 'p-6 md:p-10'
      )}
    >
      <div
        data-stage-backdrop="true"
        className="relative m-auto shrink-0"
        style={{ width: `${scaledW}px`, height: `${scaledH}px` }}
      >
        <div
          ref={artboardRef}
          className="relative origin-top-left"
          style={{
            width: `${width}px`,
            height: `${height}px`,
            transform: `scale(${zoom})`,
          }}
        >
          {/* Clipped Poster Surface */}
          <div
            onPointerDown={(e) => {
              if (e.target === e.currentTarget) {
                onSelectId(null)
                setEditingTextId(null)
              }
            }}
            className="relative size-full overflow-hidden shadow-xl ring-1 ring-black/10 dark:ring-white/15"
            style={{
              background: page.backgroundGradient || page.background,
            }}
          >
            {showGrid && (
              <div className="pointer-events-none absolute inset-0 z-30">
                <div className="absolute inset-y-0 left-1/3 border-l border-dashed border-indigo-500/40" />
                <div className="absolute inset-y-0 left-2/3 border-l border-dashed border-indigo-500/40" />
                <div className="absolute inset-x-0 top-1/3 border-t border-dashed border-indigo-500/40" />
                <div className="absolute inset-x-0 top-2/3 border-t border-dashed border-indigo-500/40" />
              </div>
            )}

            {snapGuides.map((g, i) =>
              g.orientation === 'vertical' ? (
                <div
                  key={`v-${i}`}
                  className="pointer-events-none absolute inset-y-0 z-40"
                  style={{
                    left: `${g.position}px`,
                    borderLeft: `${Math.max(1.5, 1.5 * invScale)}px solid #EC4899`,
                  }}
                />
              ) : (
                <div
                  key={`h-${i}`}
                  className="pointer-events-none absolute inset-x-0 z-40"
                  style={{
                    top: `${g.position}px`,
                    borderTop: `${Math.max(1.5, 1.5 * invScale)}px solid #EC4899`,
                  }}
                />
              )
            )}

            {page.elements.map((el) => {
              if (!el.visible) return null
              const isSelected = selectedId === el.id
              const isEditing = editingTextId === el.id
              const live =
                activeLiveRef.current?.id === el.id
                  ? activeLiveRef.current
                  : null

              const renderedLeft =
                live && live.mode === 'resize' ? live.x : el.x
              const renderedTop = live && live.mode === 'resize' ? live.y : el.y
              const renderedWidth =
                live && live.mode === 'resize' ? live.width : el.width
              const renderedHeight =
                live && live.mode === 'resize' ? live.height : el.height
              const renderedRotation =
                live && live.mode === 'rotate' ? live.rotation : el.rotation

              const renderedTransform =
                live && live.mode === 'move'
                  ? `translate3d(${live.dx}px, ${live.dy}px, 0)${
                      renderedRotation ? ` rotate(${renderedRotation}deg)` : ''
                    }`
                  : renderedRotation
                    ? `rotate(${renderedRotation}deg)`
                    : undefined

              return (
                <div
                  key={el.id}
                  ref={(node) => setElementNode(el.id, node)}
                  draggable={false}
                  onDragStart={preventNativeDrag}
                  onPointerDown={(e) => startDragMove(e, el)}
                  onDoubleClick={(e) => {
                    e.stopPropagation()
                    if (el.type === 'text' && !el.locked) {
                      setEditingTextId(el.id)
                    }
                  }}
                  style={{
                    position: 'absolute',
                    left: `${renderedLeft}px`,
                    top: `${renderedTop}px`,
                    width: `${renderedWidth}px`,
                    height: `${renderedHeight}px`,
                    transform: renderedTransform,
                    opacity: el.opacity / 100,
                    touchAction: isEditing ? 'auto' : 'none',
                    WebkitUserSelect: isEditing ? 'text' : 'none',
                    userSelect: isEditing ? 'text' : 'none',
                    cursor: el.locked
                      ? 'default'
                      : isEditing
                        ? 'text'
                        : 'grab',
                  }}
                  className={cn(
                    'group',
                    !isEditing && 'studio-draggable active:cursor-grabbing'
                  )}
                >
                  <ElementVisual
                    element={el}
                    isEditing={isEditing}
                    liveFontSize={live?.fontSize}
                    onChangeText={handleChangeText}
                    onExitEdit={handleExitEdit}
                  />

                  {!isSelected && !el.locked && (
                    <div
                      className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
                      style={{
                        outline: `${Math.max(1.5, 1.5 * invScale)}px solid rgba(99, 102, 241, 0.55)`,
                      }}
                    />
                  )}
                </div>
              )
            })}
          </div>

          {/* Unclipped Selection & Handle Chrome Layer */}
          {selectedElement && (
            <div className="pointer-events-none absolute inset-0 z-50 overflow-visible">
              <div
                key={selectedElement.id}
                ref={selectionOverlayRef}
                data-selected-for={selectedElement.id}
                style={{
                  position: 'absolute',
                  left: `${selectedElement.x}px`,
                  top: `${selectedElement.y}px`,
                  width: `${selectedElement.width}px`,
                  height: `${selectedElement.height}px`,
                  transform: selectedElement.rotation
                    ? `rotate(${selectedElement.rotation}deg)`
                    : undefined,
                  outline: `${Math.max(2, 2 * invScale)}px solid ${
                    selectedElement.locked ? '#F59E0B' : '#6366F1'
                  }`,
                }}
                className="pointer-events-none"
              >
                {!selectedElement.locked && !isSelectedEditing && (
                  <>
                    {RESIZE_HANDLE_CONFIG.map(
                      ({ handle, left, top, cursor }) => (
                        <div
                          key={handle}
                          draggable={false}
                          onDragStart={preventNativeDrag}
                          onPointerDown={(e) =>
                            startResize(e, selectedElement, handle)
                          }
                          style={{
                            left,
                            top,
                            cursor,
                            transform: `translate(-50%, -50%) scale(${invScale})`,
                          }}
                          className="studio-draggable pointer-events-auto absolute flex size-7 items-center justify-center"
                        >
                          <span className="size-3 rounded-full border-2 border-indigo-600 bg-white shadow-sm" />
                        </div>
                      )
                    )}

                    <div
                      draggable={false}
                      onDragStart={preventNativeDrag}
                      onPointerDown={(e) => startRotate(e, selectedElement)}
                      style={{
                        bottom: `${-34 * invScale}px`,
                        left: '50%',
                        transform: `translate(-50%, 50%) scale(${invScale})`,
                      }}
                      title="Drag to rotate"
                      className="studio-draggable pointer-events-auto absolute flex size-8 cursor-grab items-center justify-center active:cursor-grabbing"
                    >
                      <span className="flex size-6 items-center justify-center rounded-full border bg-white text-slate-700 shadow-md hover:bg-indigo-50">
                        <RotateCwIcon className="size-3.5" />
                      </span>
                    </div>

                    <div
                      ref={rotationBadgeRef}
                      style={{
                        display: 'none',
                        bottom: `${-66 * invScale}px`,
                        left: '50%',
                        transform: `translate(-50%, 50%) scale(${invScale})`,
                      }}
                      className="pointer-events-none absolute rounded-md bg-slate-900 px-2 py-0.5 font-mono text-xs text-white shadow"
                    />
                  </>
                )}

                <div
                  onPointerDown={(e) => e.stopPropagation()}
                  style={{
                    top: placeFloatingBarInside
                      ? `${10 * invScale}px`
                      : `${-38 * invScale}px`,
                    left: '50%',
                    transform: placeFloatingBarInside
                      ? `translate(-50%, 0) scale(${invScale})`
                      : `translate(-50%, -50%) scale(${invScale})`,
                  }}
                  className="pointer-events-auto absolute flex items-center gap-0.5 rounded-lg border bg-white/95 px-1 py-0.5 text-slate-700 shadow-md backdrop-blur-xs"
                >
                  {selectedElement.type === 'text' &&
                    !selectedElement.locked &&
                    !isSelectedEditing && (
                      <button
                        type="button"
                        onClick={() => setEditingTextId(selectedElement.id)}
                        title="Edit text"
                        className="rounded p-1 hover:bg-slate-100"
                      >
                        <PencilIcon className="size-3.5" />
                      </button>
                    )}
                  <button
                    type="button"
                    onClick={() => onDuplicateElement(selectedElement.id)}
                    title="Duplicate"
                    className="rounded p-1 hover:bg-slate-100"
                  >
                    <CopyIcon className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onCommitElement(selectedElement.id, {
                        locked: !selectedElement.locked,
                      })
                    }
                    title={selectedElement.locked ? 'Unlock' : 'Lock'}
                    className="rounded p-1 hover:bg-slate-100"
                  >
                    {selectedElement.locked ? (
                      <LockIcon className="size-3.5 text-amber-600" />
                    ) : (
                      <UnlockIcon className="size-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteElement(selectedElement.id)}
                    title="Delete"
                    className="rounded p-1 text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2Icon className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
