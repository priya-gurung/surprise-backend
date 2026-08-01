import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

/**
 * Owner sessions are scoped to a single wishlist: the token carries the
 * wishlist's id and code, and every owner-only route checks that the
 * token's code matches the :code in the URL. This keeps things simple
 * (no user accounts) while still preventing one wishlist's owner from
 * editing a different wishlist just because they're logged in somewhere.
 */
export function signOwnerToken(wishlist) {
  return jwt.sign({ wishlistId: wishlist.id, code: wishlist.code }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  })
}

export function verifyOwnerToken(token) {
  return jwt.verify(token, env.JWT_SECRET)
}
