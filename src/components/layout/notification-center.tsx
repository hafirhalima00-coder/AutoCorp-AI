'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Bell, CheckCircle2, AlertTriangle, X, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  type: 'success' | 'warning' | 'info' | 'error'
  title: string
  description?: string
  timestamp: number
  read: boolean
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const seenIds = useRef(new Set<string>())

  const addNotification = useCallback((n: Notification) => {
    if (seenIds.current.has(n.id)) return
    seenIds.current.add(n.id)
    setNotifications(prev => [n, ...prev].slice(0, 50))
    setUnreadCount(prev => prev + 1)
  }, [])

  useEffect(() => {
    const checkEvents = async () => {
      try {
        const res = await fetch('/api/events?result=failure')
        const data = await res.json()
        const failedEvents = data.events ?? []
        const now = Math.floor(Date.now() / 1000)

        for (const evt of failedEvents.slice(0, 3)) {
          if (evt.timestamp > now - 60) {
            addNotification({
              id: evt.id,
              type: 'warning',
              title: `Agent Failure: ${evt.agentName}`,
              description: evt.decision?.substring(0, 100),
              timestamp: evt.timestamp,
              read: false,
            })
          }
        }
      } catch { /* ignore */ }
    }

    const checkApprovals = async () => {
      try {
        const res = await fetch('/api/approvals')
        const data = await res.json()
        const pending = (data.approvals ?? []).filter((a: { status: string; risk: string }) => a.status === 'pending' && a.risk === 'high')

        for (const apr of pending.slice(0, 3)) {
          addNotification({
            id: apr.id,
            type: 'error',
            title: 'High-Risk Approval Required',
            description: `${apr.agentName}: ${apr.action}`,
            timestamp: apr.createdAt,
            read: false,
          })
        }
      } catch { /* ignore */ }
    }

    checkEvents()
    checkApprovals()
    const interval = setInterval(() => {
      checkEvents()
      checkApprovals()
    }, 15000)
    return () => clearInterval(interval)
  }, [addNotification])

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const clearAll = () => {
    setNotifications([])
    setUnreadCount(0)
    seenIds.current.clear()
  }

  return (
    <Sheet>
      <SheetTrigger
        className="group/button relative inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background size-8 hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50 transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </SheetTrigger>
      <SheetContent aria-label="Notifications">
        <SheetHeader className="flex-row items-center justify-between">
          <SheetTitle>Notifications</SheetTitle>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllRead}>Mark all read</Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearAll}>Clear</Button>
          </div>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No notifications</p>
              <p className="text-sm text-muted-foreground">You&apos;re all caught up!</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-lg border p-3 text-left text-sm transition-colors hover:bg-muted/50',
                    !n.read && 'bg-muted/30 border-l-2 border-l-primary'
                  )}
                >
                  {n.type === 'warning' && <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />}
                  {n.type === 'error' && <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />}
                  {n.type === 'success' && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />}
                  {n.type === 'info' && <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{n.title}</p>
                    {n.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.description}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.timestamp * 1000).toLocaleString()}</p>
                  </div>
                  {!n.read && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
