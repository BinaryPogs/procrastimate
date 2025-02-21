import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'
import { ApiError } from 'next/dist/server/api-utils'
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get pending requests received by the user
    const requests = await prisma.friendRequest.findMany({
      where: {
        receiverId: session.user.id,
        status: 'PENDING'
      },
      include: {
        sender: true
      }
    })

    return NextResponse.json(requests)
  } catch (error: unknown) {
    const apiError = error as ApiError
    console.error('Failed to fetch friend requests:', apiError.message)
    return NextResponse.json(
      { error: `Failed to fetch friend requests: ${apiError.message}` }, 
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { receiverId } = await request.json()

    // Check if already friends
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id: session.user.id, user2Id: receiverId },
          { user1Id: receiverId, user2Id: session.user.id }
        ]
      }
    })

    if (existingFriendship) {
      return NextResponse.json(
        { error: 'Already friends' },
        { status: 400 }
      )
    }

    // Create friend request
    const friendRequest = await prisma.friendRequest.create({
      data: {
        senderId: session.user.id,
        receiverId
      },
      include: {
        sender: true,
        receiver: true
      }
    })

    // Notify receiver
    await createNotification({
      userId: receiverId,
      type: 'FRIEND_REQUEST',
      message: `${session.user.name} sent you a friend request`
    })

    return NextResponse.json(friendRequest)
  } catch (error: unknown) {
    const apiError = error as ApiError
    console.error('Failed to send friend request:', apiError.message)
    return NextResponse.json(
      { error: `Failed to send friend request: ${apiError.message}` }, 
      { status: 500 }
    )
  }
} 