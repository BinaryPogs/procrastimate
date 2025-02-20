'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Medal, Trophy, RefreshCw } from 'lucide-react'
import { SCORING_RULES, getRank } from '@/lib/scoring'
import { motion } from 'framer-motion'
import { Progress } from "@/components/ui/progress"
import { useSession } from 'next-auth/react'
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refreshLeaderboard = useCallback(async () => {
    if (!session?.user?.id) return
    
    setIsRefreshing(true)
    try {
      const response = await fetch('/api/leaderboard')
      if (!response.ok) throw new Error('Failed to fetch leaderboard')
      const data = await response.json()
      setLeaderboard(data)
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
    } finally {
      setIsRefreshing(false)
      setIsLoading(false)
    }
  }, [session?.user?.id])

  // Refresh when localScore changes
  useEffect(() => {
    refreshLeaderboard()
  }, [localScore, refreshLeaderboard])

  // Optimistically update local user's score
  useEffect(() => {
    const userId = session?.user?.id
    if (localScore !== undefined && userId) {
      setLeaderboard(prev => {
        const updated = prev.map(user => 
          user.id === userId
            ? { ...user, score: localScore }
            : user
        )
        return [...updated].sort((a, b) => b.score - a.score)
      })
    }
  }, [localScore, session?.user?.id])

  const currentUser = leaderboard.find(u => u.id === session?.user?.id)
  const effectiveScore = localScore !== undefined ? localScore : currentUser?.score ?? 0
  const currentRank = getRank(effectiveScore)
  const nextRank = SCORING_RULES.RANKS[SCORING_RULES.RANKS.findIndex(r => r.name === currentRank.name) + 1]
  
  const progressToNextRank = nextRank 
    ? ((effectiveScore) - currentRank.minScore) / (nextRank.minScore - currentRank.minScore) * 100
    : 100

  const sortedUsers = [...leaderboard].sort((a, b) => b.score - a.score)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <h2 className="text-xl font-semibold">Leaderboard</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={refreshLeaderboard}
            disabled={isRefreshing}
            className={cn(
              "h-8 w-8 transition-all",
              isRefreshing && "animate-spin"
            )}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Trophy className="h-5 w-5 text-yellow-500" />
        </div>
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