import { z } from 'zod'

export const createWishlistSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Give your wishlist a title.')
    .max(80, 'Titles are limited to 80 characters.'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters.')
    .max(72, 'Password is too long.'),
})

export const ownerLoginSchema = z.object({
  password: z.string().min(1, 'Enter your password.').max(72),
})

export const codeParamSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{4,10}$/, 'That does not look like a valid wishlist code.'),
})
