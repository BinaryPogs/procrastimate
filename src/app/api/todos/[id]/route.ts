import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { calculateTaskPoints } from '@/lib/scoring'
import { revalidatePath } from 'next/cache'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { completed } = await request.json()
    const { id } = await context.params

    const todo = await prisma.todo.findUnique({
      where: { 
        id,
        userId: session.user.id
      }
    })

    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
    }

    // Prevent uncompleting if already uncompleted
    if (!completed && !todo.completed) {
      return NextResponse.json({ error: 'Task is already uncompleted' }, { status: 400 })
    }

    // Prevent multiple amendments
    if (!completed && todo.completed && todo.amendedOnce) {
      return NextResponse.json({ error: 'Cannot uncheck a completed task more than once' }, { status: 400 })
    }

    const points = calculateTaskPoints(todo, { completed })

    const [updatedTodo, updatedUser] = await prisma.$transaction([
      prisma.todo.update({
        where: { id },
        data: { 
          completed,
          // Track if this task has been amended (uncompleted) before
          amendedOnce: !completed && todo.completed ? true : todo.amendedOnce
        }
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          score: { increment: points }
        },
        select: {
          id: true,
          score: true,
          name: true,
          image: true
        }
      })
    ])

    console.log('Task update:', {
      previousState: todo,
      newState: updatedTodo,
      points
    })

    await revalidatePath('/api/todos')
    await revalidatePath('/api/leaderboard')

    return NextResponse.json({ 
      todo: updatedTodo, 
      points,
      user: updatedUser 
    })
  } catch (error) {
    console.error('Failed to update todo:', error)
    return NextResponse.json({ error: 'Failed to update todo' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await context.params
    
    await prisma.todo.delete({
      where: {
        id,
        userId: session.user.id,
      },
    })

    await revalidatePath('/api/todos')
    await revalidatePath('/api/leaderboard')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete todo:', error)
    return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 })
  }
} 