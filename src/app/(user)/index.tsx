import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { Text } from "@/components/ui/text";
import Card from "@/src/components/Card";
import { useAppTheme } from "@/src/theme/ThemeProvider";
import { colors } from "@/src/theme/colors";

import UserHeroCarousel, { type HeroSlide } from "@/src/components/UserHeroCarousel";
import { getActiveServices, type ServiceDoc } from "@/src/services/services.service";

export default function UserHome() {
  const { effectiveTheme } = useAppTheme();
  const c = colors[effectiveTheme];

  const [services, setServices] = useState<ServiceDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getActiveServices("main");
        setServices(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const slides: HeroSlide[] = useMemo(() => {
    return services
      .filter((s) => !!s.imageUrl)
      .map((s, i) => ({
        id: s.id,
        imageUrl: s.imageUrl!,
        title: s.name,
        subtitle: `${s.durationMin} dk • ${s.price} ₺`,
        badge: i === 0 ? "Popüler" : undefined,
        onPress: () =>
          router.push({
            pathname: "/(user)/book/barber-detail",
            params: { serviceId: s.id },
          }),
      }));
  }, [services]);

  return (
    <View className="flex-1 pt-10" style={{ backgroundColor: c.screenBg }}>
      <View className="px-4 pt-5 pb-2">
        <Text className="text-2xl font-bold" style={{ color: c.text }}>
          Anasayfa
        </Text>
        <Text className="mt-1" style={{ color: c.textMuted }}>
          Hızlıca hizmet seçip randevunu oluştur.
        </Text>
      </View>

      <View className="px-4 flex-1">
        {/* ✅ Slider burada: yaklaşan randevunun ÜSTÜ */}
        {loading ? (
          <View className="mt-4 items-center justify-center" style={{ height: 140 }}>
            <ActivityIndicator />
            <Text className="text-xs mt-2" style={{ color: c.textMuted }}>
              Hizmetler yükleniyor...
            </Text>
          </View>
        ) : slides.length ? (
          <View className="mt-4">
            <UserHeroCarousel slides={slides} height={240} />
          </View>
        ) : null}

        {/* Yaklaşan randevu */}
        <View className="mt-5">
          <Card bg={c.surfaceBg} border={c.surfaceBorder} shadowColor={c.shadowColor}>
            <View className="p-4">
              <Text className="text-base font-semibold" style={{ color: c.text }}>
                Yaklaşan Randevu
              </Text>
              <Text className="text-sm mt-1" style={{ color: c.textMuted }}>
                Henüz randevun yok. Yukarıdan bir hizmet seçerek başlayabilirsin.
              </Text>
            </View>
          </Card>
        </View>

        <View className="h-8" />
      </View>
    </View>
  );
}
