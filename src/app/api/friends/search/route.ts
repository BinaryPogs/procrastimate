import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { Prisma } from '@prisma/client'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query) {
    // Return recent users when no search query
    const recentUsers = await prisma.user.findMany({
      where: {
        id: { not: session.user.id },
        isGuest: false as const,
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
      take: 5,
    })
    return NextResponse.json({ users: recentUsers })
  }

  const filter = searchParams.get('filter') || 'all'

  const searchCondition = filter === 'all' 
    ? {
        OR: [
          { name: { contains: query, mode: Prisma.QueryMode.insensitive } },
          { email: { contains: query, mode: Prisma.QueryMode.insensitive } },
        ],
      }
    : filter === 'name'
    ? { name: { contains: query, mode: Prisma.QueryMode.insensitive } }
    : { email: { contains: query, mode: Prisma.QueryMode.insensitive } }

  const users = await prisma.user.findMany({
    where: {
      AND: [
        searchCondition,
        { id: { not: session.user.id } },
        { isGuest: false as const },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
    take: 5,
  })

  return NextResponse.json({ users })
} 