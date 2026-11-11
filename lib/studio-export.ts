import {
  getFontCanvasFamily,
  IMAGE_FILTER_STYLES,
} from './studio-presets'
import type {
  CanvasElement,
  ShapeKind,
  StudioPage,
  StudioProject,
} from './studio-types'

function parseLinearGradient(
  ctx: CanvasRenderingContext2D,
  gradientCss: string,
  width: number,
  height: number
): CanvasGradient | null {
  const hexMatches = gradientCss.match(/#[0-9a-fA-F]{6}/g)
  if (!hexMatches || hexMatches.length < 2) return null
  const grad = ctx.createLinearGradient(0, 0, width, height)
  hexMatches.forEach((hex, idx) => {
    grad.addColorStop(idx / (hexMatches.length - 1), hex)
  })
  return grad
}

function traceShapePath(
  ctx: CanvasRenderingContext2D,
  kind: ShapeKind,
  w: number,
  h: number,
  cornerRadius: number
) {
  ctx.beginPath()
  switch (kind) {
    case 'circle': {
      ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2)
      break
    }
    case 'pill':
    case 'badge': {
      const r = Math.min(w, h) / 2
      ctx.roundRect(0, 0, w, h, r)
      break
    }
    case 'arch': {
      const r = Math.min(w / 2, h)
      ctx.moveTo(0, r)
      ctx.arc(w / 2, r, w / 2, Math.PI, 0, false)
      ctx.lineTo(w, h)
      ctx.lineTo(0, h)
      ctx.closePath()
      break
    }
    case 'triangle': {
      ctx.moveTo(w / 2, 0)
      ctx.lineTo(w, h)
      ctx.lineTo(0, h)
      ctx.closePath()
      break
    }
    case 'diamond': {
      ctx.moveTo(w / 2, 0)
      ctx.lineTo(w, h / 2)
      ctx.lineTo(w / 2, h)
      ctx.lineTo(0, h / 2)
      ctx.closePath()
      break
    }
    case 'star': {
      const spikes = 5
      const outerX = w / 2
      const outerY = h / 2
      const innerX = w * 0.21
      const innerY = h * 0.21
      for (let i = 0; i < spikes * 2; i++) {
        const rx = i % 2 === 0 ? outerX : innerX
        const ry = i % 2 === 0 ? outerY : innerY
        const angle = (i * Math.PI) / spikes - Math.PI / 2
        const px = w / 2 + Math.cos(angle) * rx
        const py = h / 2 + Math.sin(angle) * ry
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      break
    }
    case 'burst': {
      const spikes = 12
      const outerX = w / 2
      const outerY = h / 2
      const innerX = w * 0.36
      const innerY = h * 0.36
      for (let i = 0; i < spikes * 2; i++) {
        const rx = i % 2 === 0 ? outerX : innerX
        const ry = i % 2 === 0 ? outerY : innerY
        const angle = (i * Math.PI) / spikes - Math.PI / 2
        const px = w / 2 + Math.cos(angle) * rx
        const py = h / 2 + Math.sin(angle) * ry
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      break
    }
    case 'line': {
      const thickness = Math.max(2, Math.min(h, 12))
      ctx.roundRect(0, (h - thickness) / 2, w, thickness, thickness / 2)
      break
    }
    case 'rect':
    default: {
      const r = Math.min(cornerRadius, w / 2, h / 2)
      ctx.roundRect(0, 0, w, h, r)
      break
    }
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = (err) => reject(err)
    img.src = src
  })
}

function wrapParagraphs(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const rawLines = text.split('\n')
  const wrapped: string[] = []
  for (const rawLine of rawLines) {
    if (!rawLine.trim()) {
      wrapped.push('')
      continue
    }
    const words = rawLine.split(' ')
    let current = ''
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word
      if (ctx.measureText(candidate).width <= maxWidth + 4 || !current) {
        current = candidate
      } else {
        wrapped.push(current)
        current = word
      }
    }
    if (current) wrapped.push(current)
  }
  return wrapped
}

export async function exportPageToPng(
  page: StudioPage,
  width: number,
  height: number,
  filename: string
): Promise<void> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  if (page.backgroundGradient) {
    const grad = parseLinearGradient(ctx, page.backgroundGradient, width, height)
    ctx.fillStyle = grad ?? page.background
  } else {
    ctx.fillStyle = page.background
  }
  ctx.fillRect(0, 0, width, height)

  for (const el of page.elements) {
    if (!el.visible) continue
    ctx.save()
    ctx.globalAlpha = Math.max(0, Math.min(1, el.opacity / 100))

    const cx = el.x + el.width / 2
    const cy = el.y + el.height / 2
    ctx.translate(cx, cy)
    if (el.rotation) {
      ctx.rotate((el.rotation * Math.PI) / 180)
    }
    ctx.translate(-el.width / 2, -el.height / 2)

    if (el.type === 'shape') {
      traceShapePath(ctx, el.shapeKind, el.width, el.height, el.cornerRadius)
      if (el.gradient) {
        const g = parseLinearGradient(ctx, el.gradient, el.width, el.height)
        ctx.fillStyle = g ?? el.fill
        ctx.fill()
      } else if (el.fill && el.fill !== 'transparent') {
        ctx.fillStyle = el.fill
        ctx.fill()
      }
      if (el.strokeWidth > 0 && el.stroke && el.stroke !== 'transparent') {
        ctx.strokeStyle = el.stroke
        ctx.lineWidth = el.strokeWidth
        ctx.stroke()
      }
    } else if (el.type === 'image') {
      try {
        const img = await loadImage(el.src)
        ctx.save()
        if (el.archClip) {
          traceShapePath(ctx, 'arch', el.width, el.height, 0)
        } else {
          traceShapePath(ctx, 'rect', el.width, el.height, el.cornerRadius)
        }
        ctx.clip()
        const preset = IMAGE_FILTER_STYLES[el.filterPreset] ?? IMAGE_FILTER_STYLES.none
        ctx.filter = preset.filter(el.brightness, el.contrast, el.saturate)

        const imgRatio = img.naturalWidth / Math.max(1, img.naturalHeight)
        const boxRatio = el.width / Math.max(1, el.height)
        let drawW = el.width
        let drawH = el.height
        let drawX = 0
        let drawY = 0

        if (el.objectFit === 'cover') {
          if (imgRatio > boxRatio) {
            drawH = el.height
            drawW = el.height * imgRatio
            drawX = (el.width - drawW) / 2
          } else {
            drawW = el.width
            drawH = el.width / imgRatio
            drawY = (el.height - drawH) / 2
          }
        } else {
          if (imgRatio > boxRatio) {
            drawW = el.width
            drawH = el.width / imgRatio
            drawY = (el.height - drawH) / 2
          } else {
            drawH = el.height
            drawW = el.height * imgRatio
            drawX = (el.width - drawW) / 2
          }
        }
        ctx.drawImage(img, drawX, drawY, drawW, drawH)
        ctx.restore()
      } catch {
        ctx.fillStyle = '#E2E8F0'
        ctx.fillRect(0, 0, el.width, el.height)
      }
    } else if (el.type === 'text') {
      const padX = el.paddingX ?? 0
      const padY = el.paddingY ?? 0
      if (el.backgroundColor && el.backgroundColor !== 'transparent') {
        ctx.beginPath()
        const r = Math.min(el.borderRadius ?? 0, el.width / 2, el.height / 2)
        ctx.roundRect(0, 0, el.width, el.height, r)
        ctx.fillStyle = el.backgroundColor
        ctx.fill()
      }

      const displayContent =
        el.textTransform === 'uppercase' ? el.text.toUpperCase() : el.text
      const family = getFontCanvasFamily(el.fontFamily)
      ctx.font = `${el.fontStyle} ${el.fontWeight} ${el.fontSize}px ${family}`
      if ('letterSpacing' in ctx) {
        ;(ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
          `${(el.letterSpacing * el.fontSize).toFixed(1)}px`
      }
      ctx.fillStyle = el.color
      ctx.textBaseline = 'top'

      const innerW = Math.max(20, el.width - padX * 2)
      const lines = wrapParagraphs(ctx, displayContent, innerW)
      const lineStep = el.fontSize * el.lineHeight

      lines.forEach((line, idx) => {
        let tx = padX
        if (el.textAlign === 'center') {
          ctx.textAlign = 'center'
          tx = el.width / 2
        } else if (el.textAlign === 'right') {
          ctx.textAlign = 'right'
          tx = el.width - padX
        } else {
          ctx.textAlign = 'left'
          tx = padX
        }
        const ty = padY + idx * lineStep
        ctx.fillText(line, tx, ty)
      })
    }

    ctx.restore()
  }

  const dataUrl = canvas.toDataURL('image/png')
  triggerDownload(dataUrl, `${slugify(filename)}.png`)
}

export function exportPageToSvg(
  page: StudioPage,
  width: number,
  height: number,
  filename: string
): void {
  const escapeXml = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')

  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`,
    `<rect width="${width}" height="${height}" fill="${escapeXml(page.background)}" />`,
  ]

  page.elements.forEach((el: CanvasElement) => {
    if (!el.visible) return
    const cx = el.x + el.width / 2
    const cy = el.y + el.height / 2
    const transform = el.rotation
      ? `rotate(${el.rotation} ${cx} ${cy})`
      : ''
    const opacity = (el.opacity / 100).toFixed(2)

    if (el.type === 'shape') {
      const fill = el.fill === 'transparent' ? 'none' : escapeXml(el.fill)
      const stroke = el.strokeWidth > 0 ? escapeXml(el.stroke) : 'none'
      if (el.shapeKind === 'circle') {
        parts.push(
          `<ellipse cx="${cx}" cy="${cy}" rx="${el.width / 2}" ry="${el.height / 2}" fill="${fill}" stroke="${stroke}" stroke-width="${el.strokeWidth}" opacity="${opacity}" transform="${transform}" />`
        )
      } else {
        const r =
          el.shapeKind === 'pill' || el.shapeKind === 'badge'
            ? Math.min(el.width, el.height) / 2
            : el.cornerRadius
        parts.push(
          `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${el.strokeWidth}" opacity="${opacity}" transform="${transform}" />`
        )
      }
    } else if (el.type === 'text') {
      const raw =
        el.textTransform === 'uppercase' ? el.text.toUpperCase() : el.text
      const lines = raw.split('\n')
      const anchor =
        el.textAlign === 'center'
          ? 'middle'
          : el.textAlign === 'right'
            ? 'end'
            : 'start'
      const tx =
        el.textAlign === 'center'
          ? el.x + el.width / 2
          : el.textAlign === 'right'
            ? el.x + el.width - (el.paddingX ?? 0)
            : el.x + (el.paddingX ?? 0)

      if (el.backgroundColor && el.backgroundColor !== 'transparent') {
        parts.push(
          `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rx="${el.borderRadius ?? 0}" fill="${escapeXml(el.backgroundColor)}" opacity="${opacity}" transform="${transform}" />`
        )
      }
      lines.forEach((line, idx) => {
        const ty =
          el.y +
          (el.paddingY ?? 0) +
          el.fontSize * 0.88 +
          idx * el.fontSize * el.lineHeight
        parts.push(
          `<text x="${tx}" y="${ty}" fill="${escapeXml(el.color)}" font-size="${el.fontSize}" font-weight="${el.fontWeight}" font-style="${el.fontStyle}" text-anchor="${anchor}" opacity="${opacity}" transform="${transform}">${escapeXml(line)}</text>`
        )
      })
    } else if (el.type === 'image') {
      const absUrl = el.src.startsWith('/')
        ? `${window.location.origin}${el.src}`
        : el.src
      parts.push(
        `<image href="${escapeXml(absUrl)}" x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" preserveAspectRatio="xMidYMid slice" opacity="${opacity}" transform="${transform}" />`
      )
    }
  })

  parts.push('</svg>')
  const blob = new Blob([parts.join('\n')], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  triggerDownload(url, `${slugify(filename)}.svg`)
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

export function exportProjectJson(project: StudioProject): void {
  const blob = new Blob([JSON.stringify(project, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  triggerDownload(url, `${slugify(project.title || 'canvasa-project')}.json`)
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'canvasa-design'
  )
}

function triggerDownload(href: string, filename: string) {
  const link = document.createElement('a')
  link.href = href
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
