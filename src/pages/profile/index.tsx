import { useState } from "react";
import { ScrollView, View, StyleSheet, ActivityIndicator, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import type { RootStackParamList } from "@/navigation";
import { setAuthToken } from "@/shared/api";
import { useProducts } from "@/entities/product";
import { colors, typography, spacing } from "@/shared/styles";
import { Tab } from "./types";

import { ProfileHeader } from "./components/ProfileHeader";
import { ProfileTabs } from "./components/ProfileTabs";
import { ProductGrid } from "./components/ProductGrid";
import { EmptyState } from "./components/EmptyState";
import { SettingsPanel } from "./components/SettingsPanel";

// TODO: reemplazar con el ID real del usuario autenticado cuando esté disponible en el token
const SELLER_ID = "00000000-0000-0000-0000-000000000001";

export function ProfilePage() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, "Tabs">>();
  const [tab, setTab] = useState<Tab>("publicaciones");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { data, isLoading } = useProducts({ sellerId: SELLER_ID });
  const listings = data?.data ?? [];
  const total = data?.total ?? 0;

  const handleSignOut = () => {
    setAuthToken(null);
    navigation.replace("Login");
  };

  const handlePreview = (productId: string) => {
    navigation.navigate("ProductDetail", { productId });
  };

  const handleEdit = (productId: string) => {
    navigation.navigate("EditProduct", { productId });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      <ProfileHeader
        publicationsCount={total}
        onSettingsPress={() => setSettingsOpen(true)}
      />

      <ProfileTabs activeTab={tab} onTabChange={setTab} />

      <View style={styles.content}>
        {tab === "publicaciones" ? (
          isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="small" color={colors.brand[500]} />
              <Text style={styles.loadingText}>Cargando publicaciones...</Text>
            </View>
          ) : listings.length === 0 ? (
            <EmptyState
              icon={<Ionicons name="bag-outline" size={40} color={colors.gray[300]} />}
              title="Sin publicaciones"
              subtitle="Publicá algo y empezá a vender"
            />
          ) : (
            <ProductGrid
              items={listings}
              onPreview={handlePreview}
              onEdit={handleEdit}
            />
          )
        ) : (
          <EmptyState
            icon={<Ionicons name="heart-outline" size={40} color={colors.gray[300]} />}
            title="Sin favoritos"
            subtitle="Guardá publicaciones que te interesen"
          />
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
    paddingHorizontal: spacing.md,
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
});
