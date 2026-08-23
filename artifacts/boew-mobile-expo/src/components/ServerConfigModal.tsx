import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Server, Wifi, Check, X, RefreshCw } from "lucide-react-native";
import { useTheme } from "../theme/theme-context";
import { DEFAULT_PRESETS, getStoredApiUrl, saveApiUrl } from "../services/api-config";
import { ApiService } from "../services/api-service";

interface ServerConfigModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ServerConfigModal: React.FC<ServerConfigModalProps> = ({ visible, onClose }) => {
  const { colors } = useTheme();
  const [url, setUrl] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latencyMs?: number; error?: string } | null>(null);

  useEffect(() => {
    if (visible) {
      getStoredApiUrl().then((saved) => {
        setUrl(saved);
        setTestResult(null);
      });
    }
  }, [visible]);

  const handleTest = async (testUrl?: string) => {
    const target = testUrl || url;
    setTesting(true);
    setTestResult(null);
    const res = await ApiService.testConnection(target);
    setTestResult(res);
    setTesting(false);
  };

  const handleSave = async () => {
    if (!url.trim()) return;
    await saveApiUrl(url.trim());
    onClose();
  };

  const handleSelectPreset = (presetUrl: string) => {
    setUrl(presetUrl);
    handleTest(presetUrl);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Modal Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.headerIcon, { backgroundColor: colors.primarySubtle }]}>
                <Server size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>Server Endpoint</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>Connect to backend API server</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Input URL */}
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>API BASE URL</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={url}
                onChangeText={(t) => {
                  setUrl(t);
                  setTestResult(null);
                }}
                placeholder="http://10.215.229.26:5000"
                placeholderTextColor={colors.textDim}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[styles.testBtn, { backgroundColor: colors.primarySubtle, borderColor: colors.border }]}
                onPress={() => handleTest()}
                disabled={testing}
              >
                {testing ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={[styles.testBtnText, { color: colors.primary }]}>TEST</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Test Result Alert */}
            {testResult && (
              <View
                style={[
                  styles.testResultBox,
                  {
                    backgroundColor: testResult.success ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                    borderColor: testResult.success ? colors.success : colors.error,
                  },
                ]}
              >
                {testResult.success ? (
                  <Check size={16} color={colors.success} />
                ) : (
                  <X size={16} color={colors.error} />
                )}
                <Text style={[styles.testResultText, { color: testResult.success ? colors.success : colors.error }]}>
                  {testResult.success
                    ? `Connected successfully (${testResult.latencyMs}ms)`
                    : `Connection failed: ${testResult.error || "Unreachable"}`}
                </Text>
              </View>
            )}

            {/* Presets */}
            <Text style={[styles.sectionLabel, { color: colors.textMuted, marginTop: 16 }]}>QUICK PRESETS</Text>
            <View style={styles.presetList}>
              {DEFAULT_PRESETS.map((p) => {
                const isSelected = url === p.url;
                return (
                  <TouchableOpacity
                    key={p.url}
                    style={[
                      styles.presetItem,
                      {
                        backgroundColor: isSelected ? colors.primarySubtle : colors.background,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => handleSelectPreset(p.url)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.presetContent}>
                      <Text style={[styles.presetName, { color: isSelected ? colors.primary : colors.text }]}>
                        {p.name}
                      </Text>
                      <Text style={[styles.presetUrl, { color: colors.textMuted }]}>{p.url}</Text>
                      <Text style={[styles.presetDesc, { color: colors.textDim }]}>{p.desc}</Text>
                    </View>
                    {isSelected && <Check size={16} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Footer Save Button */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave}>
              <Text style={[styles.saveBtnText, { color: colors.background }]}>SAVE & APPLY</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    padding: 16,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 46,
  },
  input: {
    flex: 1,
    fontSize: 13,
    fontFamily: "monospace",
  },
  testBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  testBtnText: {
    fontSize: 11,
    fontWeight: "800",
  },
  testResultBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
  },
  testResultText: {
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },
  presetList: {
    gap: 8,
  },
  presetItem: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  presetContent: {
    flex: 1,
    gap: 2,
  },
  presetName: {
    fontSize: 13,
    fontWeight: "700",
  },
  presetUrl: {
    fontSize: 11,
    fontFamily: "monospace",
  },
  presetDesc: {
    fontSize: 10,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  saveBtn: {
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
});
