import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "../theme/ThemeProvider";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
      <GluestackUIProvider mode="dark">
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(user)" />
          <Stack.Screen name="(barber)" />
        </Stack>
      </GluestackUIProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
