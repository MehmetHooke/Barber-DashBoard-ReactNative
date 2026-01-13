import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <GluestackUIProvider mode="dark">
      <Stack
        initialRouteName="login"
        screenOptions={{ headerShown: false }}
      />
    </GluestackUIProvider>
  );
}
