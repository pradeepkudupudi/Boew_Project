import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Terminal, Wifi, Palette, Server } from "lucide-react-native";
import { useTheme } from "../theme/theme-context";
import { ApiService } from "../services/api-service";

interface HeaderProps {
  onOpenServerModal: () => void;
  onOpenThemeModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenServerModal, onOpenThemeModal }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    ApiService.testConnection().then((res) => {
      if (mounted) setOnline(res.success);
    });
    const interval = setInterval(() => {
      ApiService.testConnection().then((res) => {
        if (mounted) setOnline(res.success);
      });
    }, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 12) + 4,
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={styles.left}>
        <View style={[styles.iconBox, { backgroundColor: colors.primarySubtle, borderColor: colors.border }]}>
          <Terminal size={18} color={colors.primary} />
        </View>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>BOEW</Text>
          <Text style={[styles.subTitle, { color: colors.primary }]}>ENCRYPTED SEARCH</Text>
        </View>
      </View>

      <View style={styles.right}>
        {/* Server Status Pill */}
        <TouchableOpacity
          style={[
            styles.statusPill,
            {
              backgroundColor: online ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
              borderColor: online ? colors.success : colors.error,
            },
          ]}
          onPress={onOpenServerModal}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: online === null ? colors.warning : online ? colors.success : colors.error },
            ]}
          />
          <Text style={[styles.statusText, { color: online ? colors.success : colors.error }]}>
            {online === null ? "CHECKING" : online ? "ONLINE" : "OFFLINE"}
          </Text>
        </TouchableOpacity>

        {/* Theme button */}
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}
          onPress={onOpenThemeModal}
          activeOpacity={0.7}
        >
          <Palette size={16} color={colors.primary} />
        </TouchableOpacity>

        {/* Server config button */}
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}
          onPress={onOpenServerModal}
          activeOpacity={0.7}
        >
          <Server size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  subTitle: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
