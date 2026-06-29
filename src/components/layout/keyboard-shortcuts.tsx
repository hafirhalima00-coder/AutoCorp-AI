'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const SHORTCUTS: Record<string, { key: string; label: string; action: string; ctrl?: boolean }> = {
  'g d': { key: 'g d', label: 'Go to Dashboard', action: '/' },
  'g a': { key: 'g a', label: 'Go to Agents', action: '/agents' },
  'g w': { key: 'g w', label: 'Go to Workflow', action: '/workflow' },
  'g c': { key: 'g c', label: 'Go to Communication', action: '/communication' },
  'g p': { key: 'g p', label: 'Go to Approvals', action: '/approvals' },
  'g n': { key: 'g n', label: 'Go to Analytics', action: '/analytics' },
  'g e': { key: 'g e', label: 'Go to Event Log', action: '/events' },
}

export function useKeyboardShortcuts() {
  const router = useRouter()

  useEffect(() => {
    let buffer = ''
    let bufferTimeout: ReturnType<typeof setTimeout> | null = null

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return
      }

      // Help: ? or Shift+/
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        toast('Keyboard Shortcuts', {
          description: Object.values(SHORTCUTS).map(s => `g ${s.key.split(' ')[1]}: ${s.label}`).join('\n') + '\n\n? : Show this help\n⌘K : Command palette',
          duration: 8000,
        })
        return
      }

      // g then letter navigation
      if (e.key === 'g') {
        buffer = 'g '
        if (bufferTimeout) clearTimeout(bufferTimeout)
        bufferTimeout = setTimeout(() => { buffer = '' }, 1000)
        return
      }

      if (buffer.startsWith('g ')) {
        const chord = `g ${e.key}`
        const shortcut = SHORTCUTS[chord]
        if (shortcut) {
          e.preventDefault()
          router.push(shortcut.action)
        }
        buffer = ''
        if (bufferTimeout) clearTimeout(bufferTimeout)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [router])
}
