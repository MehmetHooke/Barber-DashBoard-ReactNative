import { colors } from "@/src/theme/colors";
import { useAppTheme } from "@/src/theme/ThemeProvider";
import { Stack } from "expo-router";
import React from "react";

export default function BookStackLayout() {
    const { effectiveTheme } = useAppTheme();
  const c = colors[effectiveTheme];
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleAlign: "center",

        // 🔥 tema uyumlu header
        headerStyle: {
          backgroundColor: c.screenBg,
        },

        headerTintColor: c.text, // başlık + back icon
        headerTitleStyle: {
          fontWeight: "700",
        },

        headerShadowVisible: false,

        // ekranın geri kalan arka planı
        contentStyle: {
          backgroundColor: c.screenBg,
        },
      }}
    >
      {/* /book */}
      <Stack.Screen
        name="index"
        options={{
          title: "Randevu Al",
        }}
      />

      {/* /book/barber-detail */}
      <Stack.Screen
        name="barber-detail"
        options={{
          title: "Berber Detayı",
        }}
      />

      {/* /book/select-service */}
      <Stack.Screen
        name="select-service"
        options={{
          title: "Hizmet Seç",
        }}
      />

      {/* /book/select-time */}
      <Stack.Screen
        name="select-time"
        options={{
          title: "Tarih & Saat",
        }}
      />

      {/* /book/confirm */}
      <Stack.Screen
        name="confirm"
        options={{
          title: "Onayla",
           // istersen modal gibi açılır
        }}
      />
    </Stack>
  );
}
