import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Image,
} from "react-native";
import { format } from "date-fns";
import { Clock, CheckCircle, X, Search, ShieldCheck } from "lucide-react-native";
import { useTheme } from "../theme/theme-context";
import { ApiService, HistoryItem } from "../services/api-service";
import { getStoredApiUrl, resolveUploadImageUri, resolveImageUri } from "../services/api-config";

export const HistoryScreen: React.FC = () => {
  const { colors } = useTheme();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [serverUrl, setServerUrl] = useState("");
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [url, histData] = await Promise.all([
        getStoredApiUrl(),
        ApiService.getHistory(1, 50).catch(() => ({ history: [], total: 0 })),
      ]);
      setServerUrl(url);
      setHistory(histData?.history || []);
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

  const formatTs = (iso: string) => {
    try {
      return format(new Date(iso), "dd MMM yyyy, HH:mm:ss");
    } catch {
      return iso;
    }
  };

  const renderItem = ({ item }: { item: HistoryItem }) => {
    const queryImgUri = resolveUploadImageUri(serverUrl, item.queryImagePath);
    const scoreVal = item.mAP != null ? `${(item.mAP * 100).toFixed(1)}%` : "N/A";

    return (
      <TouchableOpacity
        style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => setSelectedItem(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardLeft}>
          <Image source={{ uri: queryImgUri }} style={styles.thumbImage} resizeMode="cover" />
          <View style={styles.cardTexts}>
            <View style={styles.queryIdRow}>
              <Text style={[styles.queryId, { color: colors.primary }]}>
                QUERY_#00{item.id}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: "rgba(16, 185, 129, 0.12)" }]}>
                <CheckCircle size={10} color={colors.success} />
                <Text style={[styles.statusText, { color: colors.success }]}>OK</Text>
              </View>
            </View>
            <Text style={[styles.timestamp, { color: colors.textMuted }]}>{formatTs(item.createdAt)}</Text>
            <Text style={[styles.metricSummary, { color: colors.textDim }]}>
              {item.metric.toUpperCase()} // Top-{item.topK} // {item.retrievalTimeMs}ms
            </Text>
          </View>
        </View>

        <View style={styles.cardRight}>
          <Text style={[styles.scoreLabel, { color: colors.textMuted }]}>mAP</Text>
          <Text style={[styles.scoreValue, { color: colors.success }]}>{scoreVal}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.headerInfo}>
        <Text style={[styles.title, { color: colors.text }]}>Query Logs</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Audit trail of visual vector retrieval operations
        </Text>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Clock size={40} color={colors.textDim} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Queries Executed Yet</Text>
          <Text style={[styles.emptySub, { color: colors.textMuted }]}>
            Run your first image retrieval from the Query tab.
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* History Detail Modal */}
      {selectedItem && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setSelectedItem(null)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <View>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Query #{selectedItem.id} Details</Text>
                  <Text style={[styles.modalSub, { color: colors.textMuted }]}>
                    {formatTs(selectedItem.createdAt)}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedItem(null)}>
                  <X size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                {/* Query Image */}
                <Image
                  source={{ uri: resolveUploadImageUri(serverUrl, selectedItem.queryImagePath) }}
                  style={styles.modalQueryImage}
                  resizeMode="cover"
                />

                {/* Metrics Breakdown */}
                <View style={[styles.metricsBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={styles.metricRow}>
                    <Text style={[styles.metaLabel, { color: colors.textMuted }]}>mAP SCORE</Text>
                    <Text style={[styles.metaVal, { color: colors.success }]}>
                      {selectedItem.mAP != null ? `${(selectedItem.mAP * 100).toFixed(2)}%` : "N/A"}
                    </Text>
                  </View>
                  <View style={styles.metricRow}>
                    <Text style={[styles.metaLabel, { color: colors.textMuted }]}>PRECISION / RECALL</Text>
                    <Text style={[styles.metaVal, { color: colors.primary }]}>
                      {selectedItem.precision != null ? `${(selectedItem.precision * 100).toFixed(0)}%` : "0%"} /{" "}
                      {selectedItem.recall != null ? `${(selectedItem.recall * 100).toFixed(0)}%` : "0%"}
                    </Text>
                  </View>
                  <View style={styles.metricRow}>
                    <Text style={[styles.metaLabel, { color: colors.textMuted }]}>LATENCY</Text>
                    <Text style={[styles.metaVal, { color: colors.accent }]}>
                      {selectedItem.retrievalTimeMs}ms
                    </Text>
                  </View>
                  <View style={styles.metricRow}>
                    <Text style={[styles.metaLabel, { color: colors.textMuted }]}>METRIC / TOP-K</Text>
                    <Text style={[styles.metaVal, { color: colors.text }]}>
                      {selectedItem.metric.toUpperCase()} / {selectedItem.topK}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  style={[styles.closeBtn, { backgroundColor: colors.primary }]}
                  onPress={() => setSelectedItem(null)}
                >
                  <Text style={[styles.closeBtnText, { color: colors.background }]}>CLOSE</Text>
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
  listContent: {
    padding: 16,
    gap: 10,
    paddingBottom: 36,
  },
  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  thumbImage: {
    width: 52,
    height: 52,
    borderRadius: 10,
  },
  cardTexts: {
    flex: 1,
    gap: 2,
  },
  queryIdRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  queryId: {
    fontSize: 12,
    fontWeight: "800",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 8,
    fontWeight: "800",
  },
  timestamp: {
    fontSize: 10,
  },
  metricSummary: {
    fontSize: 9,
    fontFamily: "monospace",
  },
  cardRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  scoreLabel: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  scoreValue: {
    fontSize: 15,
    fontWeight: "900",
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
  modalCard: {
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
    fontSize: 15,
    fontWeight: "800",
  },
  modalSub: {
    fontSize: 11,
    marginTop: 2,
  },
  modalBody: {
    padding: 16,
    gap: 12,
  },
  modalQueryImage: {
    width: "100%",
    height: 160,
    borderRadius: 12,
  },
  metricsBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  metaVal: {
    fontSize: 12,
    fontWeight: "800",
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
  closeBtn: {
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
});
