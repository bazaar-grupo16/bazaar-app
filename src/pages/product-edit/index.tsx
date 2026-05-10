import { useState, useEffect } from "react";
import {
  ActivityIndicator,
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
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useQueryClient } from "@tanstack/react-query";
import { useProduct, updateProduct, addProductImages, deleteProductImages, reorderProductImages } from "@/entities/product";
import { ApiError } from "@/shared/api";
import { PRODUCT_CATEGORIES } from "@/shared/config/categories";
import { colors, typography, spacing, radius } from "@/shared/styles";
import type { RootStackParamList } from "@/navigation";

type RouteProps = NativeStackScreenProps<RootStackParamList, "EditProduct">["route"];
type NavProps = NativeStackNavigationProp<RootStackParamList, "EditProduct">;

const MAX_IMAGES = 5;
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

interface PickedImage {
  uri: string;
  mimeType: string;
  fileName: string;
}

interface FormErrors {
  title?: string | undefined;
  price?: string | undefined;
  stock?: string | undefined;
  category?: string | undefined;
  images?: string | undefined;
}

function validate(title: string, price: string, stock: string, category: string, imageCount: number): FormErrors {
  const errs: FormErrors = {};
  if (!title.trim()) errs.title = "El título es obligatorio";
  const priceNum = parseFloat(price);
  if (!price.trim() || isNaN(priceNum) || priceNum <= 0) errs.price = "Ingresá un precio válido mayor a 0";
  const stockNum = parseInt(stock, 10);
  if (!stock.trim() || isNaN(stockNum) || stockNum < 0 || !Number.isInteger(stockNum)) {
    errs.stock = "El stock debe ser un número entero de 0 o más";
  }
  if (!category) errs.category = "Seleccioná una categoría";
  if (imageCount === 0) errs.images = "La publicación debe tener al menos una imagen";
  return errs;
}

function apiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status === 401 || err.status === 403) return "No tenés permiso para modificar esta publicación.";
    if (err.status === 422) return "Revisá los datos ingresados e intentá de nuevo.";
  }
  return fallback;
}

// ─── sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return <Text style={sectionStyles.header}>{label}</Text>;
}

function FieldError({ message }: { message?: string | undefined }) {
  if (!message) return null;
  return <Text style={sectionStyles.error}>{message}</Text>;
}

function Field({ label, error, children }: { label: string; error?: string | undefined; children: React.ReactNode }) {
  return (
    <View style={sectionStyles.field}>
      <Text style={sectionStyles.label}>{label}</Text>
      {children}
      <FieldError message={error} />
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  header: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.gray[900],
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  field: { marginBottom: spacing.md },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  error: {
    fontSize: typography.size.sm,
    color: colors.error,
    marginTop: 2,
  },
});

// ─── main component ───────────────────────────────────────────────────────────

export function EditProductPage() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavProps>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const productId = route.params.productId;

  const { data, isLoading } = useProduct(productId);
  const product = data?.data;

  // form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");

  // images: existing URLs in display order, list of URLs to delete, newly picked files
  const [orderedImages, setOrderedImages] = useState<string[]>([]);
  const [toDeleteUrls, setToDeleteUrls] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<PickedImage[]>([]);
  const [imageOrderChanged, setImageOrderChanged] = useState(false);

  // ui
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  function clearError(key: keyof FormErrors) {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  useEffect(() => {
    if (product) {
      setTitle(product.title);
      setPrice(String(product.price));
      setDescription(product.description);
      setCategory(product.category);
      setStock(String(product.stock));
      setOrderedImages(product.images ?? []);
    }
  }, [product]);

  const totalImageCount = orderedImages.length + newImages.length;
  const isInactive = product?.status === "inactive";

  // ── image handlers ──────────────────────────────────────────────────────────

  function handleDeleteExistingImage(url: string) {
    if (totalImageCount <= 1) {
      Alert.alert("Sin imágenes", "La publicación debe tener al menos una imagen.");
      return;
    }
    setOrderedImages((prev) => prev.filter((u) => u !== url));
    setToDeleteUrls((prev) => [...prev, url]);
    clearError("images");
  }

  function handleDeleteNewImage(index: number) {
    if (totalImageCount <= 1) {
      Alert.alert("Sin imágenes", "La publicación debe tener al menos una imagen.");
      return;
    }
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    clearError("images");
  }

  function moveImageLeft(index: number) {
    if (index === 0) return;
    setOrderedImages((prev) => {
      const next = [...prev];
      const a = next[index - 1] ?? "";
      const b = next[index] ?? "";
      next[index - 1] = b;
      next[index] = a;
      return next;
    });
    setImageOrderChanged(true);
  }

  function moveImageRight(index: number) {
    if (index >= orderedImages.length - 1) return;
    setOrderedImages((prev) => {
      const next = [...prev];
      const a = next[index] ?? "";
      const b = next[index + 1] ?? "";
      next[index] = b;
      next[index + 1] = a;
      return next;
    });
    setImageOrderChanged(true);
  }

  async function pickImages() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tu galería para agregar fotos.");
      return;
    }
    const remaining = MAX_IMAGES - totalImageCount;
    if (remaining <= 0) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.9,
      selectionLimit: remaining,
    });
    if (result.canceled) return;

    const valid: PickedImage[] = [];
    const rejected: string[] = [];
    for (const asset of result.assets) {
      const mime = asset.mimeType ?? "image/jpeg";
      if (!ALLOWED_MIME.includes(mime)) {
        rejected.push(asset.fileName ?? "archivo");
        continue;
      }
      valid.push({ uri: asset.uri, mimeType: mime, fileName: asset.fileName ?? `image_${Date.now()}.jpg` });
    }
    if (rejected.length > 0) Alert.alert("Formato no soportado", `${rejected.join(", ")} no se pudo agregar.`);
    setNewImages((prev) => [...prev, ...valid].slice(0, remaining));
    clearError("images");
  }

  // ── price input ──────────────────────────────────────────────────────────────

  function handlePriceChange(text: string) {
    let s = text.replace(/[^0-9.]/g, "");
    const dot = s.indexOf(".");
    if (dot !== -1) s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, "");
    const parts = s.split(".");
    if (parts[1] !== undefined && parts[1].length > 2) s = parts[0] + "." + (parts[1] ?? "").slice(0, 2);
    setPrice(s);
    if (errors.price) clearError("price");
  }

  // ── save ─────────────────────────────────────────────────────────────────────

  async function handleSave() {
    const errs = validate(title, price, stock, category, totalImageCount);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsSaving(true);
    try {
      await updateProduct(productId, {
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price),
        stock: parseInt(stock, 10),
        category,
      });

      if (toDeleteUrls.length > 0) {
        await deleteProductImages(productId, toDeleteUrls);
      }

      if (newImages.length > 0) {
        const formData = new FormData();
        for (const img of newImages) {
          formData.append("files", { uri: img.uri, type: img.mimeType, name: img.fileName } as unknown as Blob);
        }
        await addProductImages(productId, formData);
      }

      if (imageOrderChanged && orderedImages.length > 0) {
        await reorderProductImages(productId, orderedImages);
      }

      await queryClient.invalidateQueries({ queryKey: ["products"] });
      await queryClient.invalidateQueries({ queryKey: ["my-products"] });
      await queryClient.invalidateQueries({ queryKey: ["product", productId] });

      navigation.goBack();
    } catch (err) {
      Alert.alert("Error al guardar", apiErrorMessage(err, "Ocurrió un error al guardar. Intentá de nuevo."));
    } finally {
      setIsSaving(false);
    }
  }

  // ── status toggle ─────────────────────────────────────────────────────────────

  function handleToggleStatus() {
    if (!product) return;
    const enabling = isInactive;
    const title_ = enabling ? "Rehabilitar publicación" : "Deshabilitar publicación";
    const message = enabling
      ? "El producto volverá a ser visible en el catálogo si tiene stock disponible."
      : "El producto dejará de ser visible para los compradores y no podrá ser comprado.";
    const actionLabel = enabling ? "Rehabilitar" : "Deshabilitar";

    Alert.alert(title_, message, [
      { text: "Cancelar", style: "cancel" },
      {
        text: actionLabel,
        style: enabling ? "default" : "destructive",
        onPress: async () => {
          setIsTogglingStatus(true);
          try {
            const newStatus = enabling ? (product.stock === 0 ? "out_of_stock" : "active") : "inactive";
            await updateProduct(productId, { status: newStatus });
            await queryClient.invalidateQueries({ queryKey: ["products"] });
            await queryClient.invalidateQueries({ queryKey: ["my-products"] });
            await queryClient.invalidateQueries({ queryKey: ["product", productId] });
            navigation.goBack();
          } catch (err) {
            Alert.alert("Error", apiErrorMessage(err, "No se pudo cambiar el estado. Intentá de nuevo."));
          } finally {
            setIsTogglingStatus(false);
          }
        },
      },
    ]);
  }

  // ── loading state ─────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.brand[500]} />
      </View>
    );
  }

  const isBusy = isSaving || isTogglingStatus;
  const firstImageIsNew = orderedImages.length === 0 && newImages.length > 0;

  // ── locked state for inactive products ────────────────────────────────────────

  if (isInactive) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={22} color={colors.gray[700]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar publicación</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.lockedBody}>
          <Ionicons name="pause-circle-outline" size={72} color={colors.gray[300]} />
          <Text style={styles.lockedTitle}>Publicación deshabilitada</Text>
          <Text style={styles.lockedSubtitle}>
            Esta publicación no está visible en el catálogo ni puede ser comprada.
            Rehabilitala para poder editar su contenido.
          </Text>
          <TouchableOpacity
            style={[styles.rehabilitateBtn, isTogglingStatus && styles.btnDisabled]}
            onPress={handleToggleStatus}
            disabled={isTogglingStatus}
            activeOpacity={0.85}
          >
            {isTogglingStatus
              ? <ActivityIndicator size="small" color={colors.white} />
              : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color={colors.white} />
                  <Text style={styles.rehabilitateBtnText}>Rehabilitar publicación</Text>
                </>
              )
            }
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.gray[700]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar publicación</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Images ── */}
          <SectionHeader label="Fotos del producto" />
          <Text style={styles.hint}>
            La primera imagen es la principal. Usá las flechas para reordenar.
          </Text>

          <View style={styles.imageGrid}>
            {/* Existing images */}
            {orderedImages.map((url, i) => (
              <View key={url} style={styles.imageThumbWrap}>
                <Image source={{ uri: url }} style={styles.imageThumb} resizeMode="cover" />

                {/* Remove */}
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => handleDeleteExistingImage(url)}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                >
                  <Ionicons name="close-circle" size={22} color={colors.white} />
                </TouchableOpacity>

                {/* Bottom bar: reorder + principal label */}
                <View style={styles.imageBottomBar}>
                  <TouchableOpacity
                    onPress={() => moveImageLeft(i)}
                    disabled={i === 0}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={15}
                      color={i === 0 ? "rgba(255,255,255,0.3)" : colors.white}
                    />
                  </TouchableOpacity>

                  <Text style={styles.imageBarLabel} numberOfLines={1}>
                    {i === 0 ? "Principal" : " "}
                  </Text>

                  <TouchableOpacity
                    onPress={() => moveImageRight(i)}
                    disabled={i >= orderedImages.length - 1}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={15}
                      color={i >= orderedImages.length - 1 ? "rgba(255,255,255,0.3)" : colors.white}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* New images */}
            {newImages.map((img, i) => (
              <View key={img.uri} style={styles.imageThumbWrap}>
                <Image source={{ uri: img.uri }} style={styles.imageThumb} resizeMode="cover" />

                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => handleDeleteNewImage(i)}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                >
                  <Ionicons name="close-circle" size={22} color={colors.white} />
                </TouchableOpacity>

                {firstImageIsNew && i === 0 && (
                  <View style={styles.imageBottomBar}>
                    <Text style={[styles.imageBarLabel, { textAlign: "center", flex: 1 }]}>Principal</Text>
                  </View>
                )}
              </View>
            ))}

            {/* Add button */}
            {totalImageCount < MAX_IMAGES && (
              <TouchableOpacity style={styles.addImageBtn} onPress={pickImages} activeOpacity={0.7}>
                <Ionicons name="camera-outline" size={28} color={colors.brand[500]} />
                <Text style={styles.addImageText}>Agregar</Text>
              </TouchableOpacity>
            )}
          </View>
          <FieldError message={errors.images} />

          {/* ── Fields ── */}
          <Field label="Título" error={errors.title}>
            <TextInput
              style={[styles.input, errors.title ? styles.inputError : null]}
              value={title}
              onChangeText={(t) => { setTitle(t); clearError("title"); }}
              placeholder="Título del producto"
              placeholderTextColor={colors.gray[400]}
              maxLength={120}
            />
          </Field>

          <Field label="Categoría" error={errors.category}>
            <TouchableOpacity
              style={[styles.input, styles.selectInput, errors.category ? styles.inputError : null]}
              onPress={() => setCategoryModalOpen(true)}
              activeOpacity={0.7}
            >
              <Text style={category ? styles.selectValue : styles.selectPlaceholder}>
                {category || "Seleccioná una categoría"}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.gray[400]} />
            </TouchableOpacity>
          </Field>

          <Field label="Precio" error={errors.price}>
            <View style={[styles.inputWithPrefix, errors.price ? styles.inputError : null]}>
              <Text style={styles.inputPrefix}>$</Text>
              <TextInput
                style={styles.inputInner}
                value={price}
                onChangeText={handlePriceChange}
                placeholder="0.00"
                placeholderTextColor={colors.gray[400]}
                keyboardType="decimal-pad"
              />
            </View>
          </Field>

          <Field label="Stock disponible" error={errors.stock}>
            <TextInput
              style={[styles.input, errors.stock ? styles.inputError : null]}
              value={stock}
              onChangeText={(t) => { setStock(t.replace(/[^0-9]/g, "")); clearError("stock"); }}
              placeholder="0"
              placeholderTextColor={colors.gray[400]}
              keyboardType="number-pad"
            />
          </Field>

          <Field label="Descripción">
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={description}
              onChangeText={setDescription}
              placeholder="Descripción del producto"
              placeholderTextColor={colors.gray[400]}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </Field>

          {/* ── Save button ── */}
          <TouchableOpacity
            style={[styles.saveBtn, isBusy && styles.btnDisabled]}
            onPress={handleSave}
            disabled={isBusy}
            activeOpacity={0.85}
          >
            {isSaving
              ? <ActivityIndicator size="small" color={colors.white} />
              : <Text style={styles.saveBtnText}>Guardar cambios</Text>
            }
          </TouchableOpacity>

          {/* ── Disable / Enable button ── */}
          <TouchableOpacity
              style={[
                styles.statusBtn,
                isInactive ? styles.statusBtnEnable : styles.statusBtnDisable,
                isBusy && styles.btnDisabled,
              ]}
              onPress={handleToggleStatus}
              disabled={isBusy}
              activeOpacity={0.85}
            >
              {isTogglingStatus
                ? <ActivityIndicator size="small" color={isInactive ? colors.brand[500] : colors.error} />
                : (
                  <>
                    <Ionicons
                      name={isInactive ? "checkmark-circle-outline" : "ban-outline"}
                      size={18}
                      color={isInactive ? colors.brand[500] : colors.error}
                    />
                    <Text style={[styles.statusBtnText, isInactive ? styles.statusBtnTextEnable : styles.statusBtnTextDisable]}>
                      {isInactive ? "Rehabilitar publicación" : "Deshabilitar publicación"}
                    </Text>
                  </>
                )
              }
          </TouchableOpacity>
          

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Category modal */}
      <Modal
        visible={categoryModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setCategoryModalOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setCategoryModalOpen(false)} />
        <View style={[styles.categorySheet, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Seleccioná una categoría</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {PRODUCT_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryOption, category === cat && styles.categoryOptionSelected]}
                onPress={() => {
                  setCategory(cat);
                  clearError("category");
                  setCategoryModalOpen(false);
                }}
              >
                <Text style={[styles.categoryOptionText, category === cat && styles.categoryOptionTextSelected]}>
                  {cat}
                </Text>
                {category === cat && <Ionicons name="checkmark" size={18} color={colors.brand[500]} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

    </View>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.gray[50] },
  flex:        { flex: 1 },
  centered:    { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.gray[100],
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
  },
  scroll: { flex: 1 },
  content: { padding: spacing.md },
  hint: {
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
    width: 88, height: 88,
    borderRadius: radius.md,
    overflow: "hidden",
    position: "relative",
  },
  imageThumb: { width: "100%", height: "100%" },
  removeBtn: {
    position: "absolute", top: 4, right: 4,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 11,
  },
  imageBottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    height: 22,
    backgroundColor: "rgba(0,0,0,0.52)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  imageBarLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 10,
    color: colors.white,
    fontWeight: "600",
  },
  addImageBtn: {
    width: 88, height: 88,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.brand[300],
    borderStyle: "dashed",
    backgroundColor: colors.brand[50],
    alignItems: "center", justifyContent: "center",
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
  inputError:     { borderColor: colors.error },
  inputMultiline: { minHeight: 100, paddingTop: spacing.sm, textAlignVertical: "top" },
  selectInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectValue:       { fontSize: typography.size.md, color: colors.gray[900] },
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

  // Buttons
  saveBtn: {
    backgroundColor: colors.brand[500],
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
    flexDirection: "row",
    gap: spacing.xs,
  },
  saveBtnText: {
    color: colors.white,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },
  btnDisabled: { opacity: 0.55 },
  statusBtn: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
    flexDirection: "row",
    gap: spacing.xs,
  },
  statusBtnDisable: { borderColor: colors.error,      backgroundColor: "#fff5f5" },
  statusBtnEnable:  { borderColor: colors.brand[500],  backgroundColor: colors.brand[50] },
  statusBtnText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  statusBtnTextDisable: { color: colors.error },
  statusBtnTextEnable:  { color: colors.brand[500] },

  // Locked / inactive state
  lockedBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  lockedTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.gray[900],
    textAlign: "center",
  },
  lockedSubtitle: {
    fontSize: typography.size.sm,
    color: colors.gray[500],
    textAlign: "center",
    lineHeight: 22,
  },
  rehabilitateBtn: {
    backgroundColor: colors.brand[500],
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.md,
    width: "100%",
  },
  rehabilitateBtnText: {
    color: colors.white,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },

  // Category modal
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  categorySheet: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
    maxHeight: "70%",
  },
  sheetHandle: {
    width: 40, height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray[300],
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  sheetTitle: {
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
});
