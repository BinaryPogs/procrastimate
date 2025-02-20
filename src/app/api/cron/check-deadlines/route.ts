import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SCORING_RULES } from '@/lib/scoring'

export async function GET() {
  const now = new Date()
  
  // Find all incomplete tasks past their deadline
  const failedTasks = await prisma.todo.findMany({
    where: {
      completed: false,
      failed: false,
      deadline: {
        lt: now
      }
    },
    include: {
      user: true
    }
  })

  // Update scores and mark tasks as failed
  for (const task of failedTasks) {
    await prisma.$transaction([
      // Mark task as failed
      prisma.todo.update({
        where: { id: task.id },
        data: { failed: true }
      }),
      // Update user score with penalty
      prisma.user.update({
        where: { id: task.userId },
        data: {
          score: {
            increment: SCORING_RULES.FAILURE_PENALTY
          }
        }
      })
    ])
  }

  return NextResponse.json({ processed: failedTasks.length })
} 