import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Search, ImagePlus, Camera, Sliders, ShieldCheck, X } from "lucide-react-native";
import { useTheme } from "../theme/theme-context";
import { ApiService } from "../services/api-service";

const TOP_K_OPTIONS = [5, 10, 15, 20, 30];
const METRICS = [
  { id: "cosine", label: "Cosine Similarity", desc: "Angle-based metric (Best for CBIR)" },
  { id: "euclidean", label: "Euclidean Distance", desc: "L2 Norm spatial distance" },
];

export const QueryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const [selectedImage, setSelectedImage] = useState<{ uri: string; name?: string; type?: string } | null>(null);
  const [topK, setTopK] = useState(10);
  const [metric, setMetric] = useState("cosine");
  const [loading, setLoading] = useState(false);

  const handlePickGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission Required", "Photo library access is needed to select query images.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.85,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setSelectedImage({
        uri: asset.uri,
        name: asset.fileName || `query_${Date.now()}.jpg`,
        type: asset.mimeType || "image/jpeg",
      });
    }
  };

  const handlePickCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission Required", "Camera access is needed to capture query images.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.85,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setSelectedImage({
        uri: asset.uri,
        name: asset.fileName || `query_${Date.now()}.jpg`,
        type: asset.mimeType || "image/jpeg",
      });
    }
  };

  const handleExecuteQuery = async () => {
    if (!selectedImage) {
      Alert.alert("No Image Selected", "Please select or capture a query image first.");
      return;
    }

    setLoading(true);
    try {
      const response = await ApiService.executeRetrieval(selectedImage, topK, metric);
      navigation.navigate("ResultsScreen", {
        queryUri: selectedImage.uri,
        data: response,
      });
    } catch (err: any) {
      Alert.alert(
        "Query Error",
        err?.response?.data?.error || err.message || "Failed to execute visual retrieval. Check server connection."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: colors.text }]}>Visual Query Engine</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Upload or capture an image to search for similar encrypted vector matches.
        </Text>
      </View>

      {/* Image Selection Area */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>QUERY IMAGE PAYLOAD</Text>

        {selectedImage ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} resizeMode="cover" />
            <TouchableOpacity
              style={[styles.removeImageBtn, { backgroundColor: colors.error }]}
              onPress={() => setSelectedImage(null)}
            >
              <X size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.emptyPickerBox, { borderColor: colors.borderSubtle, backgroundColor: colors.background }]}>
            <View style={[styles.emptyIconBox, { backgroundColor: colors.primarySubtle }]}>
              <Search size={28} color={colors.primary} />
            </View>
            <Text style={[styles.emptyPromptText, { color: colors.text }]}>Select Query Image</Text>
            <Text style={[styles.emptyPromptSub, { color: colors.textMuted }]}>Choose from device gallery or capture photo</Text>

            <View style={styles.pickButtonsRow}>
              <TouchableOpacity
                style={[styles.pickBtn, { backgroundColor: colors.primarySubtle, borderColor: colors.border }]}
                onPress={handlePickGallery}
              >
                <ImagePlus size={16} color={colors.primary} />
                <Text style={[styles.pickBtnText, { color: colors.primary }]}>GALLERY</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.pickBtn, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}
                onPress={handlePickCamera}
              >
                <Camera size={16} color={colors.text} />
                <Text style={[styles.pickBtnText, { color: colors.text }]}>CAMERA</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Top-K Configuration */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>TOP-K MATCHES TO RETRIEVE</Text>
        <View style={styles.topKRow}>
          {TOP_K_OPTIONS.map((k) => {
            const isSelected = topK === k;
            return (
              <TouchableOpacity
                key={k}
                style={[
                  styles.topKBtn,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.background,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setTopK(k)}
              >
                <Text
                  style={[
                    styles.topKBtnText,
                    { color: isSelected ? colors.background : colors.text },
                  ]}
                >
                  {k}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Metric Configuration */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>SIMILARITY METRIC</Text>
        <View style={styles.metricList}>
          {METRICS.map((m) => {
            const isSelected = metric === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                style={[
                  styles.metricCard,
                  {
                    backgroundColor: isSelected ? colors.primarySubtle : colors.background,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setMetric(m.id)}
              >
                <View style={styles.metricRadio}>
                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor: isSelected ? colors.primary : colors.border,
                        backgroundColor: isSelected ? colors.primary : "transparent",
                      },
                    ]}
                  />
                  <View style={styles.metricTexts}>
                    <Text style={[styles.metricLabel, { color: isSelected ? colors.primary : colors.text }]}>
                      {m.label}
                    </Text>
                    <Text style={[styles.metricDesc, { color: colors.textMuted }]}>{m.desc}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Execute Button */}
      <TouchableOpacity
        style={[
          styles.executeBtn,
          {
            backgroundColor: selectedImage && !loading ? colors.primary : colors.cardElevated,
            opacity: selectedImage && !loading ? 1 : 0.6,
          },
        ]}
        onPress={handleExecuteQuery}
        disabled={!selectedImage || loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.background} />
        ) : (
          <>
            <Search size={18} color={selectedImage ? colors.background : colors.textMuted} />
            <Text
              style={[
                styles.executeBtnText,
                { color: selectedImage ? colors.background : colors.textMuted },
              ]}
            >
              RUN ENCRYPTED RETRIEVAL
            </Text>
          </>
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
  previewContainer: {
    height: 200,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  removeImageBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyPickerBox: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  emptyIconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyPromptText: {
    fontSize: 14,
    fontWeight: "800",
  },
  emptyPromptSub: {
    fontSize: 11,
    textAlign: "center",
    marginBottom: 8,
  },
  pickButtonsRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  pickBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
  },
  pickBtnText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  topKRow: {
    flexDirection: "row",
    gap: 8,
  },
  topKBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  topKBtnText: {
    fontSize: 13,
    fontWeight: "900",
  },
  metricList: {
    gap: 8,
  },
  metricCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  metricRadio: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
  metricTexts: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: "800",
  },
  metricDesc: {
    fontSize: 10,
    marginTop: 2,
  },
  executeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: 14,
    marginTop: 6,
  },
  executeBtnText: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
  },
});
