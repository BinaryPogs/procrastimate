'use client'

import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface LeaderboardEntry {
  id: string
  name: string
  avatar?: string
  score: number
  tasksCompleted: number
  tasksFailed: number
}

const mockLeaderboard: LeaderboardEntry[] = [
  { id: '1', name: 'Alice', score: 95, tasksCompleted: 20, tasksFailed: 1 },
  { id: '2', name: 'Bob', score: 85, tasksCompleted: 18, tasksFailed: 3 },
  { id: '3', name: 'Charlie', score: 75, tasksCompleted: 15, tasksFailed: 5 },
]   

export default function LeaderboardCard() {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Leaderboard</h2>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockLeaderboard.map((entry, index) => (
            <div key={entry.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center font-semibold">
                  #{index + 1}
                </div>
                <Avatar>
                  <AvatarImage src={entry.avatar} />
                  <AvatarFallback>{entry.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{entry.name}</p>
                  <p className="text-sm text-gray-500">
                    {entry.tasksCompleted} completed • {entry.tasksFailed} failed
                  </p>
                </div>
              </div>
              <span className="font-semibold">{entry.score}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 