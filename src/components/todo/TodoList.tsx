'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import AddTodoForm from '@/components/todo/AddTodoForm'
import TodoItem from '@/components/todo/TodoItem'
import { toast } from 'sonner'

interface Todo {
  id: string
  title: string
  completed: boolean
  userId: string
  createdAt: Date
  updatedAt: Date
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
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch todos')
      }
      const data = await response.json()
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
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add todo')
      }
      const newTodo = await response.json()
      setTodos(prev => [newTodo, ...prev])
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
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update todo')
      }
      
      setTodos(prev => prev.map(todo => 
        todo.id === id ? { ...todo, completed } : todo
      ))
    } catch (error: unknown) {
      const err = error as ApiError
      console.error('Failed to update todo:', err)
      toast.error(err.message || 'Failed to update todo')
    }
  }

  const deleteTodo = async (id: string) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const data = await response.json()
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
        <h2 className="text-2xl font-semibold">Your Tasks</h2>
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
