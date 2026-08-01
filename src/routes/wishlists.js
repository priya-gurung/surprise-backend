import { Router } from 'express'
import { validate } from '../middleware/validate.js'
import { requireOwner } from '../middleware/auth.js'
import { authLimiter } from '../middleware/rateLimit.js'
import {
  createWishlistSchema,
  ownerLoginSchema,
  codeParamSchema,
} from '../validators/wishlistValidators.js'
import {
  createItemSchema,
  updateItemSchema,
  reserveItemSchema,
  unreserveItemSchema,
  itemIdParamSchema,
} from '../validators/itemValidators.js'
import {
  createWishlist,
  ownerLogin,
  ownerLogout,
  getWishlist,
} from '../controllers/wishlistController.js'
import {
  addItem,
  updateItem,
  deleteItem,
  fetchItemImage,
  reserveItem,
  unreserveItem,
} from '../controllers/itemController.js'

const router = Router()

// All routes below take :code — validate + normalize it once up front.
router.param('code', (req, res, next, value) => {
  const result = codeParamSchema.safeParse({ code: value })
  if (!result.success) {
    return next(
      Object.assign(new Error('Invalid wishlist code'), {
        statusCode: 400,
        code: 'BAD_REQUEST',
      }),
    )
  }
  req.params.code = result.data.code
  next()
})

router.post('/wishlists', authLimiter, validate(createWishlistSchema), createWishlist)
router.post(
  '/wishlists/:code/login',
  authLimiter,
  validate(ownerLoginSchema),
  ownerLogin,
)
router.post('/wishlists/:code/logout', ownerLogout)
router.get('/wishlists/:code', getWishlist)

router.post('/wishlists/:code/items', requireOwner, validate(createItemSchema), addItem)
router.patch(
  '/wishlists/:code/items/:itemId',
  requireOwner,
  validate(itemIdParamSchema, 'params'),
  validate(updateItemSchema),
  updateItem,
)
router.delete(
  '/wishlists/:code/items/:itemId',
  requireOwner,
  validate(itemIdParamSchema, 'params'),
  deleteItem,
)
router.post(
  '/wishlists/:code/items/:itemId/fetch-image',
  requireOwner,
  validate(itemIdParamSchema, 'params'),
  fetchItemImage,
)

router.post(
  '/wishlists/:code/items/:itemId/reserve',
  validate(itemIdParamSchema, 'params'),
  validate(reserveItemSchema),
  reserveItem,
)
router.post(
  '/wishlists/:code/items/:itemId/unreserve',
  validate(itemIdParamSchema, 'params'),
  validate(unreserveItemSchema),
  unreserveItem,
)

export default router
