import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ApiError } from 'next/dist/server/api-utils'
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sentRequests = await prisma.friendRequest.findMany({
      where: {
        senderId: session.user.id,
        status: 'PENDING'
      },
      include: {
        receiver: true
      }
    })

    return NextResponse.json(sentRequests)
  } catch (error: unknown) {
    const apiError = error as ApiError
    console.error('Failed to fetch sent requests:', apiError.message)
    return NextResponse.json(
      { error: `Failed to fetch sent requests: ${apiError.message}` }, 
      { status: 500 }
    )
  }
} 