import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ApiError } from 'next/dist/server/api-utils'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Assert session type after check
  const user = session.user as { id: string; name?: string | null }

  try {
    // Get all friendships for the current user
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { user1Id: user.id },
          { user2Id: user.id }
        ]
      },
      include: {
        user1: true,
        user2: true
      }
    })

    // Transform the data to always show the other user
    const friends = friendships.map(friendship => {
      const otherUser = friendship.user1Id === user.id 
        ? friendship.user2 
        : friendship.user1
      return {
        friendshipId: friendship.id,
        user: otherUser
      }
    })

    return NextResponse.json(friends)
  } catch (error: unknown) {
    const apiError = error as ApiError
    console.error('Failed to fetch friends:', apiError.message)
    return NextResponse.json(
      { error: `Failed to fetch friends: ${apiError.message}` }, 
      { status: 500 }
    )
  }
} 