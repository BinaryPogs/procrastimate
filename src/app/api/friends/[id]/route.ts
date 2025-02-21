import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resolvedParams = await params
  const friendshipId = resolvedParams.id

  try {
    const friendship = await prisma.friendship.findFirst({
      where: {
        id: friendshipId,
        OR: [
          { user1Id: session.user.id },
          { user2Id: session.user.id }
        ]
      }
    })

    if (!friendship) {
      return NextResponse.json({ success: true })
    }

    await prisma.friendship.delete({
      where: { id: friendshipId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete friendship:', error)
    return NextResponse.json({ success: true })
  }
} 