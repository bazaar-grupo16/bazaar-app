import { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  TextInput,
  ScrollView,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { colors, typography, spacing } from "@/shared/styles/theme";
import { FormButton } from "@/shared/ui/FormButton";
import { Ionicons } from '@expo/vector-icons';

import * as Google from "expo-auth-session/providers/google";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

// Google Android OAuth clients only accept the reverse-client-ID scheme as a redirect.
// This MUST match the intent filter baked into AndroidManifest.xml (see app.config.js).
const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const googleRedirectUri = googleAndroidClientId
  ? makeRedirectUri({
      native: `com.googleusercontent.apps.${googleAndroidClientId.replace(
        ".apps.googleusercontent.com",
        ""
      )}:/oauth2redirect`,
    })
  : undefined;

import { loginUser, registerUser, sendForgotPasswordEmail, verifyResetCode, resetPassword, loginWithGoogle } from "@/entities/user";
import { ApiError } from "@/shared/api";
import { Button } from "@/shared/ui/Button";

import { persistAuthSession } from "@/shared/auth";

import { useNavigation } from "@react-navigation/native";

const HERO_IMAGE = "https://images.unsplash.com/photo-1548335684-7d082b06d74d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aWJyYW50JTIwY29sb3JmdWwlMjBtYXJrZXQlMjBwcm9kdWN0cyUyMG92ZXJoZWFkfGVufDF8fHx8MTc3NTQ4MzI1Mnww&ixlib=rb-4.1.0&q=80&w=1080";

type Tab = "login" | "register";
const { height } = Dimensions.get("window");

export function LoginPage() {

  const navigation = useNavigation<any>();

  const [tab, setTab] = useState<Tab>("login");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [isForgotModalVisible, setIsForgotModalVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  const [resetStep, setResetStep] = useState<"email" | "code" | "password">("email");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    redirectUri: googleRedirectUri,
  });

  useEffect(() => {
    if (googleResponse?.type === "success") {
      const token = googleResponse.authentication?.idToken;
      if (token) handleGoogleLoginSuccess(token);
    }
  }, [googleResponse]);

  async function handleGoogleLoginSuccess(googleAccessToken: string) {
    try {
      setError("");
      setIsLoading(true);
      const response = await loginWithGoogle(googleAccessToken);
      await persistAuthSession(response);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Error al iniciar sesión con Google (${err.status})`);
      } else {
        setError("Error de conexión. Revisá que el backend esté corriendo.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  // backend-login
  async function handleLogin() {
    if (!email || !password) {
      setError("Por favor, completá todos los campos");
      return;
    }

    try {
      setError("");
      setIsLoading(true);

      console.log("[LoginPage] Starting login with email:", email);
      
      const response = await loginUser({ email, password });
      console.log("[LoginPage] Login successful, received tokens:", { 
        token_type: response.token_type,
        expires_in: response.expires_in 
      });
      
      await persistAuthSession(response);
      console.log("[LoginPage] Auth session persisted successfully");

    } catch (err) {
      console.error("[LoginPage] Login error:", err);
      
      if (err instanceof ApiError) {
        console.error("[LoginPage] ApiError details:", { 
          status: err.status, 
          message: err.message,
          details: err.details 
        });
        
        if (err.status === 401) {
          setError("Email o contraseña incorrectos");
        } else if (err.status === 403) {
          Alert.alert(
            "Cuenta bloqueada",
            err.message,
            [{ text: "OK", onPress: () => {} }]
          );
        } else if (err.status === 422) {
          setError("El formato del email no es válido");
        } else {
          setError(`Error del servidor (${err.status})`);
        }
      } else {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error("[LoginPage] Non-ApiError:", errorMsg);
        setError("Error de conexión. Revisá que el backend esté corriendo.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  // backend-register
  async function handleRegister() {
    if (!regName || !regEmail || !regPassword) {
      setError("Por favor, completá todos los campos");
      return;
    }

    try {
      setError("");
      setIsLoading(true);

      await registerUser({
        name: regName,
        email: regEmail,
        password: regPassword,
      });

      Alert.alert("¡Cuenta creada!", "Ya podés iniciar sesión con tus datos.");

      setTab("login");
      setEmail(regEmail);
      setPassword("");

    } catch (err: any) {

          if (err instanceof ApiError) {
            if (err.status === 400) {
              setError("Ese email ya se encuentra registrado");
            } else if (err.status === 422) {
              setError("Verificá que el email sea válido y que la contraseña cumpla los requisitos (tocá el ícono ?).");
            } else {
              setError(`Error del servidor (${err.status})`);
            }
          } else {
                      setError("Error de conexión. Revisar Back");
                    }

        } finally {
          setIsLoading(false);
        }
  }

  async function handleSendResetEmail() {
    if (!forgotEmail) {
      Alert.alert("Atención", "Ingresá tu email para continuar.");
      return;
    }
    
    try {
      
      await sendForgotPasswordEmail(forgotEmail);
      setResetStep("code");
      Alert.alert(
        "¡Email enviado!", 
        "Si el correo está registrado, recibirás un código de 6 dígitos en tu bandeja de entrada."
      );
      
    } catch (err: any) {
      if (err instanceof ApiError) {
        Alert.alert("Error del servidor", `Ocurrió un problema (${err.status}). Intentá más tarde.`);
      } else {
        Alert.alert("Error de conexión", "No se pudo comunicar con el servidor.");
      }
    }
  }

  async function handleVerifyCode() {
    if (!verificationCode) return Alert.alert("Atención", "Ingresá el código.");
    try {
      await verifyResetCode({ email: forgotEmail, code: verificationCode });
      setResetStep("password");
    } catch (err: any) {
      Alert.alert("Error", "El código es incorrecto o ha expirado.");
    }
  }

  async function handleResetPassword() {
    if (!newPassword) return Alert.alert("Atención", "Ingresá tu nueva contraseña.");
    try {
      await resetPassword({ 
        email: forgotEmail, 
        code: verificationCode, 
        new_password: newPassword 
      });
      Alert.alert("¡Éxito!", "Tu contraseña ha sido actualizada.");
      closeForgotModal();
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.status === 422) {
          Alert.alert(
            "Contraseña débil", 
            "La contraseña no cumple con los requisitos de seguridad. Tocá el ícono (?) para revisarlos."
          );
        } else {
          Alert.alert("Error del servidor", `No se pudo actualizar (${err.status}).`);
        }
      } else {
        Alert.alert("Error", "No se pudo conectar con el servidor.");
      }
    }
  }

  function closeForgotModal() {
    setIsForgotModalVisible(false);
    setResetStep("email");
    setForgotEmail("");
    setVerificationCode("");
    setNewPassword("");
    setShowNewPassword(false);
  }

  function showPasswordHint() {
    Alert.alert(
      "Seguridad de la contraseña",
      "Para proteger tu cuenta, la contraseña debe tener al menos:\n\n• 1 letra mayúscula\n• 1 letra minúscula\n• 2 números\n• 1 carácter especial (!@#$%^&*)"
    );
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
                <Text style={styles.label}>Contraseña</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="••••••••"
                    placeholderTextColor={colors.gray[300]}
                    value={password}
                    onChangeText={setPassword}
                    autoCapitalize="none"
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={22}
                        color={colors.gray[500]}
                      />
                    </TouchableOpacity>
                </View>    
              </View>

              <View style={styles.forgotPasswordRow}>
                <TouchableOpacity onPress={() => setIsForgotModalVisible(true)}>
                  <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
                </TouchableOpacity>
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
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { marginBottom: 0 }]}>Contraseña</Text>
                  <TouchableOpacity onPress={showPasswordHint} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="help-circle-outline" size={20} color={colors.gray[500]} />
                  </TouchableOpacity>
                </View>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="••••••••"
                    placeholderTextColor={colors.gray[300]}
                    value={regPassword}
                    onChangeText={setRegPassword}
                    autoCapitalize="none"
                    secureTextEntry={!showRegPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowRegPassword(!showRegPassword)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showRegPassword ? "eye-off-outline" : "eye-outline"}
                      size={22}
                      color={colors.gray[500]}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <FormButton onPress={handleRegister} style={{ marginTop: spacing.md }}>
                Crear cuenta
              </FormButton>
            </View>
          )}

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o continuá con</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.googleButton}
            onPress={() => googlePromptAsync()}
            disabled={!googleRequest || isLoading}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-google" size={20} color={colors.gray[700]} />
            <Text style={styles.googleButtonText}>Continuar con Google</Text>
          </TouchableOpacity>

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

          <TouchableOpacity
            style={styles.guestButton}
            onPress={() => navigation.navigate("Tabs")} 
            activeOpacity={0.7}
          >
            <Text style={styles.guestButtonText}>Ingresar como invitado</Text>
          </TouchableOpacity>

        </ScrollView>
      </View>
      <Modal
        animationType="fade"
        transparent={true}
        visible={isForgotModalVisible}
        onRequestClose={closeForgotModal}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
       <View style={styles.modalContainer}>
            {resetStep === "email" && (
              <>
                <Text style={styles.modalTitle}>Recuperar Contraseña</Text>
                <Text style={styles.modalSubtitle}>
                  Ingresá tu email y te enviaremos las instrucciones para restablecerla.
                </Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="tu@email.com"
                  placeholderTextColor={colors.gray[300]}
                  value={forgotEmail}
                  onChangeText={setForgotEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <View style={styles.modalActions}>
                  <Button variant="ghost" onPress={closeForgotModal}>Cancelar</Button>
                  <Button variant="primary" onPress={handleSendResetEmail}>Enviar</Button>
                </View>
              </>
            )}

            {resetStep === "code" && (
              <>
                <Text style={styles.modalTitle}>Verificar Código</Text>
                <Text style={styles.modalSubtitle}>
                  Ingresá el código de 6 dígitos que enviamos a tu correo.
                </Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="123456"
                  placeholderTextColor={colors.gray[300]}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <View style={styles.modalActions}>
                  <Button variant="ghost" onPress={closeForgotModal}>Cancelar</Button>
                  <Button variant="primary" onPress={handleVerifyCode}>Verificar</Button>
                </View>
              </>
            )}

            {resetStep === "password" && (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
                  <Text style={[styles.modalTitle, { marginBottom: 0 }]}>Nueva Contraseña</Text>
                  <TouchableOpacity onPress={showPasswordHint} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="help-circle-outline" size={22} color={colors.gray[500]} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalSubtitle}>
                  Ingresá tu nueva clave para acceder a Bazaar.
                </Text>
                <View style={[styles.passwordWrapper, { marginBottom: spacing.lg }]}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Nueva contraseña"
                    placeholderTextColor={colors.gray[300]}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  >
                    <Ionicons
                      name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                      size={22}
                      color={colors.gray[500]}
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.modalActions}>
                  <Button variant="ghost" onPress={closeForgotModal}>Cancelar</Button>
                  <Button variant="primary" onPress={handleResetPassword}>Guardar</Button>
                </View>
              </>
            )}
          </View> 
          </KeyboardAvoidingView>
      </Modal>
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
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[100],
    borderRadius: 16,
    paddingHorizontal: spacing.md,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: typography.size.md,
    color: colors.gray[900],
  },
  eyeButton: {
    paddingLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  forgotPasswordRow: {
    alignItems: 'center',
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  forgotPasswordText: {
    color: colors.brand[500],
    fontSize: 13,
    fontWeight: typography.weight.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: spacing.lg,
    width: '100%',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  modalInput: {
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[100],
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: typography.size.md,
    color: colors.gray[900],
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  guestButton: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  guestButtonText: {
    color: colors.gray[500],
    fontSize: 14,
    fontWeight: typography.weight.semibold,
    textDecorationLine: "underline",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray[100],
  },
  dividerText: {
    marginHorizontal: spacing.sm,
    fontSize: 12,
    color: colors.gray[400],
    fontWeight: typography.weight.regular,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.white,
  },
  googleButtonText: {
    fontSize: typography.size.md,
    color: colors.gray[700],
    fontWeight: typography.weight.semibold,
  },
});