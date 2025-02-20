import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const todos = await prisma.todo.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: [
        { completed: 'asc' },
        { deadline: 'asc' },
        { createdAt: 'desc' }
      ]
    })
    return NextResponse.json(todos)
  } catch (error) {
    console.error('Failed to fetch todos:', error)
    return NextResponse.json({ error: 'Failed to fetch todos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { title } = await request.json()
    
    const todo = await prisma.todo.create({
      data: {
        title,
        userId: session.user.id,
        deadline: new Date(new Date().setHours(23, 59, 59, 999)), // End of day
        points: 10
      }
    })

    await revalidatePath('/api/todos')

    return NextResponse.json(todo)
  } catch (error) {
    console.error('Failed to create todo:', error)
    return NextResponse.json({ error: 'Failed to create todo' }, { status: 500 })
  }
} 