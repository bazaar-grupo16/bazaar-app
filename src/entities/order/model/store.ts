import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";
import type { ShippingAddress } from "./types";

interface CheckoutState {
  lastAddress: ShippingAddress | null;
  currentIdempotencyKey: string | null;
  setLastAddress: (address: ShippingAddress) => void;
  getIdempotencyKey: () => string;
  clearIdempotencyKey: () => void;
}

// Custom storage for SecureStore since Zustand persist expects standard Storage
const secureStorage = {
  getItem: (name: string) => SecureStore.getItemAsync(name),
  setItem: (name: string, value: string) => SecureStore.setItemAsync(name, value),
  removeItem: (name: string) => SecureStore.deleteItemAsync(name),
};

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set, get) => ({
      lastAddress: null,
      currentIdempotencyKey: null,
      setLastAddress: (address) => set({ lastAddress: address }),
      getIdempotencyKey: () => {
        const existing = get().currentIdempotencyKey;
        if (existing) return existing;
        const newKey = (globalThis as any).crypto?.randomUUID?.() || Math.random().toString(36).substring(2); // Fallback if crypto is unavailable in some contexts, though expo-crypto is preferred in UI
        // Note: we'll use expo-crypto in the component for the actual generation to be safe
        set({ currentIdempotencyKey: newKey });
        return newKey;
      },
      clearIdempotencyKey: () => set({ currentIdempotencyKey: null }),
    }),
    {
      name: "bazaar.checkout",
      storage: createJSONStorage(() => secureStorage as any),
    }
  )
);
