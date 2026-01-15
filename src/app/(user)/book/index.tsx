import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { View } from "react-native";

import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

import Card from "@/src/components/Card";
import { useAppTheme } from "@/src/theme/ThemeProvider";
import { colors } from "@/src/theme/colors";

/**
 * / (user) / book
 *
 * Routing rules:
 * - serviceId + barberId -> /book/select-time
 * - only serviceId -> /book/barber-detail
 * - none -> show CTA -> /book/select-service
 */
export default function BookIndex() {

  const { effectiveTheme } = useAppTheme();
  const c = colors[effectiveTheme];
  const router = useRouter();
  const params = useLocalSearchParams<{
    serviceId?: string;
    barberId?: string;
  }>();

  const serviceId = typeof params.serviceId === "string" ? params.serviceId : undefined;
  const barberId = typeof params.barberId === "string" ? params.barberId : undefined;

  useEffect(() => {
    // Tekrarla akışı: direkt tarih/saat
    if (serviceId && barberId) {
      router.replace({
        pathname: "/(user)/book/select-time",
        params: { serviceId, barberId },
      });
      return;
    }

    // Slider akışı: hizmet seçili -> berber seç
    if (serviceId && !barberId) {
      router.replace({
        pathname: "/(user)/book/barber-detail",
        params: { serviceId },
      });
      return;
    }
  }, [serviceId, barberId, router]);

  // Eğer yönlendirme koşulu yoksa bu UI görünecek
 return (
    <View
      className="flex-1 px-4 pt-6"
      style={{ backgroundColor: c.screenBg }}
    >
      <VStack className="gap-4">
        {/* Header */}
        <VStack className="gap-1">
          <Text
            className="text-2xl font-bold"
            style={{ color: c.text }}
          >
            Randevu Al
          </Text>
          <Text
            className="text-sm"
            style={{ color: c.textMuted }}
          >
            Hizmet seç → Berber seç → Tarih & saat seç → Onayla
          </Text>
        </VStack>

        {/* Card */}
        <Card
          bg={c.surfaceBg}
          border={c.surfaceBorder}
          shadowColor={c.shadowColor}
        >
          <View className="p-4">
            <VStack className="gap-3">
              <Text
                className="text-base font-semibold"
                style={{ color: c.text }}
              >
                Başlayalım
              </Text>

              <Text
                className="text-sm"
                style={{ color: c.textMuted }}
              >
                Uygun bir hizmet seçerek randevu oluşturabilirsin.
                İstersen daha sonra berberi ve saati belirleyeceğiz.
              </Text>

              <Button
                variant="solid"
                className="rounded-xl"
                style={{
                  backgroundColor: c.accentSoft,
                  borderColor: c.accentBorder,
                }}
                onPress={() => router.push("/(user)/book/select-service")}
              >
                <ButtonText style={{ color: c.accent }}>
                  Hizmet Seç
                </ButtonText>
              </Button>
            </VStack>
          </View>
        </Card>
      </VStack>
    </View>
  );
}
