import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: {
        isGuest: false,
      },
      select: {
        id: true,
        name: true,
        image: true,
        score: true,
      },
      orderBy: {
        score: 'desc',
      },
      take: 10,
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error)
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
} 