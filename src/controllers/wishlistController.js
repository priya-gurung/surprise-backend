import { prisma } from '../lib/prisma.js'
import { hashPassword, verifyPassword } from '../lib/password.js'
import { signOwnerToken, verifyGuestToken, verifyOwnerToken } from '../lib/jwt.js'
import { generateCode } from '../utils/codeGenerator.js'
import { AppError } from '../utils/AppError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { serializeWishlist, serializeItemForOwner, serializeItemForGuest } from '../utils/serialize.js'
import { env } from '../config/env.js'
import { cookieOptions } from "../utils/cookieOptions.js";

async function generateUniqueCode() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode(6)
    const existing = await prisma.wishlist.findUnique({ where: { code } })
    if (!existing) return code
  }
  throw AppError.internal('Could not generate a unique wishlist code, please try again.')
}

export const createWishlist = asyncHandler(async (req, res) => {
  const { title, password } = req.body

  const code = await generateUniqueCode()
  const passwordHash = await hashPassword(password)

  const wishlist = await prisma.wishlist.create({
    data: { code, title, passwordHash },
  })

  const token = signOwnerToken(wishlist)
  res.cookie(env.COOKIE_NAME, token, cookieOptions)

  res.status(201).json({ wishlist: serializeWishlist(wishlist), items: [] })
})

export const ownerLogin = asyncHandler(async (req, res) => {
  const { code } = req.params
  const { password } = req.body

  const wishlist = await prisma.wishlist.findUnique({ where: { code } })
  if (!wishlist) {
    throw AppError.notFound("Couldn't find a wishlist with that code.")
  }

  const valid = await verifyPassword(password, wishlist.passwordHash)
  if (!valid) {
    throw AppError.unauthorized('Incorrect password.')
  }

  const token = signOwnerToken(wishlist)
  res.cookie(env.COOKIE_NAME, token, cookieOptions)

  res.status(200).json({ wishlist: serializeWishlist(wishlist) })
})

export const ownerLogout = asyncHandler(async (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production'
  res.clearCookie(env.COOKIE_NAME, {
    path: '/',
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
  })
  res.status(204).send()
})

// Public: returns the wishlist either as the owner (reservation info
// hidden) or as a guest (reservation info shown), depending on whether a
// valid owner cookie for THIS wishlist is present.
export const getWishlist = asyncHandler(async (req, res) => {
  const { code } = req.params

  const wishlist = await prisma.wishlist.findUnique({
    where: { code },
    include: { items: { orderBy: { createdAt: 'asc' }, include: { reservedBy: true } } },
  })
  if (!wishlist) {
    throw AppError.notFound("Couldn't find a wishlist with that code.")
  }

  let isOwner = false
  let guestId = null
  let guestName = null

  const ownerToken = req.cookies?.[env.COOKIE_NAME]
  if (ownerToken) {
    try {
      const payload = verifyOwnerToken(ownerToken)
      isOwner = payload.code === wishlist.code
    } catch(err) {
      console.log(err);
      isOwner = false
    }
  }

  if (!isOwner) {
    const guestToken = req.cookies?.guest_token

    if (guestToken) {
      try {
        const payload = verifyGuestToken(guestToken)

        if (payload.code === wishlist.code) {
          guestId = payload.guestId
          const guest = await prisma.guest.findUnique({
            where: {
              id: guestId,
            },
          });
          guestName = guest?.displayName;
        }
      } catch(err) {
        console.log(err);
      }
    }
  }

  const items = isOwner? 
  wishlist.items.map(serializeItemForOwner)
  : wishlist.items.map((item) => serializeItemForGuest(item, guestId) 
  )

  res.status(200).json({
    wishlist: serializeWishlist(wishlist),
    items,
    isOwner,
    guest: guestId ? { name: guestName, } : null,
  })
})
