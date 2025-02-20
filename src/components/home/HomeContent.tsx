'use client'

import { useState, useEffect } from 'react'
import TodoList from "@/components/todo/TodoList"
import LeaderboardCard from "@/components/leaderboard/LeaderboardCard"
import FriendsList from "@/components/social/FriendsList"
import AuthButtons from "@/components/auth/AuthButtons"

interface HomeContentProps {
  userName: string | null | undefined
}

interface LeaderboardUser {
  name: string | null
  score: number
}

export default function HomeContent({ userName }: HomeContentProps) {
  const [localScore, setLocalScore] = useState<number | undefined>(undefined)

  // Fetch initial score
  useEffect(() => {
    async function fetchInitialScore() {
      try {
        const response = await fetch('/api/leaderboard')
        const data = await response.json()
        const userScore = data.find((u: LeaderboardUser) => u.name === userName)?.score ?? 0
        setLocalScore(userScore)
      } catch (error) {
        console.error('Failed to fetch initial score:', error)
      }
    }

    fetchInitialScore()
  }, [userName])

  return (
    <div className="min-h-screen bg-[#FFFBE3]">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-6xl text-gray-900">
              ProcrastiMATE
            </h1>
            <AuthButtons />
          </div>
          
          <div className="bg-white/50 rounded-lg p-6 shadow-sm">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">
                Welcome back, {userName}!
              </h2>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <TodoList onScoreUpdate={setLocalScore} />
          </div>
          
          <div className="lg:col-span-4 space-y-8">
            <LeaderboardCard localScore={localScore} />
            <FriendsList />
          </div>
        </div>
      </main>
    </div>
  )
} 