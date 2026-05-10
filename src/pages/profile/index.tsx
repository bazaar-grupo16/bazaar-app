import { useState, useEffect } from "react";
import { ScrollView, View, StyleSheet, ActivityIndicator, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import type { RootStackParamList } from "@/navigation";
import { clearAuthSession, useSessionUserId } from "@/shared/auth";
import { useProducts } from "@/entities/product";
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
// TODO: reemplazar con el ID real del usuario autenticado cuando esté disponible en el token
const SELLER_ID = useSessionUserId();

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
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
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
  }, []);

  const { data, isLoading } = useProducts({ sellerId: SELLER_ID ?? "", includeInactive: true });
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
});
