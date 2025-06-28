"use client"

import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="system" storageKey="carecall-theme">
      {children}
      <Toaster />
    </ThemeProvider>
  )
} 