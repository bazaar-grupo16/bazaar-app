export type WishlistItem = {
  id: string;
  user_id: string;
  product_id: string;
  added_at: string;
  name: string | null;
  price: number | null;
  image_url: string | null;
  in_stock: boolean;
  is_available: boolean;
  catalog_available: boolean;
};

export type WishlistResponse = {
  items: WishlistItem[];
  total: number;
};

export type AddWishlistResponse = {
  id: string;
  user_id: string;
  product_id: string;
  added_at: string;
};

export type CheckWishlistResponse = {
  in_wishlist: boolean;
};
