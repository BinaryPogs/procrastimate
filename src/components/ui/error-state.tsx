'use client'

import { XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

interface ErrorStateProps {
  title?: string
  description?: string
  fullScreen?: boolean
  retry?: () => void
}

export function ErrorState({
  title = "Something went wrong",
  description = "There was an error loading this content. Please try again.",
  fullScreen = false,
  retry
}: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center space-y-4 text-center
      ${fullScreen ? 'min-h-screen' : 'py-12'}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <XCircle className="h-12 w-12 text-destructive" />
      </motion.div>
      <div className="space-y-2">
        <h3 className="text-xl font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          {description}
        </p>
        {retry && (
          <Button
            onClick={retry}
            className="mt-4"
          >
            Try Again
          </Button>
        )}
      </div>
    </div>
  )
} 