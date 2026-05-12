import { useState } from "react";
import { ScrollView, View, StyleSheet, ActivityIndicator, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import type { RootStackParamList } from "@/navigation";
import { clearAuthSession } from "@/shared/auth";
import { useMyProducts } from "@/entities/product";
import { useOrdersHistory, useSalesHistory } from "@/entities/order";
import { colors, typography, spacing } from "@/shared/styles";
import type { Tab, PublicationsSubTab } from "./types";

import { ProfileHeader } from "./components/ProfileHeader";
import { ProfileTabs } from "./components/ProfileTabs";
import { PublicationsSubTabs } from "./components/PublicationsSubTabs";
import { ProductGrid } from "./components/ProductGrid";
import { EmptyState } from "./components/EmptyState";
import { SettingsPanel } from "./components/SettingsPanel";
import { WishlistTab } from "./components/WishlistTab";
import { SalesTab } from "./components/SalesTab";

const EMPTY_MESSAGES: Record<PublicationsSubTab, { title: string; subtitle: string }> = {
  activas:    { title: "Sin publicaciones activas",    subtitle: "Publicá algo y empezá a vender" },
  inactivas:  { title: "Sin publicaciones inactivas",  subtitle: "Podés desactivar publicaciones desde el editor" },
  "sin-stock": { title: "Sin publicaciones sin stock", subtitle: "Los productos con stock 0 aparecen aquí" },
};

export function ProfilePage() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, "Tabs">>();
  const [tab, setTab] = useState<Tab>("publicaciones");
  const [subTab, setSubTab] = useState<PublicationsSubTab>("activas");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { data, isLoading } = useMyProducts();
  const { data: salesCountData } = useSalesHistory(1, 1, "CONFIRMADA");
  const { data: ordersData } = useOrdersHistory(1, 1, "CONFIRMADA");
  const allListings = data?.data ?? [];

  const activeListings    = allListings.filter((p) => p.status === "active");
  const inactiveListings  = allListings.filter((p) => p.status === "inactive");
  const outOfStockListings = allListings.filter((p) => p.status === "out_of_stock");

  const filteredListings =
    subTab === "activas"    ? activeListings :
    subTab === "inactivas"  ? inactiveListings :
    outOfStockListings;

  const counts = {
    activas:  activeListings.length,
    inactivas: inactiveListings.length,
    sinStock:  outOfStockListings.length,
  };

  const salesCount = salesCountData?.total ?? 0;
  const purchasesCount = ordersData?.total ?? 0;

  const handleSignOut = async () => {
    await clearAuthSession();
    navigation.replace("Login");
  };

  const handlePreview = (productId: string) => {
    navigation.navigate("ProductDetail", { productId });
  };

  const handleEdit = (productId: string) => {
    navigation.navigate("EditProduct", { productId });
  };

  const emptyMsg = EMPTY_MESSAGES[subTab];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      <ProfileHeader
        publicationsCount={activeListings.length}
        salesCount={salesCount}
        purchasesCount={purchasesCount}
        onSettingsPress={() => setSettingsOpen(true)}
      />

      <ProfileTabs activeTab={tab} onTabChange={setTab} />

      <View style={styles.content}>
        {tab === "publicaciones" ? (
          <>
            <PublicationsSubTabs
              activeTab={subTab}
              counts={counts}
              onTabChange={setSubTab}
            />

            <View style={styles.gridArea}>
              {isLoading ? (
                <View style={styles.centered}>
                  <ActivityIndicator size="small" color={colors.brand[500]} />
                  <Text style={styles.loadingText}>Cargando publicaciones...</Text>
                </View>
              ) : filteredListings.length === 0 ? (
                <EmptyState
                  icon={<Ionicons name="bag-outline" size={40} color={colors.gray[300]} />}
                  title={emptyMsg.title}
                  subtitle={emptyMsg.subtitle}
                />
              ) : (
                <ProductGrid
                  items={filteredListings}
                  onPreview={handlePreview}
                  onEdit={handleEdit}
                />
              )}
            </View>
          </>
        ) : tab === "ventas" ? (
          <SalesTab />
        ) : (
          <WishlistTab />
        )}
      </View>

      <SettingsPanel
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSignOut={handleSignOut}
      />

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  content: {
    paddingVertical: spacing.md,
  },
  centered: {
    alignItems: "center",
    paddingVertical: 48,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: typography.size.sm,
    color: colors.gray[500],
  },
  gridArea: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
});
