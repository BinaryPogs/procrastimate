import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { pusherServer } from '@/lib/pusher'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const data = await request.text()
  const [socketId, channelName] = data
    .split('&')
    .map(str => str.split('=')[1])

  const presenceData = {
    user_id: session.user.id,
    user_info: {
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    },
  }

  const authResponse = pusherServer.authorizeChannel(
    socketId,
    channelName,
    presenceData
  )

  return NextResponse.json(authResponse)
} 