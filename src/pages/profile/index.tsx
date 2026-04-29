import { colors, typography } from "@/shared/styles";

import { useState } from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Product, Tab } from "./types";

import { ProfileHeader } from "./components/ProfileHeader";
import { ProfileTabs } from "./components/ProfileTabs";
import { ProductGrid } from "./components/ProductGrid";
import { EmptyState } from "./components/EmptyState";
import { SignOutButton } from "./components/SignOutButton";

interface Props {
  // Si usás React Navigation:
  // navigation: NativeStackNavigationProp<RootStackParamList>;
  onNavigateToProduct?: (id: string | number) => void;
  onSignOut?: () => void;
  onEdit?: () => void;
  onSettings?: () => void;
}

export function ProfilePage({
  onNavigateToProduct,
  onSignOut,
  onEdit,
  onSettings,
}: Props) {
  const [tab, setTab] = useState<Tab>("publicaciones");

  const favorites = PRODUCTS.filter((product) => product.isFavorite);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      <ProfileHeader
        onEditPress={onEdit}
        onSettingsPress={onSettings}
      />

      <ProfileTabs activeTab={tab} onTabChange={setTab} />

      <View style={styles.content}>
        {tab === "publicaciones" ? (
          MY_LISTINGS.length === 0 ? (
            <EmptyState
              icon={<Ionicons name="bag-outline" size={40} color="#d1d5db" />}
              title="Sin publicaciones"
              subtitle="Publicá algo y empezá a vender"
            />
          ) : (
            <ProductGrid
              items={MY_LISTINGS}
              onProductPress={onNavigateToProduct}
            />
          )
        ) : (
          favorites.length === 0 ? (
            <EmptyState
              icon={<Ionicons name="heart-outline" size={40} color="#d1d5db" />}
              title="Sin favoritos"
              subtitle="Guardá publicaciones que te interesen"
            />
          ) : (
            <ProductGrid
              items={favorites}
              onProductPress={onNavigateToProduct}
            />
          )
        )}

        <SignOutButton onPress={onSignOut} />
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
});


// SAMPLE-DATA --------------------------------
// Should replace with real API data when profile microservice is ready.

const CURRENT_USER_ID = "user-1";

const PRODUCTS: Product[] = [
  {
    id: "1",
    title: "iPhone 13 128 GB",
    price: 780000,
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=900&q=80",
    condition: "Usado",
    isFavorite: true,
    description: "Excelente estado, incluye caja y cargador.",
    sellerId: CURRENT_USER_ID,
    category: "Electrónica",
    status: "active",
    createdAt: "2026-03-21T12:00:00.000Z",
    updatedAt: "2026-03-24T12:00:00.000Z",
  },
  {
    id: "2",
    title: "Silla ergonómica de escritorio",
    price: 245000,
    image: "https://images.unsplash.com/photo-1505797149-2f2f2d9f6f4f?w=900&q=80",
    condition: "Nuevo",
    isFavorite: false,
    description: "Ideal para home office, casi sin uso.",
    sellerId: CURRENT_USER_ID,
    category: "Hogar",
    status: "active",
    createdAt: "2026-04-01T09:30:00.000Z",
    updatedAt: "2026-04-02T09:30:00.000Z",
  },
  {
    id: "3",
    title: "Bicicleta rodado 29",
    price: 410000,
    image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=900&q=80",
    condition: "Reacondicionado",
    isFavorite: true,
    description: "Revisada y lista para usar todos los días.",
    sellerId: "user-2",
    category: "Deportes",
    status: "active",
    createdAt: "2026-04-12T16:15:00.000Z",
    updatedAt: "2026-04-14T16:15:00.000Z",
  },
  {
    id: "4",
    title: "Notebook Lenovo ThinkPad",
    price: 920000,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=900&q=80",
    condition: "Usado",
    isFavorite: false,
    description: "Excelente para estudio y desarrollo.",
    sellerId: "user-2",
    category: "Electrónica",
    status: "active",
    createdAt: "2026-04-16T11:00:00.000Z",
    updatedAt: "2026-04-18T11:00:00.000Z",
  },
];

const MY_LISTINGS = PRODUCTS.filter((product) => product.sellerId === CURRENT_USER_ID);


