'use client'

import TodoList from '@/components/todo/TodoList'
import FriendsList from '@/components/social/FriendsList'

export function MainDashboard() {
  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <TodoList />
        <FriendsList />
      </div>
    </div>
  )
} 