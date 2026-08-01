import { PrismaClient } from '@prisma/client'
import { env } from '../config/env.js'

// Avoid creating a new PrismaClient per hot-reload in development.
const globalForPrisma = globalThis

export const prisma =
  globalForPrisma.__prisma ||
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma = prisma
}
