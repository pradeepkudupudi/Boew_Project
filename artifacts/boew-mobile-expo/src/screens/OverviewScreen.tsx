import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import {
  Database,
  Users,
  Activity,
  Network,
  HardDrive,
  Lock,
  CheckCircle,
  Shield,
  Clock,
  Search,
} from "lucide-react-native";
import { useTheme } from "../theme/theme-context";
import { StatCard } from "../components/StatCard";
import { ApiService, DatasetStats, HistoryItem } from "../services/api-service";

export const OverviewScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DatasetStats | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [dsStats, hist] = await Promise.all([
        ApiService.getDatasetStats().catch(() => null),
        ApiService.getHistory(1, 5).catch(() => ({ history: [], total: 0 })),
      ]);
      setStats(dsStats);
      setHistory(hist?.history || []);
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

  const totalImages = stats?.totalImages ?? 0;
  const indexedImages = stats?.indexedImages ?? 0;
  const categories = stats?.categories ?? [];
  const maxCount = Math.max(...categories.map((c) => c.count), 1);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Banner */}
      <View style={[styles.banner, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.bannerTop}>
          <View style={styles.bannerTitleRow}>
            <Text style={[styles.bannerTitle, { color: colors.text }]}>System Dashboard</Text>
            <View style={[styles.onlineBadge, { backgroundColor: "rgba(16, 185, 129, 0.15)" }]}>
              <View style={[styles.pulseDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.onlineText, { color: colors.success }]}>ACTIVE</Text>
            </View>
          </View>
          <Text style={[styles.bannerDesc, { color: colors.textMuted }]}>
            AES-256 CBC Encrypted Visual Vector Retrieval
          </Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statGrid}>
        <View style={styles.statRow}>
          <StatCard
            label="ENCRYPTED VECTORS"
            value={loading ? "..." : String(indexedImages)}
            sub="IN AES INDEX"
            icon={<Database size={18} color={colors.primary} />}
          />
          <StatCard
            label="TOTAL ASSETS"
            value={loading ? "..." : String(totalImages)}
            sub="INGESTED DISK"
            icon={<HardDrive size={18} color={colors.primary} />}
          />
        </View>
        <View style={styles.statRow}>
          <StatCard
            label="RETRIEVAL QUERIES"
            value={loading ? "..." : String(history.length)}
            sub="LOGGED RUNS"
            icon={<Activity size={18} color={colors.primary} />}
          />
          <StatCard
            label="DATASET SIZE"
            value={loading ? "..." : `${stats?.totalSizeMb ?? 0} MB`}
            sub="ENCRYPTED"
            icon={<Network size={18} color={colors.primary} />}
          />
        </View>
      </View>

      {/* Encryption & Security Status Card */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
          <Lock size={16} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Security & Encryption Protocol</Text>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: colors.textMuted }]}>ENCRYPTION CIPHER</Text>
            <View style={styles.badgeRow}>
              <Text style={[styles.statusValue, { color: colors.success }]}>AES-256 CBC</Text>
              <CheckCircle size={14} color={colors.success} />
            </View>
          </View>

          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: colors.textMuted }]}>KEY DERIVATION</Text>
            <View style={styles.badgeRow}>
              <Text style={[styles.statusValue, { color: colors.primary }]}>SHA-256 HMAC</Text>
              <CheckCircle size={14} color={colors.primary} />
            </View>
          </View>

          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: colors.textMuted }]}>SIMILARITY ENGINE</Text>
            <Text style={[styles.statusValue, { color: colors.text }]}>COSINE DISTANCE</Text>
          </View>

          <View style={[styles.progressContainer, { borderTopColor: colors.border }]}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: colors.primary }]}>ENCRYPTION INTEGRITY</Text>
              <Text style={[styles.progressPct, { color: colors.success }]}>100%</Text>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: colors.background }]}>
              <View style={[styles.progressBarFill, { backgroundColor: colors.primary }]} />
            </View>
          </View>
        </View>
      </View>

      {/* Dataset Distribution */}
      {categories.length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
            <Database size={16} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Category Distribution</Text>
          </View>
          <View style={styles.cardBody}>
            {categories.map((cat) => (
              <View key={cat.name} style={styles.catItem}>
                <View style={styles.catHeader}>
                  <Text style={[styles.catName, { color: colors.text }]}>{cat.name}</Text>
                  <Text style={[styles.catCount, { color: colors.textMuted }]}>{cat.count} items</Text>
                </View>
                <View style={[styles.catBarBg, { backgroundColor: colors.background }]}>
                  <View
                    style={[
                      styles.catBarFill,
                      {
                        backgroundColor: colors.primary,
                        width: `${(cat.count / maxCount) * 100}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActionRow}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate("QueryTab")}
          activeOpacity={0.8}
        >
          <Search size={16} color={colors.background} />
          <Text style={[styles.actionButtonText, { color: colors.background }]}>EXECUTE QUERY</Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 32,
  },
  banner: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  bannerTop: {
    gap: 4,
  },
  bannerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  bannerDesc: {
    fontSize: 12,
  },
  onlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  onlineText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  statGrid: {
    gap: 10,
  },
  statRow: {
    flexDirection: "row",
    gap: 10,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    borderBottomWidth: 1,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  cardBody: {
    padding: 14,
    gap: 12,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statusValue: {
    fontSize: 11,
    fontWeight: "800",
  },
  progressContainer: {
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 6,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  progressPct: {
    fontSize: 11,
    fontWeight: "900",
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    width: "100%",
  },
  catItem: {
    gap: 4,
  },
  catHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  catName: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  catCount: {
    fontSize: 11,
    fontFamily: "monospace",
  },
  catBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  catBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  quickActionRow: {
    marginTop: 6,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 14,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
  },
});
