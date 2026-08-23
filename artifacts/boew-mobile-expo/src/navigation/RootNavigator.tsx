import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Terminal, Search, UploadCloud, Database, Clock } from "lucide-react-native";
import { useTheme } from "../theme/theme-context";
import { Header } from "../components/Header";
import { ServerConfigModal } from "../components/ServerConfigModal";
import { ThemeModal } from "../components/ThemeModal";

import { OverviewScreen } from "../screens/OverviewScreen";
import { QueryScreen } from "../screens/QueryScreen";
import { ResultsScreen } from "../screens/ResultsScreen";
import { UploadScreen } from "../screens/UploadScreen";
import { DatasetScreen } from "../screens/DatasetScreen";
import { HistoryScreen } from "../screens/HistoryScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function BottomTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDim,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "800",
          letterSpacing: 0.5,
        },
      }}
    >
      <Tab.Screen
        name="OverviewTab"
        component={OverviewScreen}
        options={{
          tabBarLabel: "OVERVIEW",
          tabBarIcon: ({ color, size }) => <Terminal size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="QueryTab"
        component={QueryScreen}
        options={{
          tabBarLabel: "QUERY",
          tabBarIcon: ({ color, size }) => <Search size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="UploadTab"
        component={UploadScreen}
        options={{
          tabBarLabel: "UPLOAD",
          tabBarIcon: ({ color, size }) => <UploadCloud size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="DatasetTab"
        component={DatasetScreen}
        options={{
          tabBarLabel: "DATASET",
          tabBarIcon: ({ color, size }) => <Database size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={HistoryScreen}
        options={{
          tabBarLabel: "LOGS",
          tabBarIcon: ({ color, size }) => <Clock size={size - 2} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { colors } = useTheme();
  const [serverModalVisible, setServerModalVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <Header
        onOpenServerModal={() => setServerModalVisible(true)}
        onOpenThemeModal={() => setThemeModalVisible(true)}
      />

      {/* Main Stack */}
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "fade",
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="MainTabs" component={BottomTabs} />
        <Stack.Screen name="ResultsScreen" component={ResultsScreen} />
      </Stack.Navigator>

      {/* Modals */}
      <ServerConfigModal visible={serverModalVisible} onClose={() => setServerModalVisible(false)} />
      <ThemeModal visible={themeModalVisible} onClose={() => setThemeModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
