import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function DELETE(
  request: Request,
  { params }: RouteContext
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params  // Await the params

    const friendship = await prisma.friendship.findUnique({
      where: { id }
    })

    if (!friendship) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 })
    }

    if (friendship.user1Id !== session.user.id && friendship.user2Id !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to cancel this request' }, { status: 403 })
    }

    await prisma.friendship.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Friend request deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel friend request' },
      { status: 500 }
    )
  }
} 