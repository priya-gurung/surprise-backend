import { z } from 'zod'

export const guestAuthSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(50),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})