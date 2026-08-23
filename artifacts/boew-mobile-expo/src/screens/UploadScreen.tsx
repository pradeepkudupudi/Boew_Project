import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { UploadCloud, ImagePlus, X, ShieldCheck, CheckCircle2 } from "lucide-react-native";
import { useTheme } from "../theme/theme-context";
import { ApiService } from "../services/api-service";

export const UploadScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const [images, setImages] = useState<Array<{ uri: string; name: string; type?: string }>>([]);
  const [category, setCategory] = useState("");
  const [uploading, setUploading] = useState(false);

  const handlePickImages = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission Required", "Photo library access is needed to select images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.85,
    });

    if (!result.canceled && result.assets) {
      const selected = result.assets.map((a, i) => ({
        uri: a.uri,
        name: a.fileName || `batch_${Date.now()}_${i}.jpg`,
        type: a.mimeType || "image/jpeg",
      }));
      setImages((prev) => [...prev, ...selected]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (images.length === 0) {
      Alert.alert("No Images Selected", "Please select at least one image to upload.");
      return;
    }

    setUploading(true);
    try {
      const res = await ApiService.uploadImages(images, category);
      Alert.alert(
        "Upload Complete",
        `Successfully ingested and encrypted ${res.indexed ?? res.uploaded} of ${res.uploaded} assets.`,
        [
          {
            text: "View Dataset",
            onPress: () => {
              setImages([]);
              setCategory("");
              navigation.navigate("DatasetTab");
            },
          },
          {
            text: "OK",
            onPress: () => {
              setImages([]);
              setCategory("");
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert(
        "Upload Error",
        err?.response?.data?.error || err.message || "Failed to upload image dataset."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: colors.text }]}>Dataset Ingestion</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Batch upload raw images. Features will be extracted & encrypted with AES-256 CBC.
        </Text>
      </View>

      {/* Category Input */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>ASSET CATEGORY (OPTIONAL)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
          value={category}
          onChangeText={setCategory}
          placeholder="e.g. landscapes, vehicles, architecture..."
          placeholderTextColor={colors.textDim}
          editable={!uploading}
        />
      </View>

      {/* Picker Zone */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>ASSET PAYLOAD</Text>
        <TouchableOpacity
          style={[styles.dropBox, { borderColor: colors.borderSubtle, backgroundColor: colors.background }]}
          onPress={handlePickImages}
          disabled={uploading}
          activeOpacity={0.7}
        >
          <View style={[styles.uploadIconBox, { backgroundColor: colors.primarySubtle }]}>
            <UploadCloud size={28} color={colors.primary} />
          </View>
          <Text style={[styles.dropPromptText, { color: colors.text }]}>Select Image Assets</Text>
          <Text style={[styles.dropPromptSub, { color: colors.textMuted }]}>
            Supports batch photo library selection (JPG, PNG, WEBP)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Staged Images List */}
      {images.length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.stagedHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>STAGED PAYLOAD</Text>
            <Text style={[styles.countBadge, { color: colors.primary }]}>{images.length} FILES</Text>
          </View>

          <View style={styles.thumbnailGrid}>
            {images.map((img, i) => (
              <View key={i} style={[styles.thumbBox, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <Image source={{ uri: img.uri }} style={styles.thumbnail} resizeMode="cover" />
                <TouchableOpacity
                  style={[styles.removeBtn, { backgroundColor: colors.error }]}
                  onPress={() => handleRemoveImage(i)}
                >
                  <X size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Upload Button */}
      <TouchableOpacity
        style={[
          styles.uploadBtn,
          {
            backgroundColor: images.length > 0 && !uploading ? colors.primary : colors.cardElevated,
            opacity: images.length > 0 && !uploading ? 1 : 0.6,
          },
        ]}
        onPress={handleUpload}
        disabled={images.length === 0 || uploading}
        activeOpacity={0.8}
      >
        {uploading ? (
          <View style={styles.uploadingRow}>
            <ActivityIndicator color={colors.background} />
            <Text style={[styles.uploadBtnText, { color: colors.background }]}>
              ENCRYPTING & INDEXING DATASET...
            </Text>
          </View>
        ) : (
          <View style={styles.uploadingRow}>
            <ShieldCheck size={18} color={images.length > 0 ? colors.background : colors.textMuted} />
            <Text
              style={[
                styles.uploadBtnText,
                { color: images.length > 0 ? colors.background : colors.textMuted },
              ]}
            >
              INGEST & ENCRYPT {images.length > 0 ? `(${images.length} ASSETS)` : ""}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 36,
  },
  titleContainer: {
    gap: 4,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 18,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  input: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 13,
  },
  dropBox: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    gap: 6,
  },
  uploadIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  dropPromptText: {
    fontSize: 14,
    fontWeight: "800",
  },
  dropPromptSub: {
    fontSize: 11,
    textAlign: "center",
  },
  stagedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  countBadge: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  thumbnailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  thumbBox: {
    width: 70,
    height: 70,
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  removeBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  uploadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  uploadBtnText: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
});
