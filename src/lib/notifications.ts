import { prisma } from '@/lib/prisma'

export async function createNotification({
  userId,
  type,
  message,
}: {
  userId: string
  type: string
  message: string
}) {
  return prisma.notification.create({
    data: {
      userId,
      type,
      message,
    }
  })
} 