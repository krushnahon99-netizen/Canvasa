'use client'

import * as React from 'react'
import {
  ImageIcon,
  LayersIcon,
  LayoutTemplateIcon,
  PaletteIcon,
  ShapesIcon,
  SparklesIcon,
  TypeIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ActiveSidebarTab } from '@/lib/studio-types'

const RAIL_ITEMS: {
  id: ActiveSidebarTab
  label: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { id: 'templates', label: 'Templates', icon: LayoutTemplateIcon },
  { id: 'magic', label: 'Magic AI', icon: SparklesIcon },
  { id: 'elements', label: 'Elements', icon: ShapesIcon },
  { id: 'text', label: 'Text', icon: TypeIcon },
  { id: 'photos', label: 'Photos', icon: ImageIcon },
  { id: 'background', label: 'Canvas', icon: PaletteIcon },
  { id: 'layers', label: 'Layers', icon: LayersIcon },
]

interface SidebarRailProps {
  activeTab: ActiveSidebarTab
  isPanelOpen: boolean
  onSelectTab: (tab: ActiveSidebarTab) => void
}

export function DesktopSidebarRail({
  activeTab,
  isPanelOpen,
  onSelectTab,
}: SidebarRailProps) {
  return (
    <aside
      aria-label="Design studio tools"
      className="hidden w-16 shrink-0 flex-col items-center gap-1 border-r bg-sidebar py-2.5 md:flex"
    >
      {RAIL_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive = isPanelOpen && activeTab === item.id
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectTab(item.id)}
            className={cn(
              'flex w-13 flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] font-medium transition-colors',
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-2xs'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon
              className={cn(
                'size-4',
                item.id === 'magic' && !isActive && 'text-primary'
              )}
            />
            <span>{item.label}</span>
          </button>
        )
      })}
    </aside>
  )
}

export function MobileBottomRail({
  activeTab,
  isPanelOpen,
  onSelectTab,
}: SidebarRailProps) {
  return (
    <nav
      aria-label="Design tools dock"
      className="flex h-13 shrink-0 items-center justify-around gap-0.5 overflow-x-auto border-t bg-card px-1 md:hidden"
    >
      {RAIL_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive = isPanelOpen && activeTab === item.id
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectTab(item.id)}
            className={cn(
              'flex min-w-12 flex-col items-center justify-center gap-0.5 rounded-lg px-1.5 py-1 text-[10px] font-medium transition-colors',
              isActive
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon
              className={cn(
                'size-4',
                item.id === 'magic' && !isActive && 'text-primary'
              )}
            />
            <span className="truncate">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
