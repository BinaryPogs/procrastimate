'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Undo2 } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface Todo {
  id: string
  title: string
  completed: boolean
  userId?: string
  userName?: string
  dueDate?: Date
}

interface TodoItemProps {
  todo: Todo
  onToggle: (id: string, completed: boolean) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export default function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  const handleStatusChange = (completed: boolean) => {
    setIsAnimating(true)
    onToggle(todo.id, completed)
    setTimeout(() => setIsAnimating(false), 300)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1, y: 0, scale: 1 }}
        animate={{
          opacity: isAnimating ? 0.6 : 1,
          scale: isAnimating ? 0.98 : 1,
          y: isAnimating ? -2 : 0,
        }}
        transition={{
          duration: 0.3,
          ease: "easeInOut"
        }}
        className="flex items-center justify-between py-3 group"
      >
        <div className="flex items-center space-x-4">
          <Checkbox
            checked={todo.completed}
            onCheckedChange={(checked) => handleStatusChange(checked as boolean)}
            className="h-5 w-5"
          />
          <div>
            <p className={`text-sm font-medium ${todo.completed ? 'line-through text-gray-500' : ''}`}>
              {todo.title}
            </p>
            {todo.userName && (
              <p className="text-xs text-gray-500">
                Assigned to: {todo.userName}
              </p>
            )}
          </div>
        </div>

        {todo.completed && (
          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleStatusChange(false)}
                  >
                    <Undo2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Undo completion</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
} 