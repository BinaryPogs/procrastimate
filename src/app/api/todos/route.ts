import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const todos = await prisma.todo.findMany({
    where: {
      userId: session.user.id
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return NextResponse.json(todos)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const { title } = await request.json()
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Set deadline to end of current day
    const deadline = new Date()
    deadline.setHours(23, 59, 59, 999)

    const todo = await prisma.todo.create({
      data: {
        title: title.trim(),
        userId: user.id,  // Use verified user ID
        deadline,
        points: 10,
        completed: false,
        failed: false
      }
    })

    console.log('Created todo:', todo)
    return NextResponse.json(todo)
  } catch (error) {
    console.error('Failed to create todo:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create todo' },
      { status: 500 }
    )
  }
} 