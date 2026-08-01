import { prisma } from '../lib/prisma.js'
import { getLinkPreview } from '../lib/linkPreview.js'
import { AppError } from '../utils/AppError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { serializeItemForOwner, serializeItemForGuest } from '../utils/serialize.js'

async function findWishlistOr404(code) {
  const wishlist = await prisma.wishlist.findUnique({ where: { code } })
  if (!wishlist) throw AppError.notFound("Couldn't find a wishlist with that code.")
  return wishlist
}

async function findItemOr404(wishlistId, itemId) {
  const item = await prisma.item.findFirst({ where: { id: itemId, wishlistId } })
  if (!item) throw AppError.notFound('Item not found on this wishlist.')
  return item
}

// ---------- owner-only ----------

export const addItem = asyncHandler(async (req, res) => {
  const wishlist = await findWishlistOr404(req.params.code)
  const { title, productUrl, notes, priority } = req.body

  const duplicate = await prisma.item.findFirst({
    where: { wishlistId: wishlist.id, productUrl },
  })
  if (duplicate) {
    throw AppError.conflict('That link is already on this wishlist.', {
      field: 'productUrl',
    })
  }

  const item = await prisma.item.create({
    data: {
      wishlistId: wishlist.id,
      title,
      productUrl,
      notes: notes ?? null,
      priority,
    },
  })

  res.status(201).json({ item: serializeItemForOwner(item) })
})

export const updateItem = asyncHandler(async (req, res) => {
  const wishlist = await findWishlistOr404(req.params.code)
  await findItemOr404(wishlist.id, req.params.itemId)

  if (req.body.productUrl) {
    const duplicate = await prisma.item.findFirst({
      where: {
        wishlistId: wishlist.id,
        productUrl: req.body.productUrl,
        NOT: { id: req.params.itemId },
      },
    })
    if (duplicate) {
      throw AppError.conflict('That link is already on this wishlist.', {
        field: 'productUrl',
      })
    }
  }

  const item = await prisma.item.update({
    where: { id: req.params.itemId },
    data: req.body,
  })

  res.status(200).json({ item: serializeItemForOwner(item) })
})

export const deleteItem = asyncHandler(async (req, res) => {
  const wishlist = await findWishlistOr404(req.params.code)
  await findItemOr404(wishlist.id, req.params.itemId)

  await prisma.item.delete({ where: { id: req.params.itemId } })
  res.status(204).send()
})

export const fetchItemImage = asyncHandler(async (req, res) => {
  const wishlist = await findWishlistOr404(req.params.code)
  const item = await findItemOr404(wishlist.id, req.params.itemId)

  const imageUrl = await getLinkPreview(item.productUrl)

  const updated = await prisma.item.update({
    where: { id: item.id },
    data: { imageUrl },
  })

  res.status(200).json({ item: serializeItemForOwner(updated) })
})

// ---------- guest ----------

export const reserveItem = asyncHandler(async (req, res) => {
  const wishlist = await findWishlistOr404(req.params.code)
  await findItemOr404(wishlist.id, req.params.itemId)
  const { reservedBy } = req.body

  // Atomic: the UPDATE only matches a row that is still unreserved, so
  // under concurrent requests exactly one succeeds. We wrap it in an
  // interactive transaction so the "did it work" check and the follow-up
  // read are consistent with each other.
  const item = await prisma.$transaction(async (tx) => {
    const result = await tx.item.updateMany({
      where: { id: req.params.itemId, wishlistId: wishlist.id, reserved: false },
      data: { reserved: true, reservedBy, reservedAt: new Date() },
    })

    if (result.count === 0) {
      return null
    }

    return tx.item.findUnique({ where: { id: req.params.itemId } })
  })

  if (!item) {
    throw AppError.conflict('Someone already reserved this item.')
  }

  res.status(200).json({ item: serializeItemForGuest(item) })
})

export const unreserveItem = asyncHandler(async (req, res) => {
  const wishlist = await findWishlistOr404(req.params.code)
  const existing = await findItemOr404(wishlist.id, req.params.itemId)
  const { reservedBy } = req.body

  if (!existing.reserved) {
    throw AppError.conflict('This item is not currently reserved.')
  }
  if (existing.reservedBy?.toLowerCase() !== reservedBy.trim().toLowerCase()) {
    throw AppError.forbidden('That name does not match who reserved this item.')
  }

  const item = await prisma.$transaction(async (tx) => {
    const result = await tx.item.updateMany({
      where: {
        id: req.params.itemId,
        wishlistId: wishlist.id,
        reserved: true,
        reservedBy: existing.reservedBy,
      },
      data: { reserved: false, reservedBy: null, reservedAt: null },
    })
    if (result.count === 0) return null
    return tx.item.findUnique({ where: { id: req.params.itemId } })
  })

  if (!item) {
    throw AppError.conflict('This item is not currently reserved.')
  }

  res.status(200).json({ item: serializeItemForGuest(item) })
})
