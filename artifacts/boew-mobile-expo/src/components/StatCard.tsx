import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../theme/theme-context";

interface StatCardProps {
  label: string;
  value: string | number;
  sub: string;
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, sub, icon }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
      </View>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.sub, { color: colors.primary }]}>{sub}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
    flex: 1,
    minWidth: 140,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  iconContainer: {
    opacity: 0.8,
  },
  value: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginVertical: 2,
  },
  sub: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
});
