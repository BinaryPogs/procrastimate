import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface ApiError extends Error {
  status?: number;
  code?: string;
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get existing connections
    const [friendships, friendRequests] = await Promise.all([
      prisma.friendship.findMany({
        where: {
          OR: [
            { user1Id: session.user.id },
            { user2Id: session.user.id }
          ]
        },
        select: {
          user1Id: true,
          user2Id: true
        }
      }),
      prisma.friendRequest.findMany({
        where: {
          OR: [
            { senderId: session.user.id },
            { receiverId: session.user.id }
          ],
          status: 'PENDING'
        },
        select: {
          senderId: true,
          receiverId: true
        }
      })
    ])

    // Get all connected user IDs
    const connectedUserIds = new Set([
      ...friendships.flatMap(f => [f.user1Id, f.user2Id]),
      ...friendRequests.flatMap(r => [r.senderId, r.receiverId])
    ])

    // Get random users who aren't connected
    const recommendations = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: session.user.id } },
          { id: { notIn: Array.from(connectedUserIds) } },
          { isGuest: false }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })

    return NextResponse.json(recommendations)
  } catch (error: unknown) {
    const apiError = error as ApiError
    console.error('Failed to fetch recommendations:', apiError.message)
    return NextResponse.json(
      { error: `Failed to fetch recommendations: ${apiError.message}` }, 
      { status: 500 }
    )
  }
} 