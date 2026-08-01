export function serializeWishlist(wishlist) {
  return {
    code: wishlist.code,
    title: wishlist.title,
    createdAt: wishlist.createdAt,
    updatedAt: wishlist.updatedAt,
  }
}

// The owner can see that an item exists but never who reserved it (or even
// that it's reserved) — that's the whole point of a wishlist.
export function serializeItemForOwner(item) {
  return {
    id: item.id,
    title: item.title,
    productUrl: item.productUrl,
    imageUrl: item.imageUrl,
    notes: item.notes,
    priority: item.priority,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

// Guests need to know what's already spoken for so they don't double-book.
export function serializeItemForGuest(item) {
  return {
    id: item.id,
    title: item.title,
    productUrl: item.productUrl,
    imageUrl: item.imageUrl,
    notes: item.notes,
    priority: item.priority,
    reserved: item.reserved,
    reservedBy: item.reserved ? item.reservedBy : null,
    createdAt: item.createdAt,
  }
}
