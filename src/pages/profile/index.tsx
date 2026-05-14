import { useState, useEffect } from "react";
import { ScrollView, View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import type { RootStackParamList } from "@/navigation";
import { clearAuthSession, useAuthStore } from "@/shared/auth";
import { useMyProducts } from "@/entities/product";
import { useOrdersHistory, useSalesHistory } from "@/entities/order";
import { colors, typography, spacing } from "@/shared/styles";
import type { Tab, PublicationsSubTab } from "./types";

import { getMyProfile } from "@/entities/profile/api/profile";
import type { Profile } from "@/entities/profile/model/types";

import { ProfileHeader } from "./components/ProfileHeader";
import { ProfileTabs } from "./components/ProfileTabs";
import { PublicationsSubTabs } from "./components/PublicationsSubTabs";
import { ProductGrid } from "./components/ProductGrid";
import { EmptyState } from "./components/EmptyState";
import { SettingsPanel } from "./components/SettingsPanel";
import { WishlistTab } from "./components/WishlistTab";
import { EditProfileModal } from "./components/EditProfileModal";

import { SalesTab } from "./components/SalesTab";

const EMPTY_MESSAGES: Record<PublicationsSubTab, { title: string; subtitle: string }> = {
  activas:    { title: "Sin publicaciones activas",    subtitle: "Publicá algo y empezá a vender" },
  inactivas:  { title: "Sin publicaciones inactivas",  subtitle: "Podés desactivar publicaciones desde el editor" },
  "sin-stock": { title: "Sin publicaciones sin stock", subtitle: "Los productos con stock 0 aparecen aquí" },
};

export function ProfilePage() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, "Tabs">>();
  const isGuest = !useAuthStore((state) => state.accessToken);
  const [tab, setTab] = useState<Tab>("publicaciones");
  const [subTab, setSubTab] = useState<PublicationsSubTab>("activas");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    if (isGuest) {
      setIsLoadingProfile(false);
      return;
    }

    async function loadProfile() {
      try {
        const profileData = await getMyProfile();
        setUserProfile(profileData);
      } catch (error) {
        console.error("Error al cargar el perfil:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    }
    loadProfile();
  }, [isGuest]);

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

  if (isGuest) {
    return (
      <View style={styles.guestContainer}>
        <Ionicons name="person-circle-outline" size={100} color={colors.gray[300]} />
        <Text style={styles.guestTitle}>Ingresá a tu cuenta</Text>
        <Text style={styles.guestSubtitle}>
          Para ver tu perfil, gestionar tus publicaciones y revisar tus ventas, tenés que iniciar sesión.
        </Text>
        <TouchableOpacity 
          style={styles.loginButton} 
          activeOpacity={0.8}
          onPress={() => navigation.navigate("Login" as any)} 
        >
          <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
        name={isLoadingProfile ? "Cargando..." : (userProfile?.name ?? "Usuario")}
        bio={userProfile?.description ?? null}
        avatarUrl={userProfile?.profile_picture_url ?? null}
        publicationsCount={activeListings.length}
        onEditPress={() => setEditModalOpen(true)}
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
      <EditProfileModal
        visible={editModalOpen}
        profile={userProfile}
        onClose={() => setEditModalOpen(false)}
        onSaveSuccess={(updatedProfile) => {
          setUserProfile(updatedProfile); 
        }}
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
  guestContainer: {
    flex: 1,
    backgroundColor: colors.gray[50],
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  guestTitle: {
    fontSize: typography.size.xl,
    fontWeight: "bold",
    color: colors.gray[900],
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  guestSubtitle: {
    fontSize: typography.size.md,
    color: colors.gray[500],
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  loginButton: {
    backgroundColor: colors.brand[500],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  loginButtonText: {
    color: colors.white,
    fontSize: typography.size.md,
    fontWeight: "bold",
  },
});
