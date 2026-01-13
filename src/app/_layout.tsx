import { Stack } from "expo-router";
import "../../global.css";


import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '@/global.css';

export default function RootLayout() {
  return (
    
    
    <GluestackUIProvider mode="dark">
      <Stack initialRouteName="(auth)">

      <Stack.Screen name="(auth)" options={{ headerShown: false }} />

    </Stack>
    </GluestackUIProvider>
  
  );
}
