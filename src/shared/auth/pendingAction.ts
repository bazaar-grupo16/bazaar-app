import { create } from "zustand";

type PendingWishlistAction = { productId: string; action: "add" | "remove" } | null;

interface PendingActionState {
  pendingWishlist: PendingWishlistAction;
  setPendingWishlist: (action: PendingWishlistAction) => void;
}

export const usePendingActionStore = create<PendingActionState>((set) => ({
  pendingWishlist: null,
  setPendingWishlist: (action) => set({ pendingWishlist: action }),
}));
