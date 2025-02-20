import TodoList from "@/components/todo/TodoList"
import LeaderboardCard from "@/components/leaderboard/LeaderboardCard"
import FriendsList from "@/components/social/FriendsList"
import AuthButtons from "@/components/auth/AuthButtons"
import { WelcomeScreen } from '@/components/welcome/welcome-screen'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return <WelcomeScreen />
  }

  return (
    <div className="min-h-screen bg-[#FFFBE3]">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-6xl text-gray-900">
              Procrastimate
            </h1>
            <AuthButtons />
          </div>
          
          <div className="bg-white/50 rounded-lg p-6 shadow-sm">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">
                Welcome back, {session.user?.name}!
              </h2>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <TodoList />
          </div>
          
          <div className="lg:col-span-4 space-y-8">
            <LeaderboardCard />
            <FriendsList />
          </div>
        </div>
      </main>
    </div>
  )
}