'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Users, GitBranch, MessageSquare, ShieldCheck, BarChart3, ScrollText, LayoutDashboard, Play, Download, RefreshCw, Zap, FileDown } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { toast } from 'sonner'

interface CommandItem {
  id: string
  label: string
  description: string
  icon: React.ElementType
  action: () => void
  category: string
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const items: CommandItem[] = [
    { id: 'nav-dashboard', label: 'Go to Dashboard', description: 'Executive overview', icon: LayoutDashboard, action: () => router.push('/'), category: 'Navigation' },
    { id: 'nav-agents', label: 'Go to AI Employees', description: 'View all agents', icon: Users, action: () => router.push('/agents'), category: 'Navigation' },
    { id: 'nav-workflow', label: 'Go to Workflow', description: 'Business process', icon: GitBranch, action: () => router.push('/workflow'), category: 'Navigation' },
    { id: 'nav-communication', label: 'Go to Communication', description: 'Agent messages', icon: MessageSquare, action: () => router.push('/communication'), category: 'Navigation' },
    { id: 'nav-approvals', label: 'Go to Approvals', description: 'Pending approvals', icon: ShieldCheck, action: () => router.push('/approvals'), category: 'Navigation' },
    { id: 'nav-analytics', label: 'Go to Analytics', description: 'Charts and metrics', icon: BarChart3, action: () => router.push('/analytics'), category: 'Navigation' },
    { id: 'nav-events', label: 'Go to Event Log', description: 'Audit trail', icon: ScrollText, action: () => router.push('/events'), category: 'Navigation' },
    { id: 'action-sync', label: 'Sync All Agents', description: 'Trigger all agents', icon: RefreshCw, action: () => handleSync(), category: 'Actions' },
    { id: 'action-scenario-1', label: 'Run: High-Volume Order', description: 'Process urgent bulk order', icon: Play, action: () => handleScenario('high-volume'), category: 'Scenarios' },
    { id: 'action-scenario-2', label: 'Run: Refund Request', description: 'Process customer refund >$500', icon: Play, action: () => handleScenario('refund'), category: 'Scenarios' },
    { id: 'action-scenario-3', label: 'Run: Inventory Crisis', description: 'Stock shortage simulation', icon: Zap, action: () => handleScenario('inventory-crisis'), category: 'Scenarios' },
    { id: 'action-scenario-4', label: 'Run: Full Workflow', description: 'Complete order lifecycle', icon: GitBranch, action: () => handleScenario('full-workflow'), category: 'Scenarios' },
    { id: 'export-csv', label: 'Export Events as CSV', description: 'Download event log', icon: FileDown, action: () => handleExport('csv'), category: 'Export' },
    { id: 'export-metrics', label: 'Export Metrics Report', description: 'Download metrics data', icon: Download, action: () => handleExport('metrics'), category: 'Export' },
  ]

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const handleSync = useCallback(async () => {
    setOpen(false)
    try {
      const res = await fetch('/api/agents/sync', { method: 'POST' })
      const data = await res.json()
      toast.success(`Synced ${data.synced} agents`)
    } catch {
      toast.error('Sync failed')
    }
  }, [])

  const handleScenario = useCallback(async (scenario: string) => {
    setOpen(false)
    try {
      const res = await fetch('/api/workflow/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Scenario "${scenario}" completed`, { description: `${data.events?.length ?? 0} events generated` })
      } else {
        toast.error(`Scenario failed: ${data.error}`)
      }
    } catch {
      toast.error('Scenario execution failed')
    }
  }, [])

  const handleExport = useCallback(async (type: string) => {
    setOpen(false)
    try {
      const res = await fetch(`/api/export?type=${type}`)
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = type === 'csv' ? 'autocorp-events.csv' : 'autocorp-metrics.json'
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success(`${type.toUpperCase()} exported`)
    } catch {
      toast.error('Export failed')
    }
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 gap-0 top-[15%] translate-y-0 max-w-lg" aria-label="Command palette">
        <DialogTitle className="sr-only">Command Palette</DialogTitle>
        <Command className="rounded-lg border shadow-lg">
          <CommandInput ref={inputRef} placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {['Navigation', 'Actions', 'Scenarios', 'Export'].map((category) => {
              const categoryItems = items.filter(i => i.category === category)
              if (categoryItems.length === 0) return null
              return (
                <CommandGroup key={category} heading={category}>
                  {categoryItems.map((item) => (
                    <CommandItem
                      key={item.id}
                      onSelect={item.action}
                      className="flex items-center gap-3"
                    >
                      <item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )
            })}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
