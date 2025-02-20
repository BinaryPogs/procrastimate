'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Medal, Trophy } from 'lucide-react'
import { SCORING_RULES, getRank } from '@/lib/scoring'
import { motion } from 'framer-motion'
import { Progress } from "@/components/ui/progress"
import { useSession } from 'next-auth/react'

interface LeaderboardUser {
  id: string
  name: string | null
  image: string | null
  score: number
}

interface LeaderboardCardProps {
  localScore?: number;
}

export default function LeaderboardCard({ localScore }: LeaderboardCardProps) {
  const { data: session } = useSession()
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const response = await fetch('/api/leaderboard')
        const data = await response.json()
        setUsers(data)
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

  useEffect(() => {
    if (localScore !== undefined && session?.user?.id) {
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === session.user?.id 
            ? { ...user, score: localScore }
            : user
        )
      )
    }
  }, [localScore, session?.user?.id])

  const currentUser = users.find(u => u.id === session?.user?.id)
  const effectiveScore = localScore !== undefined ? localScore : currentUser?.score ?? 0
  const currentRank = getRank(effectiveScore)
  const nextRank = SCORING_RULES.RANKS[SCORING_RULES.RANKS.findIndex(r => r.name === currentRank.name) + 1]
  
  const progressToNextRank = nextRank 
    ? ((effectiveScore) - currentRank.minScore) / (nextRank.minScore - currentRank.minScore) * 100
    : 100

  const sortedUsers = [...users].sort((a, b) => b.score - a.score)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <h2 className="text-xl font-semibold">Leaderboard</h2>
        <Trophy className="h-5 w-5 text-yellow-500" />
      </CardHeader>
      
      {currentUser && (
        <div className="px-6 pb-4 border-b">
          <div className="flex items-center gap-4 mb-2">
            <Avatar>
              <AvatarImage src={currentUser.image ?? undefined} />
              <AvatarFallback>{currentUser.name?.[0] ?? 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">Your Rank: {currentRank.name}</p>
              <p className="text-sm text-muted-foreground">{effectiveScore} points</p>
            </div>
          </div>
          {nextRank && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>{currentRank.name}</span>
                <span>{nextRank.name}</span>
              </div>
              <Progress value={progressToNextRank} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {nextRank.minScore - effectiveScore} points to next rank
              </p>
            </div>
          )}
        </div>
      )}

      <CardContent className="pt-4">
        {isLoading ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          <div className="space-y-4">
            {sortedUsers.map((user, index) => {
              const userScore = user.id === session?.user?.id ? effectiveScore : user.score
              const rank = getRank(userScore)
              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between mb-4"
                >
                  <div className="flex items-center gap-3">
                    {index < 3 ? (
                      <Medal className={
                        index === 0 ? "text-yellow-500" :
                        index === 1 ? "text-gray-400" :
                        "text-amber-600"
                      } />
                    ) : (
                      <span className="w-6 text-muted-foreground">{index + 1}.</span>
                    )}
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.image ?? undefined} />
                      <AvatarFallback>{user.name?.[0] ?? 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className={`text-sm ${rank.color}`}>
                        {rank.name} • {userScore} points
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 