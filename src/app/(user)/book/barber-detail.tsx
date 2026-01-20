import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  View,
} from "react-native";

import { Text } from "@/components/ui/text";
import Card from "@/src/components/Card";
import { useAppTheme } from "@/src/theme/ThemeProvider";
import { colors } from "@/src/theme/colors";

import { useAppAlert } from "@/src/components/AppAlertProvider";
import {
  getActiveBarbers,
  type BarberDoc,
} from "@/src/services/barbers.service";
import {
  getActiveServices,
  type ServiceDoc,
} from "@/src/services/services.service";

function Chip({ c, text }: { c: any; text: string }) {
  return (
    <View
      className="px-3 py-1 rounded-full border"
      style={{ borderColor: c.surfaceBorder }}
    >
      <Text className="text-xs" style={{ color: c.textMuted }}>
        {text}
      </Text>
    </View>
  );
}

function BarberRow({
  c,
  barber,
  onPress,
}: {
  c: any;
  barber: BarberDoc;
  onPress: () => void;
}) {
  const initial = (barber.name?.trim()?.[0] ?? "B").toUpperCase();

  return (
    <Pressable onPress={onPress} className="mb-3">
      <Card
        bg={c.surfaceBg}
        border={c.surfaceBorder}
        shadowColor={c.shadowColor}
      >
        <View className="flex-row items-center p-4">
          {/* Avatar */}
          <View
            className="h-12 w-12 rounded-full overflow-hidden items-center justify-center mr-3 border"
            style={{
              borderColor: c.surfaceBorder,
              backgroundColor: "rgba(0,0,0,0.05)",
            }}
          >
            {barber.imageUrl ? (
              <Image
                source={{ uri: barber.imageUrl }}
                style={{ width: 48, height: 48 }}
                resizeMode="cover"
              />
            ) : (
              <Text className="text-sm font-bold" style={{ color: c.text }}>
                {initial}
              </Text>
            )}
          </View>

          {/* Info */}
          <View className="flex-1">
            <Text className="text-base font-semibold" style={{ color: c.text }}>
              {barber.name}
            </Text>
            <Text className="text-xs mt-1" style={{ color: c.textMuted }}>
              Berber
            </Text>
          </View>

          <Text className="text-sm font-semibold" style={{ color: c.accent }}>
            Seç
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

export default function BarberDetail() {
  const router = useRouter();
  const params = useLocalSearchParams<{ serviceId?: string }>();
  const serviceId =
    typeof params.serviceId === "string" ? params.serviceId : undefined;

  const { effectiveTheme } = useAppTheme();
  const c = colors[effectiveTheme];

  const [services, setServices] = useState<ServiceDoc[]>([]);
  const [barbers, setBarbers] = useState<BarberDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId),
    [services, serviceId],
  );

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // aynı anda çek
        const [svc, brb] = await Promise.all([
          getActiveServices("main"),
          getActiveBarbers("main"),
        ]);

        setServices(svc);
        setBarbers(brb);

        if (!serviceId) {
          Alert.alert("Eksik bilgi", "Hizmet seçimi bulunamadı.");
        }
      } catch (e: any) {
        const msg = String(e?.message || "");
        if (msg.includes("requires an index")) {
          Alert.alert(
            "Firestore Index",
            "Bu sorgu için index gerekli (Console).",
          );
        } else {
          Alert.alert("Hata", "Veriler yüklenemedi.");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [serviceId]);

  function SelectedSummary({ c, service }: { c: any; service?: ServiceDoc }) {
    if (!service) {
      return (
        <Card
          bg={c.surfaceBg}
          border={c.surfaceBorder}
          shadowColor={c.shadowColor}
        >
          <View className="p-4">
            <Text className="font-semibold" style={{ color: c.text }}>
              Hizmet seçimi bulunamadı
            </Text>
            <Text className="text-sm mt-1" style={{ color: c.textMuted }}>
              Lütfen bir önceki adıma dönüp hizmet seç.
            </Text>
          </View>
        </Card>
      );
    }

    return (
      <Card
        bg={c.surfaceBg}
        border={c.surfaceBorder}
        shadowColor={c.shadowColor}
      >
        <View className="p-4">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <Text
              className="text-xs font-semibold"
              style={{ color: c.textMuted }}
            >
              Seçtiklerin
            </Text>

            <Pressable onPress={resetService} hitSlop={8}>
              <Text
                className="text-sm font-semibold"
                style={{ color: c.accent }}
              >
                Değiştir
              </Text>
            </Pressable>
          </View>

          {/* Service name */}
          <Text className="text-lg font-bold mt-2" style={{ color: c.text }}>
            {service.name}
          </Text>

          {/* Description */}
          <Text
            className="text-sm mt-1"
            style={{ color: c.textMuted }}
            numberOfLines={2}
          >
            {service.description}
          </Text>

          {/* Chips */}
          <View className="flex-row gap-2 mt-3">
            <Chip c={c} text={`${service.durationMin} dk`} />
            <Chip c={c} text={`${service.price} ₺`} />
          </View>
        </View>
      </Card>
    );
  }
  const { confirm } = useAppAlert();
  function resetService() {
    confirm({
      title: "Hizmeti Değiştir",
      message: "Seçili hizmeti değiştirmek istiyor musun?",
      cancelText: "Vazgeç",
      confirmText: "Değiştir",
      onConfirm: () => {
        router.replace({ pathname: "/(user)/book/select-service", params: {} });
      },
    });
  }

  return (
    <View className="flex-1 pt-10" style={{ backgroundColor: c.screenBg }}>
      {/* Header */}
      <View className="px-4 pt-5 pb-2">
        <Text className="text-2xl font-bold" style={{ color: c.text }}>
          Berber Seç
        </Text>
        <Text className="text-sm mt-1" style={{ color: c.textMuted }}>
          Hizmet seçildi. Şimdi berberini seç.
        </Text>

        <View className="mt-4">
          <SelectedSummary c={c} service={selectedService} />
        </View>
      </View>

      {/* List */}
      <View className="flex-1 px-4 mt-3">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator />
            <Text className="mt-2" style={{ color: c.textMuted }}>
              Yükleniyor...
            </Text>
          </View>
        ) : barbers.length === 0 ? (
          <Card
            bg={c.surfaceBg}
            border={c.surfaceBorder}
            shadowColor={c.shadowColor}
          >
            <View className="p-4">
              <Text className="font-semibold" style={{ color: c.text }}>
                Aktif berber bulunamadı
              </Text>
            </View>
          </Card>
        ) : (
          <FlatList
            data={barbers}
            keyExtractor={(x) => x.id}
            renderItem={({ item }) => (
              <BarberRow
                c={c}
                barber={item}
                onPress={() => {
                  if (!serviceId) return;
                  router.push({
                    pathname: "/(user)/book/select-time",
                    params: { serviceId, barberId: item.id },
                  });
                }}
              />
            )}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        )}
      </View>
    </View>
  );
}
