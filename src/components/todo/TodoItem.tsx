'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Lock, Trash } from 'lucide-react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface Todo {
  id: string
  title: string
  completed: boolean
  points: number
  deadline: Date
  failed: boolean
  userId?: string
  userName?: string
  pointsAwarded: boolean
}

interface TodoItemProps {
  todo: Todo
  onToggle: (id: string, completed: boolean) => Promise<void>
  onDelete: (id: string) => Promise<void>
  isPending?: boolean
  isOptimistic?: boolean
}

export default function TodoItem({ todo, onToggle, onDelete, isPending = false, isOptimistic = false }: TodoItemProps) {
  const [isLocking, setIsLocking] = useState(false)
  const [timeLeft, setTimeLeft] = useState(10)

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (todo.completed && !todo.pointsAwarded) {
      setIsLocking(true)
      setTimeLeft(10)
      
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      // Lock after 10 seconds
      setTimeout(() => {
        setIsLocking(false)
      }, 10000)
    }

    return () => {
      clearInterval(timer)
    }
  }, [todo.completed, todo.pointsAwarded])

  const handleStatusChange = async (completed: boolean) => {
    try {
      await onToggle(todo.id, completed)
    } catch (err) {
      console.error('Failed to update task:', err)
      toast.error('Failed to update task')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0.8, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center justify-between py-3 group ${
        isPending ? 'opacity-50' : ''
      } ${isOptimistic ? 'opacity-70' : ''}`}
    >
      <div className="flex items-center space-x-4">
        <Checkbox
          checked={todo.completed}
          onCheckedChange={(checked) => handleStatusChange(checked as boolean)}
          className="h-5 w-5"
          disabled={isPending || isOptimistic || (todo.completed && !isLocking && todo.pointsAwarded)}
        />
        <div>
          <p className={`text-sm font-medium ${todo.completed ? 'line-through text-gray-500' : ''}`}>
            {todo.title}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{todo.points} points</span>
            <span>•</span>
            <span>Due {format(new Date(todo.deadline), 'h:mm a')}</span>
            {todo.failed && <Badge variant="destructive">Failed</Badge>}
          </div>
          {todo.userName && (
            <p className="text-xs text-gray-500">
              Assigned to: {todo.userName}
            </p>
          )}
          {isLocking && (
            <p className="text-xs text-muted-foreground">
              Locks in {timeLeft} seconds...
            </p>
          )}
          {todo.completed && !isLocking && todo.pointsAwarded && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Locked
            </p>
          )}
        </div>
      </div>

      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(todo.id)}
          className="h-8 w-8"
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  )
} 