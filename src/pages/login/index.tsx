import { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation";

// Imagen de referencia usada en wireframes
const HERO_IMAGE = "https://images.unsplash.com/photo-1548335684-7d082b06d74d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aWJyYW50JTIwY29sb3JmdWwlMjBtYXJrZXQlMjBwcm9kdWN0cyUyMG92ZXJoZWFkfGVufDF8fHx8MTc3NTQ4MzI1Mnww&ixlib=rb-4.1.0&q=80&w=1080";

const HARDCODED_EMAIL = "admin@bazaar.com";
const HARDCODED_PASSWORD = "1234";

type Tab = "login" | "register";

const { height } = Dimensions.get("window");

export function LoginPage() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, "Login">>();
  const [tab, setTab] = useState<Tab>("login");

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={styles.heroContainer}>
        <Image source={{ uri: HERO_IMAGE }} style={styles.heroImage} />
        <View style={styles.heroOverlay} />

        <View style={styles.heroContent}>
          <View style={styles.iconPlaceholder}>
            <Text style={styles.iconText}>🛍️</Text>
          </View>
          <Text style={styles.heroTitle}>Bazaar</Text>
          <Text style={styles.heroSubtitle}>Comprá y vendé sin límites</Text>
        </View>
      </View>

      <View style={styles.sheetContainer}>
        {/* Drag handle (la barrita gris de arriba) */}
        <View style={styles.dragHandleContainer}>
        </View>

        {/* Tabs (Login / Register) */}
        <View style={styles.tabsContainer}>
          <View style={styles.tabsWrapper}>
            <TouchableOpacity
              style={[styles.tab, tab === "login" && styles.activeTab]}
              onPress={() => setTab("login")}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, tab === "login" && styles.activeTabText]}>
                Iniciar sesión
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, tab === "register" && styles.activeTab]}
              onPress={() => setTab("register")}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, tab === "register" && styles.activeTabText]}>
                Registrarse
              </Text>
            </TouchableOpacity>
          </View>
        </View>


        <View style={styles.formPlaceholder}>
          <Text style={styles.placeholderText}>
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  heroContainer: {
    height: height * 0.35, // Ocupa el 35% de la pantalla aprox
    width: "100%",
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(234, 88, 12, 0.4)", // Tinte naranja oscuro simulando el gradiente
  },
  heroContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 20,
  },
  iconPlaceholder: {
    width: 56,
    height: 56,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  iconText: {
    fontSize: 24,
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: "#fff7ed",
    fontSize: 14,
    fontWeight: "400",
  },
  sheetContainer: {
      flex: 1,
      backgroundColor: "#ffffff",
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      marginTop: -32,

      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 8,
    },
    tabsContainer: {
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 16,
    },
  tabsWrapper: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderRadius: 16,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    color: "#9ca3af",
    fontWeight: "400",
  },
  activeTabText: {
    color: "#111827",
    fontWeight: "600",
  },
  formPlaceholder: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: "center",
  },
  placeholderText: {
    color: "#9ca3af",
    textAlign: "center",
  }
});