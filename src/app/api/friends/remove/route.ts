import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pusherServer } from '@/lib/pusher'
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { friendshipId } = await request.json()
    
    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
      include: { user1: true, user2: true }
    })

    if (!friendship) {
      return NextResponse.json({ error: 'Friendship not found' }, { status: 404 })
    }

    // Verify user is part of the friendship
    if (friendship.user1Id !== session.user.id && friendship.user2Id !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Delete the friendship
    await prisma.friendship.delete({
      where: { id: friendshipId }
    })

    // Notify the other user
    const otherUserId = friendship.user1Id === session.user.id 
      ? friendship.user2Id 
      : friendship.user1Id

    await pusherServer.trigger(
      `user-${otherUserId}`,
      'friend-removed',
      {
        friendshipId,
        removedBy: session.user.id
      }
    )

    await revalidatePath('/api/friends/request')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove friend error:', error)
    return NextResponse.json(
      { error: 'Failed to remove friend' },
      { status: 500 }
    )
  }
} 