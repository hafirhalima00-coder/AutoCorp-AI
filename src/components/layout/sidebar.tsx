'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  Building2, LayoutDashboard, Users, GitBranch, MessageSquare,
  ShieldCheck, BarChart3, ScrollText, Keyboard, FileDown, Menu, X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, shortcut: 'g d' },
  { href: '/agents', label: 'AI Employees', icon: Users, shortcut: 'g a' },
  { href: '/workflow', label: 'Workflow', icon: GitBranch, shortcut: 'g w' },
  { href: '/communication', label: 'Communication', icon: MessageSquare, shortcut: 'g c' },
  { href: '/approvals', label: 'Approvals', icon: ShieldCheck, shortcut: 'g p' },
  { href: '/analytics', label: 'Analytics', icon: BarChart3, shortcut: 'g n' },
  { href: '/events', label: 'Event Log', icon: ScrollText, shortcut: 'g e' },
]

export function Sidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleExport = async () => {
    try {
      const res = await fetch('/api/export?type=csv')
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `autocorp-events-${Date.now()}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('Events exported')
    } catch {
      toast.error('Export failed')
    }
  }

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between gap-2 border-b px-4 sm:px-6 py-4 sm:py-5">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" aria-hidden="true" />
          <span className="text-base sm:text-lg font-bold tracking-tight">AutoCorp</span>
        </div>
        <Button variant="ghost" size="icon" className="sm:hidden h-8 w-8" onClick={() => setMobileOpen(false)} aria-label="Close menu">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <nav className="flex-1 space-y-1 p-3 sm:p-4" role="navigation">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="flex-1">{item.label}</span>
              <kbd className="hidden lg:inline-flex items-center gap-1 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/60">
                {item.shortcut}
              </kbd>
            </Link>
          )
        })}
      </nav>
      <div className="border-t p-3 sm:p-4 space-y-1">
        <button
          onClick={handleExport}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <FileDown className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Export Events</span>
        </button>
        <button
          onClick={() => toast('Keyboard Shortcuts', {
            description: 'g + letter: Navigate\n? : Show shortcuts\n⌘K : Command palette',
            duration: 5000,
          })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Keyboard className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Shortcuts</span>
        </button>
      </div>
    </>
  )

  return (
    <>
      <button
        className="fixed top-4 left-4 z-50 sm:hidden flex items-center justify-center h-9 w-9 rounded-md border bg-background shadow-md"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4" />
      </button>

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r bg-card transition-transform duration-200',
          'max-sm:shadow-2xl',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'sm:translate-x-0'
        )}
        aria-label="Main navigation"
      >
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 sm:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  )
}
