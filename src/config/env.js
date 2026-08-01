import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:5173'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  COOKIE_NAME: z.string().default('owner_token'),
  COOKIE_SECURE: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().default(300),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(20),
  LINK_PREVIEW_TIMEOUT_MS: z.coerce.number().default(8000),
  LINK_PREVIEW_CACHE_TTL_HOURS: z.coerce.number().default(168),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment configuration:')
  console.error(parsed.error.flatten().fieldErrors)
  // In test runs we allow missing DATABASE_URL/JWT_SECRET to be supplied by
  // the test setup file instead of a .env file, so don't hard-exit there.
  if (process.env.NODE_ENV !== 'test') {
    process.exit(1)
  }
}

export const env = parsed.success
  ? parsed.data
  : envSchema.parse({
      ...process.env,
      JWT_SECRET: process.env.JWT_SECRET || 'test-secret-test-secret-1234',
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test',
    })

// origins allowed to send credentialed requests
export const corsOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim())
