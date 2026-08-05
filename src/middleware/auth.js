import { env } from '../config/env.js'
import { verifyGuestToken, verifyOwnerToken } from '../lib/jwt.js'
import { AppError } from '../utils/AppError.js'

/**
 * Requires a valid owner session cookie AND that the session's wishlist
 * code matches req.params.code. Attaches req.ownerWishlistId on success.
 */
export function requireOwner(req, res, next) {
  //check for bearer token
  const authHeader = req.headers.authorization
  let token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null

  //Fall back to Cookie (Desktop)
  if (!token) {
    token = req.cookies?.[env.COOKIE_NAME]
  }

  if (!token) {
    return next(AppError.unauthorized('Log in as the wishlist owner to do this.'))
  }

  let payload
  try {
    payload = verifyOwnerToken(token)
  } catch (err) {
    return next(AppError.unauthorized('Your session has expired — please log in again.'))
  }

  const codeParam = (req.params.code || '').toUpperCase()
  if (payload.code !== codeParam) {
    return next(AppError.forbidden('This session does not belong to this wishlist.'))
  }

  req.ownerWishlistId = payload.wishlistId
  next()
}

export function requireGuest(req, res, next) {
  const guestHeader = req.headers['x-guest-token'] || 
                     (req.headers.authorization?.startsWith('Guest ') 
                        ? req.headers.authorization.split(' ')[1] 
                        : null)
  const token = guestHeader || req.cookies?.[env.GUEST_COOKIE_NAME]
  console.log("Token retrieved:", token ? "Present" : "Missing");
  
  if(!token) return next(AppError.unauthorized('Log in or register to do this'))
  
  let payload
  try {
    payload = verifyGuestToken(token)
  } catch {
    return next(AppError.unauthorized('Your session has expired. Please login again.'))
  }

  const codeParam = (req.params.code || '').toUpperCase()
  if(payload.code !== codeParam){
    return next(AppError.forbidden('This session does not belong to this wishlist.'))
  }

  req.guestId = payload.guestId
  req.guestName = payload.name 
  next()
}