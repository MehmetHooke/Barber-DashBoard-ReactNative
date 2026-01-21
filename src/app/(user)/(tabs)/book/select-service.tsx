import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, Pressable, View } from "react-native";

import { Text } from "@/components/ui/text";
import Card from "@/src/components/Card";
import { useAppTheme } from "@/src/theme/ThemeProvider";
import { colors } from "@/src/theme/colors";

import { getActiveServices, type ServiceDoc } from "@/src/services/services.service";

function ServiceRow({
  c,
  item,
  onPress,
}: {
  c: any;
  item: ServiceDoc;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="mb-3">
      <Card bg={c.surfaceBg} border={c.surfaceBorder} shadowColor={c.shadowColor}>
        <View className="flex-row p-3">
          <View
            className="w-20 h-20 rounded-2xl overflow-hidden border"
            style={{ borderColor: c.surfaceBorder, backgroundColor: "rgba(0,0,0,0.05)" }}
          >
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={{ width: 80, height: 80 }} resizeMode="cover" />
            ) : null}
          </View>

          <View className="flex-1 ml-3">
            <Text className="text-base font-bold" style={{ color: c.text }} numberOfLines={1}>
              {item.name}
            </Text>
            <Text className="text-xs mt-1" style={{ color: c.textMuted }} numberOfLines={2}>
              {item.description}
            </Text>

            <View className="flex-row gap-2 mt-2">
              <View
                className="px-3 py-1 rounded-full border"
                style={{ borderColor: c.surfaceBorder }}
              >
                <Text className="text-xs" style={{ color: c.textMuted }}>
                  {item.durationMin} dk
                </Text>
              </View>
              <View
                className="px-3 py-1 rounded-full border"
                style={{ borderColor: c.surfaceBorder }}
              >
                <Text className="text-xs" style={{ color: c.textMuted }}>
                  {item.price} ₺
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

export default function SelectService() {
  const router = useRouter();
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
      } catch (e: any) {
        console.log("getActiveServices error:", e);
        console.log("message:", e?.message);

        const msg = String(e?.message || "");
        if (msg.includes("requires an index")) {
          Alert.alert("Firestore Index", "Index gerekli. Terminaldeki linki kopyalayıp aç.");
        } else {
          Alert.alert("Hata", "Hizmetler yüklenemedi.");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <View className="flex-1 pt-10" style={{ backgroundColor: c.screenBg }}>
      {/* Header */}
      <View className="px-4 pt-5 pb-3">
        <Text className="text-2xl font-bold" style={{ color: c.text }}>
          Hizmet Seç
        </Text>
        <Text className="mt-1" style={{ color: c.textMuted }}>
          Devam etmek için bir hizmet seç.
        </Text>
      </View>

      <View className="px-4 flex-1">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator />
            <Text className="mt-2" style={{ color: c.textMuted }}>
              Yükleniyor...
            </Text>
          </View>
        ) : services.length === 0 ? (
          <Card bg={c.surfaceBg} border={c.surfaceBorder} shadowColor={c.shadowColor}>
            <View className="p-4">
              <Text className="font-semibold" style={{ color: c.text }}>
                Henüz hizmet yok
              </Text>
              <Text className="mt-1 text-sm" style={{ color: c.textMuted }}>
                Berber tarafında hizmet ekleyince burada görünecek.
              </Text>
            </View>
          </Card>
        ) : (
          <FlatList
            data={services}
            keyExtractor={(x) => x.id}
            renderItem={({ item }) => (
              <ServiceRow
                c={c}
                item={item}
                onPress={() =>
                  router.push({
                    pathname: "/(user)/book/barber-detail",
                    params: { serviceId: item.id },
                  })
                }
              />
            )}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        )}
      </View>
    </View>
  );
}
