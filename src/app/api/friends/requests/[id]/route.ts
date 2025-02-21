import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Assert session type after check
  const user = session.user as { id: string; name?: string | null }

  try {
    const { status } = await request.json()
    const resolvedParams = await params
    const requestId = resolvedParams.id

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      const friendRequest = await tx.friendRequest.findUnique({
        where: { 
          id: requestId,
          receiverId: user.id
        },
        include: {
          sender: true,
          receiver: true
        }
      })

      if (!friendRequest) {
        throw new Error('Request not found')
      }

      if (status === 'ACCEPTED') {
        // Create the friendship
        await tx.friendship.create({
          data: {
            user1Id: friendRequest.senderId,
            user2Id: friendRequest.receiverId
          }
        })

        // Delete the friend request
        await tx.friendRequest.delete({
          where: { id: requestId }
        })

        // Create notification
        await createNotification({
          userId: friendRequest.senderId,
          type: 'FRIEND_ACCEPTED',
          message: `${user.name || 'Someone'} accepted your friend request`
        })

        return { success: true, friendRequest }
      } else {
        // For rejection, just delete the request
        await tx.friendRequest.delete({
          where: { id: requestId }
        })
        return { success: true, friendRequest }
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to handle friend request:', error)
    return NextResponse.json(
      { error: 'Failed to handle friend request' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resolvedParams = await params
  const requestId = resolvedParams.id

  if (!requestId) {
    return NextResponse.json({ error: 'Invalid request ID' }, { status: 400 })
  }

  try {
    // First check if the user has permission to delete this request
    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId }
    })

    if (!friendRequest) {
      return NextResponse.json({ success: true })
    }

    // Allow both sender and receiver to delete the request
    if (friendRequest.senderId !== session.user.id && 
        friendRequest.receiverId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    await prisma.friendRequest.delete({
      where: { id: requestId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete friend request:', error)
    return NextResponse.json({ error: 'Failed to delete friend request' }, { status: 500 })
  }
} 