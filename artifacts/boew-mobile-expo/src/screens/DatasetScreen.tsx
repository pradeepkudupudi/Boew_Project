import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import { Database, Trash2, X, ShieldCheck, Tag } from "lucide-react-native";
import { useTheme } from "../theme/theme-context";
import { ApiService, DatasetImageItem, DatasetStats } from "../services/api-service";
import { getStoredApiUrl, resolveImageUri } from "../services/api-config";

const { width } = Dimensions.get("window");
const NUM_COLUMNS = 3;
const ITEM_SIZE = (width - 32 - (NUM_COLUMNS - 1) * 8) / NUM_COLUMNS;

export const DatasetScreen: React.FC = () => {
  const { colors } = useTheme();
  const [images, setImages] = useState<DatasetImageItem[]>([]);
  const [stats, setStats] = useState<DatasetStats | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [serverUrl, setServerUrl] = useState("");
  const [previewItem, setPreviewItem] = useState<DatasetImageItem | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [url, imgsData, dsStats] = await Promise.all([
        getStoredApiUrl(),
        ApiService.getDatasetImages(1, 100).catch(() => ({ images: [], total: 0 })),
        ApiService.getDatasetStats().catch(() => null),
      ]);
      setServerUrl(url);
      setImages(imgsData?.images || []);
      setStats(dsStats);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleDelete = (item: DatasetImageItem) => {
    Alert.alert("Delete Asset", `Permanently remove "${item.originalName || item.filename}" from dataset?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await ApiService.deleteDatasetImage(item.id);
            setImages((prev) => prev.filter((img) => img.id !== item.id));
            setPreviewItem(null);
          } catch (e: any) {
            Alert.alert("Error", e.message || "Failed to delete image");
          }
        },
      },
    ]);
  };

  const categories = stats?.categories || [];
  const categoryFilters = ["ALL", ...categories.map((c) => c.name)];

  const filteredImages =
    selectedCategory === "ALL"
      ? images
      : images.filter((img) => (img.category || "Uncategorized").toLowerCase() === selectedCategory.toLowerCase());

  const renderItem = ({ item }: { item: DatasetImageItem }) => {
    const uri = resolveImageUri(serverUrl, item.filename);
    return (
      <TouchableOpacity
        style={[styles.gridItem, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => setPreviewItem(item)}
        activeOpacity={0.8}
      >
        <Image source={{ uri }} style={styles.gridImage} resizeMode="cover" />
        {item.category && (
          <View style={[styles.itemCategoryBadge, { backgroundColor: "rgba(0,0,0,0.75)" }]}>
            <Text style={[styles.itemCategoryText, { color: colors.primary }]} numberOfLines={1}>
              {item.category}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Info */}
      <View style={styles.headerInfo}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Dataset Registry</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {images.length} Encrypted Assets in Index
          </Text>
        </View>
      </View>

      {/* Categories Horizontal Scroll */}
      <View style={styles.categoryScrollContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categoryFilters}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => {
            const isSelected = selectedCategory.toLowerCase() === item.toLowerCase();
            return (
              <TouchableOpacity
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSelectedCategory(item)}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    { color: isSelected ? colors.background : colors.text },
                  ]}
                >
                  {item.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Gallery Grid */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredImages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Database size={40} color={colors.textDim} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Assets in Dataset</Text>
          <Text style={[styles.emptySub, { color: colors.textMuted }]}>
            Upload images from the Ingestion tab to build the index.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredImages}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={styles.gridContainer}
          columnWrapperStyle={styles.gridRow}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Image Preview & Info Modal */}
      {previewItem && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setPreviewItem(null)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.previewModalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={1}>
                  {previewItem.originalName || previewItem.filename}
                </Text>
                <TouchableOpacity onPress={() => setPreviewItem(null)}>
                  <X size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <Image
                source={{ uri: resolveImageUri(serverUrl, previewItem.filename) }}
                style={styles.modalPreviewImage}
                resizeMode="contain"
              />

              <View style={styles.modalMetaBody}>
                <View style={styles.metaRow}>
                  <Text style={[styles.metaLabel, { color: colors.textMuted }]}>CATEGORY</Text>
                  <Text style={[styles.metaValue, { color: colors.primary }]}>
                    {previewItem.category || "Unclassified"}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={[styles.metaLabel, { color: colors.textMuted }]}>ASSET ID</Text>
                  <Text style={[styles.metaValue, { color: colors.text }]}>#{previewItem.id}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={[styles.metaLabel, { color: colors.textMuted }]}>AES VECTOR STATUS</Text>
                  <View style={styles.statusPill}>
                    <ShieldCheck size={14} color={colors.success} />
                    <Text style={[styles.statusPillText, { color: colors.success }]}>ENCRYPTED & INDEXED</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  style={[styles.deleteBtn, { backgroundColor: "rgba(239, 68, 68, 0.15)", borderColor: colors.error }]}
                  onPress={() => handleDelete(previewItem)}
                >
                  <Trash2 size={16} color={colors.error} />
                  <Text style={[styles.deleteBtnText, { color: colors.error }]}>DELETE ASSET</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerInfo: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  categoryScrollContainer: {
    paddingVertical: 8,
  },
  categoryList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  gridContainer: {
    padding: 16,
    paddingBottom: 36,
  },
  gridRow: {
    gap: 8,
    marginBottom: 8,
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  itemCategoryBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    right: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    alignItems: "center",
  },
  itemCategoryText: {
    fontSize: 8,
    fontWeight: "800",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  previewModalCard: {
    width: "100%",
    maxHeight: "85%",
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: "800",
    flex: 1,
    marginRight: 10,
  },
  modalPreviewImage: {
    width: "100%",
    height: 240,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  modalMetaBody: {
    padding: 16,
    gap: 10,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: "800",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "800",
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
});
