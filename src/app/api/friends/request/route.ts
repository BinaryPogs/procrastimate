import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { pusherServer } from '@/lib/pusher'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { receiverId } = await request.json()

    // Check if friendship already exists
    const existingFriendship = await prisma.friendship.findUnique({
      where: {
        requesterId_receiverId: {
          requesterId: session.user.id,
          receiverId: receiverId,
        },
      },
    })

    if (existingFriendship) {
      return NextResponse.json(
        { error: 'Friend request already sent' },
        { status: 400 }
      )
    }

    // Check reverse friendship
    const reverseExistingFriendship = await prisma.friendship.findUnique({
      where: {
        requesterId_receiverId: {
          requesterId: receiverId,
          receiverId: session.user.id,
        },
      },
    })

    if (reverseExistingFriendship) {
      return NextResponse.json(
        { error: 'Friend request already received from this user' },
        { status: 400 }
      )
    }

    // Create new friendship
    const friendship = await prisma.friendship.create({
      data: {
        requesterId: session.user.id,
        receiverId: receiverId,
        status: 'PENDING',
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    // Trigger real-time update
    await pusherServer.trigger(`user-${receiverId}`, 'friend-request', {
      type: 'NEW_REQUEST',
      friendship,
    })

    return NextResponse.json(friendship)
  } catch (error) {
    console.error('Friend request error:', error)
    return NextResponse.json(
      { error: 'Failed to send friend request' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get all friend requests (both sent and received)
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { requesterId: session.user.id },
        { receiverId: session.user.id },
      ],
    },
    include: {
      requester: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      receiver: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return NextResponse.json(friendships)
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { friendshipId, status } = await request.json()

    // Verify the user is the receiver of the friend request
    const friendship = await prisma.friendship.findFirst({
      where: {
        id: friendshipId,
        receiverId: session.user.id,
        status: 'PENDING',
      },
    })

    if (!friendship) {
      return NextResponse.json(
        { error: 'Friend request not found' },
        { status: 404 }
      )
    }

    // Update friendship status
    const updatedFriendship = await prisma.friendship.update({
      where: { id: friendshipId },
      data: { status },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    // Trigger real-time update for both users
    await pusherServer.trigger(
      [`user-${updatedFriendship.requesterId}`, `user-${updatedFriendship.receiverId}`],
      'friend-request-update',
      {
        type: status === 'ACCEPTED' ? 'REQUEST_ACCEPTED' : 'REQUEST_REJECTED',
        friendship: updatedFriendship,
      }
    )

    return NextResponse.json(updatedFriendship)
  } catch (error) {
    console.error('Friend request update error:', error)
    return NextResponse.json(
      { error: 'Failed to update friend request' },
      { status: 500 }
    )
  }
} 