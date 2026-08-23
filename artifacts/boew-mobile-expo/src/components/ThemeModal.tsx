import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Palette, Check, X, Sparkles } from "lucide-react-native";
import { THEMES, ThemeId, useTheme } from "../theme/theme-context";

interface ThemeModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({ visible, onClose }) => {
  const { colors, themeId, setThemeId } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.headerIcon, { backgroundColor: colors.primarySubtle }]}>
                <Palette size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>Appearance & Theme</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>Select your visual cyberpunk palette</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Theme List */}
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <View style={styles.themeList}>
              {Object.values(THEMES).map((t) => {
                const isSelected = themeId === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.themeCard,
                      {
                        backgroundColor: isSelected ? colors.primarySubtle : colors.background,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setThemeId(t.id as ThemeId)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.themeCardTop}>
                      {/* Color Preview Swatches */}
                      <View style={styles.swatchRow}>
                        <View style={[styles.swatch, { backgroundColor: t.colors.background }]} />
                        <View style={[styles.swatch, { backgroundColor: t.colors.primary }]} />
                        <View style={[styles.swatch, { backgroundColor: t.colors.accent }]} />
                      </View>
                      <Text style={[styles.themeName, { color: isSelected ? colors.primary : colors.text }]}>
                        {t.name}
                      </Text>
                      {isSelected && (
                        <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                          <Check size={12} color={colors.background} />
                        </View>
                      )}
                    </View>
                    <Text style={[styles.themeDesc, { color: colors.textMuted }]}>{t.description}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity style={[styles.doneBtn, { backgroundColor: colors.primary }]} onPress={onClose}>
              <Text style={[styles.doneBtnText, { color: colors.background }]}>DONE</Text>
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
    maxHeight: "80%",
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
  themeList: {
    gap: 10,
  },
  themeCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  themeCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  swatchRow: {
    flexDirection: "row",
    gap: 4,
  },
  swatch: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  themeName: {
    fontSize: 14,
    fontWeight: "800",
    flex: 1,
    marginLeft: 10,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  themeDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  doneBtn: {
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  doneBtnText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
});
