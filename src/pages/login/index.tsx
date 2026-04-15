import { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  TextInput,
  ScrollView
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation";
import { colors, typography, spacing } from "@/shared/styles/theme";
import { FormButton } from "@/shared/ui/FormButton";

const HERO_IMAGE = "https://images.unsplash.com/photo-1548335684-7d082b06d74d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aWJyYW50JTIwY29sb3JmdWwlMjBtYXJrZXQlMjBwcm9kdWN0cyUyMG92ZXJoZWFkfGVufDF8fHx8MTc3NTQ4MzI1Mnww&ixlib=rb-4.1.0&q=80&w=1080";

const HARDCODED_EMAIL = "admin@bazaar.com";
const HARDCODED_PASSWORD = "1234";

type Tab = "login" | "register";

const { height } = Dimensions.get("window");

export function LoginPage() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, "Login">>();
  const [tab, setTab] = useState<Tab>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  function handleLogin() {
    if (email === HARDCODED_EMAIL && password === HARDCODED_PASSWORD) {
      setError("");
      navigation.replace("Tabs");
    } else {
      setError("Credenciales incorrectas");
    }
  }

  function handleRegister() {
    setError("");
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={styles.heroContainer}>
        <Image source={{ uri: HERO_IMAGE }} style={styles.heroImage} />
        <View style={styles.heroOverlay} />

        <View style={styles.heroContent}>
                  <View style={styles.iconPlaceholder}>
                    <Image
                      source={require('../../../assets/icon.png')}
                      style={styles.logoImage}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.heroTitle}>Bazaar</Text>
                  <Text style={styles.heroSubtitle}>Comprá y vendé sin límites</Text>
                </View>
        </View>
      <View style={styles.sheetContainer}>
        <View style={styles.tabsContainer}>
          <View style={styles.tabsWrapper}>
            <TouchableOpacity
              style={[styles.tab, tab === "login" && styles.activeTab]}
              onPress={() => { setTab("login"); setError(""); }}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, tab === "login" && styles.activeTabText]}>
                Iniciar sesión
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, tab === "register" && styles.activeTab]}
              onPress={() => { setTab("register"); setError(""); }}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, tab === "register" && styles.activeTabText]}>
                Registrarse
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.formArea}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
        >
          {tab === "login" ? (
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="tu@email.com"
                  placeholderTextColor={colors.gray[300]}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Contraseña</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={colors.gray[300]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <FormButton onPress={handleLogin} style={{ marginTop: spacing.sm }}>
                Ingresar
              </FormButton>
            </View>
          ) : (
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre completo</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nombre"
                  placeholderTextColor={colors.gray[300]}
                  value={regName}
                  onChangeText={setRegName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="tu@email.com"
                  placeholderTextColor={colors.gray[300]}
                  value={regEmail}
                  onChangeText={setRegEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Contraseña</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={colors.gray[300]}
                  value={regPassword}
                  onChangeText={setRegPassword}
                  secureTextEntry
                />
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <FormButton onPress={handleRegister} style={{ marginTop: spacing.md }}>
                Crear cuenta
              </FormButton>
            </View>
          )}

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>
              {tab === "login" ? "¿No tenés cuenta? " : "¿Ya tenés cuenta? "}
            </Text>
            <TouchableOpacity onPress={() => { setTab(tab === "login" ? "register" : "login"); setError(""); }}>
              <Text style={styles.footerLink}>
                {tab === "login" ? "Registrate gratis" : "Iniciá sesión"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  heroContainer: {
    height: height * 0.35,
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
    backgroundColor: "rgba(234, 88, 12, 0.4)",
  },
  heroContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: spacing.lg,
  },
  iconPlaceholder: {
    width: 56,
    height: 56,
    backgroundColor: colors.white,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
    elevation: 5,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    overflow: "hidden",
  },
  logoImage: {
    width: 36,
    height: 36,
  },
  heroTitle: {
    color: colors.white,
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: colors.brand[50],
    fontSize: typography.size.sm,
    fontWeight: typography.weight.regular,
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  tabsContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  tabsWrapper: {
    flexDirection: "row",
    backgroundColor: colors.gray[100],
    borderRadius: 16,
    padding: spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    color: colors.gray[500],
    fontWeight: typography.weight.regular,
  },
  activeTabText: {
    color: colors.gray[900],
    fontWeight: typography.weight.semibold,
  },
  formArea: {
    flex: 1,
  },
  formContainer: {
    paddingHorizontal: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: typography.weight.semibold,
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[100],
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: typography.size.md,
    color: colors.gray[900],
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    textAlign: "center",
    marginBottom: spacing.lg,
    fontWeight: typography.weight.semibold,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.lg,
  },
  footerText: {
    color: colors.gray[500],
    fontSize: 13,
  },
  footerLink: {
    color: colors.brand[500],
    fontSize: 13,
    fontWeight: typography.weight.bold,
  }
});