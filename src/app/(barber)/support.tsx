import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import Card from "@/src/components/Card";

import { colors } from "@/src/theme/colors";
import { useAppTheme } from "@/src/theme/ThemeProvider";

export default function SupportModal() {
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
              {/* Header */}
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-bold" style={{ color: c.text }}>
                  Destek
                </Text>
                <Pressable onPress={close} className="p-2">
                  <Ionicons name="close" size={22} color={c.textMuted} />
                </Pressable>
              </View>

              <Text className="text-sm mt-1" style={{ color: c.textMuted }}>
                Sorun mu yaşıyorsun? Bize ulaş veya hızlı çözümleri dene.
              </Text>

              {/* Quick help cards */}
              <View className="mt-4">
                <View
                  className="rounded-2xl border p-3"
                  style={{
                    borderColor: c.surfaceBorder,
                    backgroundColor: c.cardBg,
                  }}
                >
                  <Text className="font-semibold" style={{ color: c.text }}>
                    Sık sorulanlar
                  </Text>
                  <Text className="text-xs mt-1" style={{ color: c.textMuted }}>
                    • Randevu oluşturamıyorum
                    {"\n"}• Saat seçimi görünmüyor
                    {"\n"}• Profil bilgileri güncellenmiyor
                  </Text>
                </View>

                <View className="h-3" />

                <View
                  className="rounded-2xl border p-3"
                  style={{
                    borderColor: c.surfaceBorder,
                    backgroundColor: c.cardBg,
                  }}
                >
                  <Text className="font-semibold" style={{ color: c.text }}>
                    Bize ulaş
                  </Text>
                  <Text className="text-xs mt-1" style={{ color: c.textMuted }}>
                    E-posta: support@ornek.com{"\n"}
                    Çalışma saatleri: 10:00 - 20:00
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
                        // Şimdilik placeholder. İstersen expo-linking ile mailto açtırırız.
                        // Linking.openURL("mailto:support@ornek.com?subject=Destek");
                      }}
                    >
                      <Text className="font-semibold" style={{ color: c.text }}>
                        E-posta ile İletişime Geç
                      </Text>
                    </Button>
                  </View>
                </View>

                <View className="h-3" />

                <View
                  className="rounded-2xl border p-3"
                  style={{
                    borderColor: c.surfaceBorder,
                    backgroundColor: c.cardBg,
                  }}
                >
                  <Text className="font-semibold" style={{ color: c.text }}>
                    Hata bildirimi
                  </Text>
                  <Text className="text-xs mt-1" style={{ color: c.textMuted }}>
                    Lütfen hangi ekranda olduğunu ve mümkünse ekran görüntüsü
                    ekle.
                  </Text>

                  <View className="mt-3">
                    <Button
                      className="rounded-xl"
                      variant="outline"
                      style={{ borderColor: c.surfaceBorder }}
                      onPress={() => {
                        // İstersen burayı “Rapor Formu” ekranına yönlendirebiliriz.
                        // Şimdilik kapatıyoruz.
                        close();
                      }}
                    >
                      <Text
                        className="font-semibold"
                        style={{ color: c.textMuted }}
                      >
                        Tamam
                      </Text>
                    </Button>
                  </View>
                </View>
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
