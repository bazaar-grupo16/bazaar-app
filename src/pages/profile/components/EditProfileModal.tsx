import { useState, useEffect } from "react";
import { 
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, 
  KeyboardAvoidingView, Platform, Image, ActivityIndicator 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { colors, typography, spacing, radius } from "@/shared/styles";
import type { Profile } from "@/entities/profile/model/types";
import { updateMyProfile, uploadAvatar } from "@/entities/profile/api/profile";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  visible: boolean;
  profile: Profile | null;
  onClose: () => void;
  onSaveSuccess: (updatedProfile: Profile) => void;
}

export function EditProfileModal({ visible, profile, onClose, onSaveSuccess }: Props) {
  // Estados del formulario
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible && profile) {
      setName(profile.name || "");
      setBio(profile.description || "");
      setAvatarUrl(profile.profile_picture_url || null);
    }
  }, [visible, profile]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedUri = result.assets[0]?.uri;
      
      if (selectedUri) {
        setAvatarUrl(selectedUri);
      }
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      let finalAvatarUrl = avatarUrl;

      if (avatarUrl && avatarUrl.startsWith("file://")) {
        const formData = new FormData();
        
        const filename = avatarUrl.split('/').pop() || 'avatar.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append("file", {
          uri: avatarUrl,
          type: type,
          name: filename,
        } as unknown as Blob);

        const uploadResponse = await uploadAvatar(formData);
        finalAvatarUrl = uploadResponse.url; 
      }

      const updatedProfile = await updateMyProfile({
        name,
        description: bio,
        profile_picture_url: finalAvatarUrl,
      });

      await queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      
      onSaveSuccess(updatedProfile);
      onClose();
    } catch (error) {
      console.error("Error al guardar perfil:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView 
        style={styles.overlay} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.sheet}>
          
          {/* Header del Modal */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={colors.gray[900]} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Editar Perfil</Text>
            <TouchableOpacity onPress={handleSave} disabled={isSaving}>
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.brand[500]} />
              ) : (
                <Text style={styles.saveBtnText}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.photoContainer}>
            <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickImage}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={40} color={colors.white} />
                </View>
              )}
              <View style={styles.editPhotoIcon}>
                <Ionicons name="camera" size={16} color={colors.white} />
              </View>
            </TouchableOpacity>
            <Text style={styles.photoLabel}>Cambiar foto</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.inputLabel}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Tu nombre completo"
              placeholderTextColor={colors.gray[400]}
            />

            <Text style={styles.inputLabel}>Presentación (Biografía)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Contale a los demás sobre vos..."
              placeholderTextColor={colors.gray[400]}
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, paddingBottom: 40, maxHeight: "90%" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.gray[200] },
  headerTitle: { fontSize: typography.size.md, fontWeight: typography.weight.bold, color: colors.gray[900] },
  saveBtnText: { fontSize: typography.size.md, fontWeight: typography.weight.bold, color: colors.brand[500] },
  photoContainer: { alignItems: "center", paddingVertical: spacing.lg },
  avatarWrapper: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.gray[300], justifyContent: "center", alignItems: "center", position: "relative" },
  avatarImage: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.gray[400], justifyContent: "center", alignItems: "center" },
  editPhotoIcon: { position: "absolute", bottom: 0, right: 0, backgroundColor: colors.brand[500], width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center", borderWidth: 3, borderColor: colors.white },
  photoLabel: { marginTop: spacing.sm, fontSize: typography.size.sm, color: colors.brand[500], fontWeight: "600" },
  form: { paddingHorizontal: spacing.md },
  inputLabel: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.gray[700], marginBottom: 6, marginTop: spacing.md },
  input: { backgroundColor: colors.gray[50], borderWidth: 1, borderColor: colors.gray[200], borderRadius: radius.md, padding: spacing.sm, fontSize: typography.size.md, color: colors.gray[900] },
  textArea: { minHeight: 100 },
});