import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";
import type { ShippingAddress } from "./types";

interface CheckoutState {
  lastAddress: ShippingAddress | null;
  setLastAddress: (address: ShippingAddress) => void;
}

// Custom storage for SecureStore since Zustand persist expects standard Storage
const secureStorage = {
  getItem: (name: string) => SecureStore.getItemAsync(name),
  setItem: (name: string, value: string) => SecureStore.setItemAsync(name, value),
  removeItem: (name: string) => SecureStore.deleteItemAsync(name),
};

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      lastAddress: null,
      setLastAddress: (address) => set({ lastAddress: address }),
    }),
    {
      name: "bazaar.checkout",
      storage: createJSONStorage(() => secureStorage as any),
    }
  )
);
