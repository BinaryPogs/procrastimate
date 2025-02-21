import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pusherServer } from '@/lib/pusher'
import { createNotification } from '@/lib/notifications'
import { ApiError } from 'next/dist/server/api-utils'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Simple query to get all friendships
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { user1Id: session.user.id },
          { user2Id: session.user.id }
        ]
      },
      include: {
        user1: true,
        user2: true
      }
    })

    return NextResponse.json(friendships)
  } catch (error: unknown) {
    const apiError = error as ApiError
    console.error('Failed to fetch friendships:', apiError.message)
    return NextResponse.json(
      { error: `Failed to fetch friendships: ${apiError.message}` }, 
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { receiverId } = await request.json()

    // Check for ANY existing friend request (not just PENDING)
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: session.user.id, receiverId },
          { senderId: receiverId, receiverId: session.user.id }
        ]
      }
    })

    if (existingRequest) {
      // If it's rejected, delete it and allow new request
      if (existingRequest.status === 'REJECTED') {
        await prisma.friendRequest.delete({
          where: { id: existingRequest.id }
        })
      } else {
        return NextResponse.json(
          { error: 'Friend request already exists' },
          { status: 400 }
        )
      }
    }

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
        receiverId,
        status: 'PENDING'
      },
      include: {
        sender: true,
        receiver: true
      }
    })

    // Send both database notification and real-time notification
    await Promise.all([
      createNotification({
        userId: receiverId,
        type: 'FRIEND_REQUEST',
        message: `${session.user.name} sent you a friend request`
      }),
      pusherServer.trigger(
        `user-${receiverId}`,
        'friend-request',
        {
          type: 'NEW_REQUEST',
          friendRequest,
          message: `${session.user.name} sent you a friend request`,
          soundEnabled: true
        }
      )
    ])

    return NextResponse.json(friendRequest)
  } catch (error: unknown) {
    const apiError = error as ApiError
    console.error('Friend request error:', apiError.message)
    return NextResponse.json(
      { error: `Failed to send friend request: ${apiError.message}` }, 
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { requestId, status } = await request.json()

    const friendRequest = await prisma.friendRequest.update({
      where: { 
        id: requestId,
        receiverId: session.user.id // Ensure only receiver can update
      },
      data: { status },
      include: {
        sender: true,
        receiver: true
      }
    })

    // If accepted, create actual friendship
    if (status === 'ACCEPTED') {
      await prisma.friendship.create({
        data: {
          user1Id: friendRequest.senderId,
          user2Id: friendRequest.receiverId
        }
      })

      await createNotification({
        userId: friendRequest.senderId,
        type: 'FRIEND_ACCEPTED',
        message: `${session.user.name} accepted your friend request`
      })
    }

    return NextResponse.json(friendRequest)
  } catch (error: unknown) {
    const apiError = error as ApiError
    console.error('Failed to update friend request:', apiError.message)
    return NextResponse.json(
      { error: `Failed to update friend request: ${apiError.message}` }, 
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const friendshipId = searchParams.get('id')
    
    if (!friendshipId) {
      return NextResponse.json({ error: 'Friendship ID required' }, { status: 400 })
    }

    await prisma.friendship.delete({
      where: {
        id: friendshipId,
        OR: [
          { user1Id: session.user.id },
          { user2Id: session.user.id }
        ]
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const apiError = error as ApiError
    console.error('Failed to remove friend:', apiError.message)
    return NextResponse.json(
      { error: `Failed to remove friend: ${apiError.message}` }, 
      { status: 500 }
    )
  }
} 