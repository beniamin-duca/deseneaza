'use client'

import { ReactNode } from 'react'
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarShellProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function SidebarShell({
  isOpen,
  onClose,
  title,
  children,
}: SidebarShellProps) {
  return (
    <>
      {/* Mobile bottom sheet — visible below md */}
      <div className="md:hidden">
        <Drawer
          open={isOpen}
          onOpenChange={(open) => {
            if (!open) onClose()
          }}
        >
          <DrawerContent className="max-h-[85vh] rounded-t-3xl bg-white">
            <DrawerTitle className="sr-only">{title}</DrawerTitle>
            <div className="flex items-center justify-between px-4 pt-2 pb-3 border-b border-border/50">
              <h2 className="font-display text-lg font-bold text-foreground">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors"
                aria-label="Inchide"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{children}</div>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Tablet/desktop side panel — visible at md and up */}
      <div
        className={cn('hidden md:block', !isOpen && 'md:pointer-events-none')}
      >
        {isOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={onClose}
            />
            <div className="fixed left-0 top-0 bottom-0 w-80 glass-panel z-50 sidebar-slide flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <h2 className="font-display text-xl font-bold text-foreground">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors"
                  aria-label="Inchide"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">{children}</div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
