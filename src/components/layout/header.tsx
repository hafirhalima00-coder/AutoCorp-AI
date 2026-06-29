'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun, RefreshCw, Command } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCallback, useState } from 'react'
import { NotificationCenter } from './notification-center'
import { toast } from 'sonner'

export function Header() {
  const { setTheme, theme } = useTheme()
  const [syncing, setSyncing] = useState(false)

  const handleSync = useCallback(async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/agents/sync', { method: 'POST' })
      const data = await res.json()
      toast.success(`Synced ${data.synced} agents`)
    } catch {
      toast.error('Sync failed')
    } finally {
      setTimeout(() => setSyncing(false), 1000)
    }
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
      <div className="hidden md:flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground max-sm:hidden">
        <Command className="h-3.5 w-3.5" />
        <span>K</span>
        <span className="mx-1">to open commands</span>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={handleSync} disabled={syncing} aria-label="Sync all agents">
          <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
        </Button>
        <NotificationCenter />
        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding size-8 hover:bg-muted hover:text-foreground transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
            aria-label="User menu"
          >
            <Avatar className="h-8 w-8 pointer-events-none">
              <AvatarFallback aria-hidden="true">CEO</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem role="menuitem">Profile</DropdownMenuItem>
            <DropdownMenuItem role="menuitem">Settings</DropdownMenuItem>
            <DropdownMenuItem role="menuitem">Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
