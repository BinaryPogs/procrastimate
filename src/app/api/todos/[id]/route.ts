import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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
  const todo = await prisma.todo.update({
    where: {
      id: id,
      userId: session.user.id,
    },
    data: { completed },
  })

  return NextResponse.json(todo)
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