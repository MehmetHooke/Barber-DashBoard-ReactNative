import { colors } from "@/src/theme/colors";
import { useAppTheme } from "@/src/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TABS = [
  {
    name: "index",
    label: "Anasayfa",
    iconFocused: "home",
    icon: "home-outline",
    activePillBgDark: "rgba(124, 58, 237, 0.16)",
    activePillBgLight: "rgba(124, 58, 237, 0.14)",
    activeIconColor: "#7C3AED",
  },
  {
    name: "book",
    label: "Randevu Al",
    iconFocused: "calendar",
    icon: "calendar-outline",
    activePillBgDark: "rgba(245, 158, 11, 0.18)",
    activePillBgLight: "rgba(245, 158, 11, 0.16)",
    activeIconColor: "#F59E0B",
  },
  {
    name: "mybooks",
    label: "Randevular",
    iconFocused: "book",
    icon: "book-outline",
    activePillBgDark: "rgba(236, 72, 153, 0.16)",
    activePillBgLight: "rgba(236, 72, 153, 0.14)",
    activeIconColor: "#EC4899",
  },
  {
    name: "settings",
    label: "Ayarlar",
    iconFocused: "settings",
    icon: "settings-outline",
    activePillBgDark: "rgba(34, 211, 238, 0.16)",
    activePillBgLight: "rgba(34, 211, 238, 0.14)",
    activeIconColor: "#22D3EE",
  },
] as const;

function UserTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { effectiveTheme } = useAppTheme();
  const theme = effectiveTheme; // "dark" | "light"
  const c = colors[theme];

  const bottom = Math.max(insets.bottom, Platform.OS === "android" ? 10 : 0);

  return (
    <View
      style={{
        paddingBottom: bottom,
        paddingTop: 12,
        paddingHorizontal: 14,
        backgroundColor: c.tabWrapBg,
      }}
    >
      <View
        style={{
          height: 64,
          borderRadius: 18,
          backgroundColor: c.cardBg,
          borderWidth: 1,
          borderColor: c.cardBorder,
          paddingHorizontal: 8,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {TABS.map((t) => {
          const routeIndex = state.routes.findIndex(
            (r: any) => r.name === t.name,
          );
          const isFocused = state.index === routeIndex;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: state.routes[routeIndex].key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented)
              navigation.navigate(t.name);
          };

          const inactiveColor = c.inactiveIcon;
          const activePillBg =
            theme === "dark" ? t.activePillBgDark : t.activePillBgLight;

          return (
            <Pressable
              key={t.name}
              onPress={onPress}
              onLongPress={() =>
                navigation.emit({
                  type: "tabLongPress",
                  target: state.routes[routeIndex].key,
                })
              }
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 4,
              }}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={
                descriptors[state.routes[routeIndex].key]?.options
                  ?.tabBarAccessibilityLabel
              }
            >
              {isFocused ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    paddingHorizontal: 14,
                    height: 42,
                    borderRadius: 14,
                    backgroundColor: activePillBg,
                    borderWidth: 1,
                    borderColor: c.cardBorder,
                  }}
                >
                  <Ionicons
                    name={t.iconFocused as any}
                    size={20}
                    color={t.activeIconColor}
                  />
                  <Text
                    style={{
                      color: t.activeIconColor,
                      fontSize: 10,
                      fontWeight: "600",
                    }}
                    numberOfLines={1}
                  >
                    {t.label}
                  </Text>
                </View>
              ) : (
                <Ionicons
                  name={t.icon as any}
                  size={22}
                  color={inactiveColor}
                />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function UserTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <UserTabBar {...props} />}
      screenOptions={{ headerShown: false, tabBarStyle: { display: "none" } }}
    >
      <Tabs.Screen name="index" options={{ title: "Anasayfa" }} />
      <Tabs.Screen name="book" options={{ title: "Randevu Al" }} />
      <Tabs.Screen name="mybooks" options={{ title: "Randevular" }} />
      <Tabs.Screen name="settings" options={{ title: "Ayarlar" }} />
    </Tabs>
  );
}
