import { AppError } from '../utils/AppError.js'

/**
 * Validates req.body (or req.query) against a Zod schema. On success,
 * replaces the target with the parsed/sanitized data (trimmed strings,
 * defaults applied, etc). On failure, responds 400 with per-field messages.
 */
export const validate =
  (schema, target = 'body') =>
  (req, res, next) => {
    const result = schema.safeParse(req[target])
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || target,
        message: issue.message,
      }))
      return next(AppError.badRequest('Please check the highlighted fields.', details))
    }
    req[target] = { ...req[target], ...result.data }
    next()
  }
