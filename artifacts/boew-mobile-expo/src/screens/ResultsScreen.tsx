import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { ArrowLeft, Clock, Award, ShieldCheck, Zap, Sparkles } from "lucide-react-native";
import { useTheme } from "../theme/theme-context";
import { RetrievalResponse } from "../services/api-service";
import { getStoredApiUrl, resolveImageUri } from "../services/api-config";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 44) / 2;

export const ResultsScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { colors } = useTheme();
  const { queryUri, data } = route.params as { queryUri: string; data: RetrievalResponse };
  const [serverUrl, setServerUrl] = useState("");

  useEffect(() => {
    getStoredApiUrl().then(setServerUrl);
  }, []);

  const results = data.results || [];
  const metrics = data.metrics || {
    mAP: 0,
    precision: 0,
    recall: 0,
    f1Score: 0,
    retrievalTimeMs: 0,
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Back button & Title */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={18} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTexts}>
          <Text style={[styles.title, { color: colors.text }]}>Retrieval Results</Text>
          <Text style={[styles.subtitle, { color: colors.primary }]}>
            {results.length} Matches Found // {data.retrievalTimeMs}ms
          </Text>
        </View>
      </View>

      {/* Query Image + Performance Metrics Banner */}
      <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Image source={{ uri: queryUri }} style={styles.queryThumbnail} resizeMode="cover" />
        <View style={styles.metricsColumn}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricItemLabel, { color: colors.textMuted }]}>MEAN AVG PRECISION</Text>
            <Text style={[styles.metricItemValue, { color: colors.success }]}>
              {metrics.mAP != null ? `${(metrics.mAP * 100).toFixed(1)}%` : "N/A"}
            </Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricItemLabel, { color: colors.textMuted }]}>PRECISION / RECALL</Text>
            <Text style={[styles.metricItemValue, { color: colors.primary }]}>
              {metrics.precision != null ? `${(metrics.precision * 100).toFixed(0)}%` : "0%"} /{" "}
              {metrics.recall != null ? `${(metrics.recall * 100).toFixed(0)}%` : "0%"}
            </Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricItemLabel, { color: colors.textMuted }]}>RESPONSE LATENCY</Text>
            <Text style={[styles.metricItemValue, { color: colors.accent }]}>
              {data.retrievalTimeMs}ms
            </Text>
          </View>
        </View>
      </View>

      {/* Results Header */}
      <View style={styles.resultsHeaderRow}>
        <Text style={[styles.sectionHeading, { color: colors.text }]}>RANKED VISUAL MATCHES</Text>
        <View style={[styles.secureBadge, { backgroundColor: "rgba(16, 185, 129, 0.12)" }]}>
          <ShieldCheck size={12} color={colors.success} />
          <Text style={[styles.secureText, { color: colors.success }]}>DECRYPTED COSINE</Text>
        </View>
      </View>

      {/* Results Grid */}
      {results.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No matching images found in dataset.</Text>
        </View>
      ) : (
        <View style={styles.resultsGrid}>
          {results.map((item) => {
            const imgUri = resolveImageUri(serverUrl, item.filename);
            const scorePct = Math.round(item.similarityScore * 100);

            return (
              <View
                key={item.imageId}
                style={[
                  styles.resultCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: item.rank === 1 ? colors.primary : colors.border,
                    width: CARD_WIDTH,
                  },
                ]}
              >
                {/* Image */}
                <View style={styles.imageBox}>
                  <Image source={{ uri: imgUri }} style={styles.resultImage} resizeMode="cover" />
                  {/* Rank Badge */}
                  <View
                    style={[
                      styles.rankBadge,
                      {
                        backgroundColor: item.rank === 1 ? colors.primary : "rgba(0,0,0,0.75)",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.rankText,
                        { color: item.rank === 1 ? colors.background : "#fff" },
                      ]}
                    >
                      #{item.rank}
                    </Text>
                  </View>
                </View>

                {/* Info */}
                <View style={styles.cardInfo}>
                  <View style={styles.scoreRow}>
                    <Text style={[styles.scoreLabel, { color: colors.textMuted }]}>SIMILARITY</Text>
                    <Text style={[styles.scoreValue, { color: colors.primary }]}>{scorePct}%</Text>
                  </View>

                  {/* Similarity Progress Bar */}
                  <View style={[styles.scoreBarBg, { backgroundColor: colors.background }]}>
                    <View
                      style={[
                        styles.scoreBarFill,
                        {
                          backgroundColor: colors.primary,
                          width: `${scorePct}%`,
                        },
                      ]}
                    />
                  </View>

                  {item.category && (
                    <Text style={[styles.categoryTag, { color: colors.textDim }]} numberOfLines={1}>
                      {item.category}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 36,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTexts: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: 2,
  },
  heroCard: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  queryThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  metricsColumn: {
    flex: 1,
    justifyContent: "space-around",
  },
  metricItem: {
    gap: 2,
  },
  metricItemLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  metricItemValue: {
    fontSize: 13,
    fontWeight: "900",
  },
  metricDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginVertical: 2,
  },
  resultsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
  secureBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  secureText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  resultsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  resultCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  imageBox: {
    height: 120,
    position: "relative",
  },
  resultImage: {
    width: "100%",
    height: "100%",
  },
  rankBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rankText: {
    fontSize: 10,
    fontWeight: "900",
  },
  cardInfo: {
    padding: 10,
    gap: 6,
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  scoreValue: {
    fontSize: 12,
    fontWeight: "900",
  },
  scoreBarBg: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  scoreBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  categoryTag: {
    fontSize: 10,
    fontFamily: "monospace",
    textTransform: "capitalize",
  },
  emptyCard: {
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
  },
});
