import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pusherServer } from '@/lib/pusher'
import { revalidatePath } from 'next/cache'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: session.user.id },
          { receiverId: session.user.id }
        ]
      },
      include: {
        requester: true,
        receiver: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(friendships)
  } catch (error) {
    console.error('Failed to fetch friendships:', error)
    return NextResponse.json({ error: 'Failed to fetch friendships' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Type assertion after the check
  const user = session.user

  try {
    const { receiverId } = await request.json()

    // Check for existing friendship in a transaction
    const friendship = await prisma.$transaction(async (tx) => {
      const existing = await tx.friendship.findFirst({
        where: {
          OR: [
            {
              requesterId: user.id,
              receiverId: receiverId,
            },
            {
              requesterId: receiverId,
              receiverId: user.id,
            }
          ]
        }
      })

      if (existing?.status === 'REJECTED') {
        await tx.friendship.delete({
          where: { id: existing.id }
        })
      } else if (existing) {
        throw new Error('Friend request already exists')
      }

      return tx.friendship.create({
        data: {
          requesterId: user.id,
          receiverId,
          status: 'PENDING'
        },
        include: {
          requester: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            }
          },
          receiver: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            }
          }
        }
      })
    })

    // Real-time notification
    await pusherServer.trigger(`user-${receiverId}`, 'friend-request', {
      type: 'NEW_REQUEST',
      friendship,
    })

    await revalidatePath('/api/friends/request')
    return NextResponse.json(friendship)
  } catch (error) {
    console.error('Friend request error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send friend request' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Type assertion after the check
  const user = session.user

  try {
    const { friendshipId, status } = await request.json()

    const updatedFriendship = await prisma.$transaction(async (tx) => {
      // Verify ownership and status
      const friendship = await tx.friendship.findFirst({
        where: {
          id: friendshipId,
          receiverId: user.id,
          status: 'PENDING',
        }
      })

      if (!friendship) {
        throw new Error('Friend request not found')
      }

      return tx.friendship.update({
        where: { id: friendshipId },
        data: { status },
        include: {
          requester: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            }
          },
          receiver: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            }
          }
        }
      })
    })

    // Real-time updates
    await pusherServer.trigger(
      [
        `user-${updatedFriendship.requesterId}`,
        `user-${updatedFriendship.receiverId}`
      ],
      'friend-request-update',
      {
        type: status === 'ACCEPTED' ? 'REQUEST_ACCEPTED' : 'REQUEST_REJECTED',
        friendship: updatedFriendship,
      }
    )

    await revalidatePath('/api/friends/request')
    return NextResponse.json(updatedFriendship)
  } catch (error) {
    console.error('Friend request update error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update friend request' },
      { status: 500 }
    )
  }
} 