'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import AddTodoForm from '@/components/todo/AddTodoForm'
import TodoItem from '@/components/todo/TodoItem'
import { toast } from 'sonner'
import { Info } from 'lucide-react'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Button } from "@/components/ui/button"

interface Todo {
  id: string
  title: string
  completed: boolean
  userId: string
  createdAt: Date
  updatedAt: Date
  points: number
  deadline: Date
  failed: boolean
}

interface ApiError {
  message: string;
}

export default function TodoList() {
  const { data: session } = useSession()
  const [todos, setTodos] = useState<Todo[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.id) {
      fetchTodos()
    }
  }, [session?.user?.id])

  const fetchTodos = async () => {
    try {
      const response = await fetch('/api/todos')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch todos')
      }
      
      setTodos(data)
    } catch (error: unknown) {
      const err = error as ApiError
      console.error('Failed to load todos:', err)
      toast.error(err.message || 'Failed to load todos')
    } finally {
      setIsLoading(false)
    }
  }

  const addTodo = async (title: string) => {
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add todo')
      }
      
      setTodos(prev => [data, ...prev])
      toast.success('Todo added')
    } catch (error: unknown) {
      const err = error as ApiError
      console.error('Failed to add todo:', err)
      toast.error(err.message || 'Failed to add todo')
    }
  }

  const toggleTodo = async (id: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update todo')
      }
      
      setTodos(prev => prev.map(todo => 
        todo.id === id ? data : todo
      ))
      return data
    } catch (error: unknown) {
      const err = error as ApiError
      console.error('Failed to update todo:', err)
      toast.error(err.message || 'Failed to update todo')
      throw err  // Re-throw to handle in TodoItem
    }
  }

  const deleteTodo = async (id: string) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete todo')
      }
      
      setTodos(prev => prev.filter(todo => todo.id !== id))
      toast.success('Todo deleted')
    } catch (error: unknown) {
      const err = error as ApiError
      console.error('Failed to delete todo:', err)
      toast.error(err.message || 'Failed to delete todo')
    }
  }

  if (!session) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-semibold">Your Tasks</h2>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Sign in to manage your tasks</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Your Tasks</h2>
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="ghost" size="icon">
                <Info className="h-5 w-5 text-muted-foreground" />
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">How Points Work</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Each task is worth 10 base points</p>
                  <p>• Complete tasks early for +5 bonus points</p>
                  <p>• Failed tasks (not completed by end of day) lose 5 points</p>
                  <p>• Compete with friends on the leaderboard</p>
                </div>
                <div className="mt-4 text-xs">
                  <span className="font-medium">Pro tip:</span> Complete tasks early in the day for maximum points!
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <AddTodoForm onAdd={addTodo} />
        {isLoading ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          todos.map(todo => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={toggleTodo}
              onDelete={deleteTodo}
            />
          ))
        )}
      </CardContent>
    </Card>
  )
}
