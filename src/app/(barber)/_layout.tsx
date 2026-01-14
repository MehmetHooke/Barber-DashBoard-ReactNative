import { Ionicons } from "@expo/vector-icons";
import { Tabs } from 'expo-router';
import React from 'react';

import { useColorScheme } from '@/src/hooks/use-color-scheme';
import { Platform } from "react-native";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        // Renkler
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: "rgba(255,255,255,0.55)",

        // Tab bar görünüm
        tabBarStyle: {
          backgroundColor: "rgba(10,10,10,0.92)",
          borderTopWidth: 0,
          height: Platform.OS === "ios" ? 84 : 70,
          paddingTop: 10,
          paddingBottom: Platform.OS === "ios" ? 22 : 12,
        },

        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: 4,
        },

        // icon + label spacing
        tabBarItemStyle: {
          borderRadius: 16,
          marginHorizontal: 6,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Anasayfa",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={size ?? 24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="books"
        options={{
          title: "Randevu Al",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "book" : "book-outline"}
              size={size ?? 24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "stats-chart" : "stats-chart-outline"}
              size={size ?? 24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "settings" : "settings-outline"}
              size={size ?? 24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
