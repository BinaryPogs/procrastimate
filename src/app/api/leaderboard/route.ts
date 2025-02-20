import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
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
} 