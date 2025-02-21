import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Add conditional logic for database URL
// const databaseUrl = process.env.NODE_ENV === 'production' 
//   ? process.env.PROD_DATABASE_URL
//   : process.env.DATABASE_URL

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma 