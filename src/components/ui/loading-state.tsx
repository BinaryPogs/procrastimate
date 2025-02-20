'use client'

import { Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface LoadingStateProps {
  title?: string
  description?: string
  fullScreen?: boolean
}

export function LoadingState({ 
  title = "Loading...", 
  description = "Please wait while we set things up.",
  fullScreen = false 
}: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center space-y-4 text-center
      ${fullScreen ? 'min-h-screen' : 'py-12'}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </motion.div>
      <div className="space-y-2">
        <h3 className="text-xl font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          {description}
        </p>
      </div>
    </div>
  )
} 