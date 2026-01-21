import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import Card from "@/src/components/Card";

import { colors } from "@/src/theme/colors";
import { useAppTheme } from "@/src/theme/ThemeProvider";

export default function AboutModal() {
  const { effectiveTheme } = useAppTheme();
  const c = colors[effectiveTheme];

  const slide = useRef(new Animated.Value(0)).current;
  const translateY = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0],
  });

  useEffect(() => {
    Animated.timing(slide, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, []);

  function close() {
    Animated.timing(slide, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => router.back());
  }

  // Placeholder değerler (istersen daha sonra dinamik yaparız)
  const appName = "Berber Randevu";
  const version = "1.0.0";

  return (
    <View style={styles.root}>
      <Pressable style={StyleSheet.absoluteFillObject} onPress={close} />

      <View style={styles.centerWrap} pointerEvents="box-none">
        <Animated.View style={{ transform: [{ translateY }] }}>
          <Card
            bg={c.surfaceBg}
            border={c.surfaceBorder}
            shadowColor={c.shadowColor}
          >
            <View className="p-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-bold" style={{ color: c.text }}>
                  Hakkında
                </Text>
                <Pressable onPress={close} className="p-2">
                  <Ionicons name="close" size={22} color={c.textMuted} />
                </Pressable>
              </View>

              <View className="mt-4">
                <Text className="text-xl font-bold" style={{ color: c.text }}>
                  {appName}
                </Text>
                <Text className="text-xs mt-1" style={{ color: c.textMuted }}>
                  Sürüm: {version}
                </Text>

                <Text className="text-sm mt-3" style={{ color: c.textMuted }}>
                  Bu uygulama ile berber randevularını hızlıca oluşturabilir,
                  geçmiş randevularını görüntüleyebilir ve profil bilgilerini
                  yönetebilirsin.
                </Text>
              </View>

              <View className="mt-4">
                <View
                  className="rounded-2xl border p-3"
                  style={{
                    borderColor: c.surfaceBorder,
                    backgroundColor: c.cardBg,
                  }}
                >
                  <Text className="font-semibold" style={{ color: c.text }}>
                    Yasal
                  </Text>
                  <Text className="text-xs mt-1" style={{ color: c.textMuted }}>
                    • Gizlilik Politikası{"\n"}• Kullanım Koşulları
                  </Text>

                  <View className="mt-3">
                    <Button
                      className="rounded-xl"
                      variant="outline"
                      style={{
                        backgroundColor: c.accentSoft,
                        borderColor: c.accentBorder,
                      }}
                      onPress={() => {
                        // İstersen expo-linking ile URL açarız:
                        // Linking.openURL("https://.../privacy");
                      }}
                    >
                      <Text className="font-semibold" style={{ color: c.text }}>
                        Gizlilik Politikasını Gör
                      </Text>
                    </Button>
                  </View>
                </View>
              </View>

              <View className="mt-4">
                <Button
                  className="rounded-xl"
                  variant="outline"
                  style={{ borderColor: c.surfaceBorder }}
                  onPress={close}
                >
                  <Text
                    className="font-semibold"
                    style={{ color: c.textMuted }}
                  >
                    Kapat
                  </Text>
                </Button>
              </View>
            </View>
          </Card>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  centerWrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
});
