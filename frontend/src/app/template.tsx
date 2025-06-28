"use client"

import { UserProvider } from '@auth0/nextjs-auth0/client'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="system" storageKey="carecall-theme">
      <UserProvider>
        {children}
        <Toaster />
      </UserProvider>
    </ThemeProvider>
  )
} 