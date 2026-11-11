export type ElementType = 'text' | 'shape' | 'image'

export type ShapeKind =
  | 'rect'
  | 'circle'
  | 'pill'
  | 'arch'
  | 'triangle'
  | 'diamond'
  | 'star'
  | 'burst'
  | 'badge'
  | 'line'

export type ImageFilterPreset =
  | 'none'
  | 'warm'
  | 'crisp'
  | 'mono'
  | 'contrast'
  | 'vintage'

export type FontKey = 'jakarta' | 'playfair' | 'space' | 'syne' | 'jetbrains'

export interface BaseCanvasElement {
  id: string
  type: ElementType
  name: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  locked: boolean
  visible: boolean
}

export interface TextCanvasElement extends BaseCanvasElement {
  type: 'text'
  text: string
  fontFamily: FontKey
  fontSize: number
  fontWeight: 400 | 500 | 600 | 700 | 800
  fontStyle: 'normal' | 'italic'
  textDecoration: 'none' | 'underline'
  textTransform: 'none' | 'uppercase'
  textAlign: 'left' | 'center' | 'right'
  color: string
  lineHeight: number
  letterSpacing: number
  backgroundColor?: string
  borderRadius?: number
  paddingX?: number
  paddingY?: number
}

export interface ShapeCanvasElement extends BaseCanvasElement {
  type: 'shape'
  shapeKind: ShapeKind
  fill: string
  gradient?: string
  stroke: string
  strokeWidth: number
  cornerRadius: number
}

export interface ImageCanvasElement extends BaseCanvasElement {
  type: 'image'
  src: string
  alt: string
  objectFit: 'cover' | 'contain'
  cornerRadius: number
  archClip?: boolean
  filterPreset: ImageFilterPreset
  brightness: number
  contrast: number
  saturate: number
}

export type CanvasElement =
  | TextCanvasElement
  | ShapeCanvasElement
  | ImageCanvasElement

export type CanvasElementInput =
  | Omit<TextCanvasElement, 'id'>
  | Omit<ShapeCanvasElement, 'id'>
  | Omit<ImageCanvasElement, 'id'>

export interface StudioPage {
  id: string
  title: string
  background: string
  backgroundGradient?: string
  elements: CanvasElement[]
}

export interface StudioProject {
  title: string
  presetId: string
  width: number
  height: number
  pages: StudioPage[]
}

export interface CanvasSizePreset {
  id: string
  name: string
  category: string
  width: number
  height: number
}

export interface StudioTemplate {
  id: string
  name: string
  category: 'Social' | 'Presentation' | 'Poster' | 'Brand'
  baseWidth: number
  baseHeight: number
  background: string
  backgroundGradient?: string
  accent: string
  elements: CanvasElementInput[]
}

export type ActiveSidebarTab =
  | 'templates'
  | 'magic'
  | 'elements'
  | 'text'
  | 'photos'
  | 'background'
  | 'layers'

export interface SnapGuide {
  orientation: 'vertical' | 'horizontal'
  position: number
  label?: string
}
