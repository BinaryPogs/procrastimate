'use client'

import { SessionProvider } from "next-auth/react"
import { Toaster } from 'sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Toaster 
        position="top-right" 
        expand={true}
        richColors
        closeButton
      />
      {children}
    </SessionProvider>
  )
} 