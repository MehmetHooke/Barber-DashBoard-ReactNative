import { Stack } from "expo-router";
import React from "react";

export default function BookStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleAlign: "center",
        headerShadowVisible: false,
        headerStyle: { backgroundColor: "#000" },
        headerTintColor: "#fff",
        contentStyle: { backgroundColor: "#000" },
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
          presentation: "modal", // istersen modal gibi açılır
        }}
      />
    </Stack>
  );
}
