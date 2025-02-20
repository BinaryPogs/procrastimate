import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { name } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Create a guest user
    const user = await prisma.user.create({
      data: {
        name,
        email: `guest_${Date.now()}@temporary.user`,
        isGuest: true,
      },
    })

    // Create a session for the guest user
    const session = await prisma.session.create({
      data: {
        sessionToken: `guest_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        userId: user.id,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    })

    return NextResponse.json({ user, session })
  } catch (error) {
    console.error('Guest login error:', error)
    return NextResponse.json(
      { error: 'Failed to create guest user' },
      { status: 500 }
    )
  }
} 