export type {
  WishlistItem,
  WishlistResponse,
  AddWishlistResponse,
  CheckWishlistResponse,
} from "./model/types";

export { wishlistKeys, useWishlist } from "./model/queries";
export { useAddToWishlist, useRemoveFromWishlist } from "./model/mutations";
