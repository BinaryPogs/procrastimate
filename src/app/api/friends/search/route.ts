import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query || query.length < 2) {
    return NextResponse.json([])
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

    // Search for users
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } }
            ]
          },
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
      take: 10
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
} 