import { Stack } from "expo-router";
import React from "react";

export default function UserLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="changePhone"
        options={{
          presentation: "transparentModal",
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      <Stack.Screen
        name="editProfile"
        options={{
          presentation: "transparentModal",
          contentStyle: { backgroundColor: "transparent" },
        }}
      />

      <Stack.Screen
        name="support"
        options={{
          presentation: "transparentModal",
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      <Stack.Screen
        name="about"
        options={{
          presentation: "transparentModal",
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
    </Stack>
  );
}
