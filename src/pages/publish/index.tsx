import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCreateProduct } from "@/entities/product";
import { PRODUCT_CATEGORIES } from "@/shared/config/categories";
import { colors, radius, spacing, typography } from "@/shared/styles";
import type { RootStackParamList } from "@/navigation";
import { useAuthStore } from "@/shared/auth";

const MAX_IMAGES = 5;
const MAX_FILE_MB = 10;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface PickedImage {
  uri: string;
  mimeType: string;
  fileName: string;
  fileSize?: number;
}

interface FormState {
  title: string;
  description: string;
  price: string;
  stock: string;
  category: string;
}

interface FormErrors {
  images?: string;
  title?: string;
  description?: string;
  price?: string;
  stock?: string;
  category?: string;
}

function validate(form: FormState, images: PickedImage[]): FormErrors {
  const errors: FormErrors = {};

  if (images.length === 0) errors.images = "Agregá al menos una imagen";

  if (!form.title.trim()) {
    errors.title = "El título es obligatorio";
  } else if (form.title.trim().length < 3) {
    errors.title = "El título debe tener al menos 3 caracteres";
  }

  if (!form.description.trim()) {
    errors.description = "La descripción es obligatoria";
  }

  const priceNum = parseFloat(form.price);
  if (!form.price.trim()) {
    errors.price = "El precio es obligatorio";
  } else if (isNaN(priceNum) || priceNum <= 0) {
    errors.price = "Ingresá un precio válido mayor a 0";
  }

  const stockNum = parseInt(form.stock, 10);
  if (!form.stock.trim()) {
    errors.stock = "El stock es obligatorio";
  } else if (isNaN(stockNum) || stockNum < 0 || !Number.isInteger(stockNum)) {
    errors.stock = "Ingresá un stock válido (número entero)";
  }

  if (!form.category) errors.category = "Seleccioná una categoría";

  return errors;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <Text style={styles.fieldError}>{message}</Text>;
}

function SectionHeader({ label }: { label: string }) {
  return <Text style={styles.sectionHeader}>{label}</Text>;
}

export function PublishPage() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const isGuest = !useAuthStore((s) => s.accessToken);
  const { mutateAsync, isPending } = useCreateProduct();

  const [images, setImages] = useState<PickedImage[]>([]);
  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    price: "",
    stock: "",
    category: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);

  if (isGuest) {
    return (
      <View style={styles.fill}>
        <View style={[styles.pageHeader, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.pageTitle}>Publicar</Text>
        </View>
        <View style={styles.guestContainer}>
          <Ionicons name="storefront-outline" size={64} color={colors.gray[300]} />
          <Text style={styles.guestTitle}>Iniciá sesión para publicar</Text>
          <Text style={styles.guestText}>
            Con tu cuenta podés publicar productos y empezar a vender.
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate("Login" as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.loginButtonText}>Iniciar sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function setField(key: keyof FormState) {
    return (value: string) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      if (errors[key]) {
        const newErrors = { ...errors };
        delete newErrors[key];
        setErrors(newErrors);
      }
    };
  }

  function handlePriceChange(text: string) {
    // Strip anything that's not a digit or dot
    let sanitized = text.replace(/[^0-9.]/g, "");
    // Allow only one dot
    const firstDot = sanitized.indexOf(".");
    if (firstDot !== -1) {
      sanitized =
        sanitized.slice(0, firstDot + 1) +
        sanitized.slice(firstDot + 1).replace(/\./g, "");
    }
    // Limit to 2 decimal places
    const parts = sanitized.split(".");
    if (parts[1] !== undefined && parts[1].length > 2) {
      sanitized = parts[0] + "." + parts[1].slice(0, 2);
    }
    setField("price")(sanitized);
  }

  async function pickImages() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tu galería para agregar fotos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.9,
      selectionLimit: MAX_IMAGES - images.length,
    });

    if (result.canceled) return;

    const newImages: PickedImage[] = [];
    const rejected: string[] = [];

    for (const asset of result.assets) {
      const mime = asset.mimeType ?? "image/jpeg";
      if (!ALLOWED_MIME.includes(mime)) {
        rejected.push(`${asset.fileName ?? "archivo"}: formato no soportado`);
        continue;
      }
      if (asset.fileSize && asset.fileSize > MAX_FILE_BYTES) {
        rejected.push(`${asset.fileName ?? "archivo"}: excede ${MAX_FILE_MB}MB`);
        continue;
      }
      const image: PickedImage = {
        uri: asset.uri,
        mimeType: mime,
        fileName: asset.fileName ?? `image_${Date.now()}.jpg`,
      };
      if (asset.fileSize !== undefined) {
        image.fileSize = asset.fileSize;
      }
      newImages.push(image);
    }

    if (rejected.length > 0) {
      Alert.alert("Algunas imágenes no se pudieron agregar", rejected.join("\n"));
    }

    setImages((prev) => [...prev, ...newImages].slice(0, MAX_IMAGES));
    if (errors.images) {
      const { images: _, ...rest } = errors;
      setErrors(rest);
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    const validationErrors = validate(form, images);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const formData = new FormData();
    formData.append("title", form.title.trim());
    formData.append("description", form.description.trim());
    formData.append("price", parseFloat(form.price).toString());
    formData.append("stock", parseInt(form.stock, 10).toString());
    formData.append("category", form.category);

    for (const img of images) {
      formData.append("files", {
        uri: img.uri,
        type: img.mimeType,
        name: img.fileName,
      } as unknown as Blob);
    }

    try {
      const result = await mutateAsync(formData);
      setCreatedProductId(result.data.id);
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      let message = "Ocurrió un error al publicar. Intentá de nuevo.";
      if (status === 422) message = "Revisá los datos ingresados e intentá de nuevo.";
      else if (status === 413) message = "Las imágenes son demasiado grandes. Reducí el tamaño e intentá de nuevo.";
      else if (status === 401 || status === 403) message = "No tenés permiso para publicar.";
      Alert.alert("Error al publicar", message);
    }
  }

  function handlePublishAnother() {
    setCreatedProductId(null);
    setImages([]);
    setForm({ title: "", description: "", price: "", stock: "", category: "" });
    setErrors({});
  }

  if (createdProductId) {
    return (
      <SafeAreaView style={styles.successContainer}>
        <View style={styles.successContent}>
          <View style={styles.successIconWrap}>
            <Ionicons name="checkmark-circle" size={72} color={colors.brand[500]} />
          </View>
          <Text style={styles.successTitle}>¡Publicación creada!</Text>
          <Text style={styles.successSubtitle}>Tu producto ya está disponible en el catálogo.</Text>
          <TouchableOpacity
            style={styles.successPrimaryBtn}
            onPress={() => navigation.navigate("ProductDetail", { productId: createdProductId })}
          >
            <Text style={styles.successPrimaryBtnText}>Ver publicación</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.successSecondaryBtn} onPress={handlePublishAnother}>
            <Text style={styles.successSecondaryBtnText}>Publicar otro producto</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nueva publicación</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Images */}
          <SectionHeader label="Fotos del producto" />
          <Text style={styles.sectionHint}>
            Agregá hasta {MAX_IMAGES} fotos (JPEG, PNG o WebP, máx. {MAX_FILE_MB}MB cada una). La primera será la imagen principal.
          </Text>
          <View style={styles.imageGrid}>
            {images.map((img, i) => (
              <View key={img.uri} style={styles.imageThumbWrap}>
                <Image source={{ uri: img.uri }} style={styles.imageThumb} />
                {i === 0 && (
                  <View style={styles.principalBadge}>
                    <Text style={styles.principalBadgeText}>Principal</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeImage(i)}>
                  <Ionicons name="close-circle" size={22} color={colors.white} />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < MAX_IMAGES && (
              <TouchableOpacity style={styles.addImageBtn} onPress={pickImages}>
                <Ionicons name="camera-outline" size={28} color={colors.brand[500]} />
                <Text style={styles.addImageText}>Agregar</Text>
              </TouchableOpacity>
            )}
          </View>
          {errors.images && <FieldError message={errors.images} />}

          {/* Title */}
          <SectionHeader label="Título" />
          <TextInput
            style={[styles.input, errors.title ? styles.inputError : null]}
            placeholder="Ej: Bicicleta de montaña rodado 29"
            placeholderTextColor={colors.gray[400]}
            value={form.title}
            onChangeText={setField("title")}
            maxLength={120}
            returnKeyType="next"
          />
          {errors.title && <FieldError message={errors.title} />}

          {/* Category */}
          <SectionHeader label="Categoría" />
          <TouchableOpacity
            style={[styles.input, styles.selectInput, errors.category ? styles.inputError : null]}
            onPress={() => setCategoryModalOpen(true)}
            activeOpacity={0.7}
          >
            <Text style={form.category ? styles.selectValue : styles.selectPlaceholder}>
              {form.category || "Seleccioná una categoría"}
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.gray[400]} />
          </TouchableOpacity>
          {errors.category && <FieldError message={errors.category} />}

          {/* Price */}
          <SectionHeader label="Precio" />
          <View style={[styles.inputWithPrefix, errors.price ? styles.inputError : null]}>
            <Text style={styles.inputPrefix}>$</Text>
            <TextInput
              style={styles.inputInner}
              placeholder="0.00"
              placeholderTextColor={colors.gray[400]}
              value={form.price}
              onChangeText={handlePriceChange}
              keyboardType="decimal-pad"
              returnKeyType="next"
            />
          </View>
          {errors.price && <FieldError message={errors.price} />}

          {/* Stock */}
          <SectionHeader label="Stock disponible" />
          <TextInput
            style={[styles.input, errors.stock ? styles.inputError : null]}
            placeholder="Ej: 10"
            placeholderTextColor={colors.gray[400]}
            value={form.stock}
            onChangeText={setField("stock")}
            keyboardType="number-pad"
            returnKeyType="next"
          />
          {errors.stock && <FieldError message={errors.stock} />}

          {/* Description */}
          <SectionHeader label="Descripción" />
          <TextInput
            style={[styles.input, styles.textArea, errors.description ? styles.inputError : null]}
            placeholder="Describí tu producto: características, estado, detalles relevantes..."
            placeholderTextColor={colors.gray[400]}
            value={form.description}
            onChangeText={setField("description")}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
          {errors.description && <FieldError message={errors.description} />}

          <View style={{ height: spacing.xl }} />
        </ScrollView>

        {/* Submit button */}
        <View style={[styles.footer]}>
          <TouchableOpacity
            style={[styles.submitBtn, isPending && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isPending}
            activeOpacity={0.85}
          >
            {isPending ? (
              <Text style={styles.submitBtnText}>Publicando...</Text>
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={20} color={colors.white} />
                <Text style={styles.submitBtnText}>Publicar producto</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Category modal */}
      <Modal
        visible={categoryModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setCategoryModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setCategoryModalOpen(false)}
        />
        <View style={[styles.categorySheet, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.categorySheetHandle} />
          <Text style={styles.categorySheetTitle}>Seleccioná una categoría</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {PRODUCT_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryOption,
                  form.category === cat && styles.categoryOptionSelected,
                ]}
                onPress={() => {
                  setField("category")(cat);
                  setCategoryModalOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.categoryOptionText,
                    form.category === cat && styles.categoryOptionTextSelected,
                  ]}
                >
                  {cat}
                </Text>
                {form.category === cat && (
                  <Ionicons name="checkmark" size={18} color={colors.brand[500]} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.gray[50] },
  flex: { flex: 1 },
  header: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
  },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.md, gap: spacing.xs },
  sectionHeader: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.gray[900],
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  sectionHint: {
    fontSize: typography.size.sm,
    color: colors.gray[500],
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  // Images
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  imageThumbWrap: {
    width: 88,
    height: 88,
    borderRadius: radius.md,
    overflow: "hidden",
    position: "relative",
  },
  imageThumb: { width: "100%", height: "100%" },
  principalBadge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingVertical: 3,
    alignItems: "center",
  },
  principalBadgeText: {
    fontSize: 11,
    color: colors.white,
    fontWeight: typography.weight.semibold,
  },
  removeImageBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 11,
  },
  addImageBtn: {
    width: 88,
    height: 88,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.brand[300],
    borderStyle: "dashed",
    backgroundColor: colors.brand[50],
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  addImageText: {
    fontSize: typography.size.sm,
    color: colors.brand[500],
    fontWeight: typography.weight.semibold,
  },
  // Inputs
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: typography.size.md,
    color: colors.gray[900],
  },
  inputError: { borderColor: colors.error },
  textArea: { minHeight: 110, paddingTop: spacing.sm },
  selectInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectValue: { fontSize: typography.size.md, color: colors.gray[900] },
  selectPlaceholder: { fontSize: typography.size.md, color: colors.gray[400] },
  inputWithPrefix: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  inputPrefix: {
    fontSize: typography.size.md,
    color: colors.gray[500],
    marginRight: spacing.xs,
  },
  inputInner: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    fontSize: typography.size.md,
    color: colors.gray[900],
  },
  fieldError: {
    fontSize: typography.size.sm,
    color: colors.error,
    marginTop: 2,
  },
  // Footer
  footer: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  submitBtn: {
    backgroundColor: colors.brand[500],
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  submitBtnDisabled: { backgroundColor: colors.gray[300] },
  submitBtnText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.white,
  },
  // Category modal
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  categorySheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
    maxHeight: "70%",
  },
  categorySheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray[300],
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  categorySheetTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  categoryOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  categoryOptionSelected: { backgroundColor: colors.brand[50] },
  categoryOptionText: { fontSize: typography.size.md, color: colors.gray[700] },
  categoryOptionTextSelected: { color: colors.brand[600], fontWeight: typography.weight.semibold },
  // Success screen
  successContainer: { flex: 1, backgroundColor: colors.white },
  successContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  successIconWrap: { marginBottom: spacing.sm },
  successTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: typography.size.md,
    color: colors.gray[500],
    textAlign: "center",
    lineHeight: 24,
  },
  successPrimaryBtn: {
    backgroundColor: colors.brand[500],
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
    width: "100%",
    alignItems: "center",
  },
  successPrimaryBtnText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.white,
  },
  successSecondaryBtn: {
    borderWidth: 1.5,
    borderColor: colors.brand[500],
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    width: "100%",
    alignItems: "center",
  },
  successSecondaryBtnText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.brand[500],
  },
  fill: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  pageHeader: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  pageTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
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
