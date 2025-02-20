import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all existing friendship IDs for the current user
    const existingFriendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: session.user.id },
          { receiverId: session.user.id }
        ],
        status: { in: ['ACCEPTED', 'PENDING'] }
      },
      select: {
        requesterId: true,
        receiverId: true
      }
    })

    // Extract all user IDs that are already connected
    const connectedUserIds = new Set([
      ...existingFriendships.map(f => f.requesterId),
      ...existingFriendships.map(f => f.receiverId)
    ])

    // Get users who aren't connected yet
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
        image: true,
        isGuest: true
      },
      take: 10,
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('Found recommendations:', recommendations.length)

    // Cache the response for 1 minute
    return new NextResponse(JSON.stringify({ users: recommendations }), {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      },
    })
  } catch (error) {
    console.error('Recommendations error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    )
  }
} 