import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { calculateTaskPoints } from '@/lib/scoring'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { completed } = await request.json()
  const now = new Date()

  const todo = await prisma.todo.findUnique({
    where: { id }
  })

  if (!todo) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
  }

  // Calculate points if completing the task
  if (completed && !todo.completed) {
    const points = calculateTaskPoints(todo, now)
    
    await prisma.$transaction([
      // Update todo
      prisma.todo.update({
        where: { id },
        data: { completed }
      }),
      // Update user score
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          score: {
            increment: points
          }
        }
      })
    ])

    return NextResponse.json({ ...todo, completed, points })
  }

  // Regular update if just unchecking
  const updatedTodo = await prisma.todo.update({
    where: { id },
    data: { completed }
  })

  return NextResponse.json(updatedTodo)
}

export async function DELETE(
  request: Request,
  { params }: RouteContext
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await prisma.todo.delete({
    where: {
      id: id,
      userId: session.user.id,
    },
  })

  return NextResponse.json({ success: true })
} 