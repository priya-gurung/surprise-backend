import { z } from 'zod'

const productUrl = z
  .string()
  .trim()
  .min(1, 'Add a link to the item.')
  .max(2048, 'That link is too long.')
  .transform((val) => (/^https?:\/\//i.test(val) ? val : `https://${val}`))
  .refine((val) => {
    try {
      const u = new URL(val)
      return u.protocol === 'http:' || u.protocol === 'https:'
    } catch {
      return false
    }
  }, 'Enter a valid link (e.g. https://example.com/product).')

const title = z
  .string()
  .trim()
  .min(1, 'Give the item a title.')
  .max(80, 'Titles are limited to 80 characters.')

const notes = z
  .string()
  .trim()
  .max(240, 'Notes are limited to 240 characters.')
  .optional()
  .or(z.literal('').transform(() => undefined))

const priority = z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM')

export const createItemSchema = z.object({
  title,
  productUrl,
  notes,
  priority,
})

export const updateItemSchema = z
  .object({
    title: title.optional(),
    productUrl: productUrl.optional(),
    notes,
    priority: priority.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, 'Nothing to update.')

export const reserveItemSchema = z.object({
  reservedBy: z
    .string()
    .trim()
    .min(1, 'Enter your name so it is clear who reserved this.')
    .max(60, 'Name is too long.'),
})

export const unreserveItemSchema = z.object({
  reservedBy: z
    .string()
    .trim()
    .min(1, 'Enter the name this was reserved under.')
    .max(60, 'Name is too long.'),
})

export const itemIdParamSchema = z.object({
  itemId: z.string().uuid('Invalid item id.'),
})
