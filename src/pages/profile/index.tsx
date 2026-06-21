import { useState, useEffect } from "react";
import { ScrollView, View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import type { RootStackParamList } from "@/navigation";
import { clearAuthSession, isPinConfigured, useAuthStore, useSessionUserId } from "@/shared/auth";
import { apiDelete } from "@/shared/api";
import { useMyProducts } from "@/entities/product";
import { useOrdersHistory, useSalesHistory } from "@/entities/order";
import { wishlistKeys } from "@/entities/wishlist";
import { colors, typography, spacing, radius } from "@/shared/styles";
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
import { PinSetupModal } from "./components/PinSetupModal";

const EMPTY_MESSAGES: Record<PublicationsSubTab, { title: string; subtitle: string }> = {
  activas:    { title: "Sin publicaciones activas",    subtitle: "Publicá algo y empezá a vender" },
  inactivas:  { title: "Sin publicaciones inactivas",  subtitle: "Podés desactivar publicaciones desde el editor" },
  "sin-stock": { title: "Sin publicaciones sin stock", subtitle: "Los productos con stock 0 aparecen aquí" },
};

export function ProfilePage() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, "Tabs">>();
  const queryClient = useQueryClient();
  const isGuest = !useAuthStore((state) => state.accessToken);
  const userId = useSessionUserId();
  const [tab, setTab] = useState<Tab>("publicaciones");
  const [subTab, setSubTab] = useState<PublicationsSubTab>("activas");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(false);

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

  useEffect(() => {
    if (isGuest) {
      setPinEnabled(false);
      return;
    }

    void isPinConfigured().then(setPinEnabled);
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
        <Ionicons name="person-circle-outline" size={64} color={colors.gray[300]} />
        <Text style={styles.guestTitle}>Iniciá sesión para ver tu perfil</Text>
        <Text style={styles.guestText}>
          Con tu cuenta podés gestionar tus publicaciones y revisar tus ventas.
        </Text>
        <TouchableOpacity
          style={styles.loginButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("Login" as any)}
        >
          <Text style={styles.loginButtonText}>Iniciar sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSignOut = async () => {
    await queryClient.cancelQueries({ queryKey: wishlistKeys.all });
    queryClient.removeQueries({ queryKey: wishlistKeys.all });
    queryClient.removeQueries({ queryKey: ["my-profile"] });
    try {
      console.debug("Cerrando sesión en el servidor...");
      await apiDelete("/logout");
    } catch (error) {
      console.error("[auth] logout endpoint failed:", error);
      // best-effort: always clear locally regardless
    }
    await clearAuthSession();
    setUserProfile(null);
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
        ) : (
          <WishlistTab />
        )}
      </View>

      <SettingsPanel
        visible={settingsOpen}
        pinEnabled={pinEnabled}
        onClose={() => setSettingsOpen(false)}
        onSignOut={handleSignOut}
        onEditProfile={() => setEditModalOpen(true)}
        onManagePin={() => setPinModalOpen(true)}
      />
      <EditProfileModal
        visible={editModalOpen}
        profile={userProfile}
        onClose={() => setEditModalOpen(false)}
        onSaveSuccess={(updatedProfile) => {
          setUserProfile(updatedProfile); 
        }}
      />
      <PinSetupModal
        visible={pinModalOpen}
        pinEnabled={pinEnabled}
        userId={userId}
        onClose={() => setPinModalOpen(false)}
        onSaved={() => {
          void isPinConfigured().then(setPinEnabled);
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
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  guestTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.gray[900],
    textAlign: "center",
  },
  guestText: {
    fontSize: typography.size.md,
    color: colors.gray[500],
    textAlign: "center",
    lineHeight: 22,
  },
  loginButton: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    backgroundColor: colors.brand[500],
    borderRadius: radius.md,
  },
  loginButtonText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.white,
  },
});
