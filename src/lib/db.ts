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

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    }
  })
}

declare global {
  // eslint-disable-next-line no-var
  var prisma: ReturnType<typeof prismaClientSingleton> | undefined
}

declare global {
  interface Global {
    prisma: ReturnType<typeof prismaClientSingleton> | undefined
  }
}

export const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma 