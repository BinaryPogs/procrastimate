export const getDatabaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    // Use Vercel's database URL in production
    return process.env.DATABASE_URL
  }
  // Use local database in development
  return process.env.LOCAL_DATABASE_URL
}

// Update this in your prisma.ts or wherever you initialize PrismaClient
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma 