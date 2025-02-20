import { WelcomeScreen } from '@/components/welcome/welcome-screen'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import HomeContent from '@/components/home/HomeContent'

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return <WelcomeScreen />
  }

  return <HomeContent userName={session.user?.name ?? null} />
}