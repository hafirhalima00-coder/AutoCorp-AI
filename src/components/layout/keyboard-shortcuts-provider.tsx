'use client'

import type { ReactNode } from 'react'
import { useKeyboardShortcuts } from './keyboard-shortcuts'

export function KeyboardShortcutsProvider({ children }: { children: ReactNode }) {
  useKeyboardShortcuts()
  return <>{children}</>
}
