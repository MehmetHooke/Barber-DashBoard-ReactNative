import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";

import { Text } from "@/components/ui/text";
import Card from "@/src/components/Card";
import { useAppTheme } from "@/src/theme/ThemeProvider";
import { colors } from "@/src/theme/colors";

import {
  getPastAppointmentsForUser,
  getUpcomingAppointmentForUser,
} from "@/src/services/appointmentService";
import { getAuth } from "firebase/auth";

type AppointmentStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

type AppointmentItem = {
  id: string;
  shopId: string;
  userId: string;
  barberId: string;
  serviceId: string;
  serviceSnapshot: {
    name: string;
    durationMin: number;
    price: number;
    imageUrl?: string;
  };
  barberSnapshot: { name: string; imageUrl?: string };
  startAt: Date;
  endAt: Date;
  status: AppointmentStatus;
};

function formatDateTR(d: Date) {
  return d.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
function formatTimeTR(d: Date) {
  return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

function StatusBadge({ status, c }: { status: AppointmentStatus; c: any }) {
  const label =
    status === "PENDING"
      ? "Berberden Onay Bekliyor"
      : status === "CONFIRMED"
        ? "Onaylandı"
        : status === "COMPLETED"
          ? "Tamamlandı"
          : "İptal";

  // basit ve tema uyumlu: border+text muted
  return (
    <View
      className="px-3 py-1 rounded-full border"
      style={{ borderColor: c.surfaceBorder, backgroundColor: c.screenBg }}
    >
      <Text className="text-xs" style={{ color: c.textMuted }}>
        {label}
      </Text>
    </View>
  );
}

function AppointmentRow({
  item,
  c,
  onPress,
}: {
  item: AppointmentItem;
  c: any;
  onPress?: () => void;
}) {
  return (
    <Pressable
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: c.surfaceBorder, backgroundColor: c.screenBg }}
      onPress={onPress}
    >
      <View className="p-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-base font-semibold" style={{ color: c.text }}>
              {item.serviceSnapshot?.name ?? "Hizmet"}
            </Text>
            <Text className="text-sm mt-1" style={{ color: c.textMuted }}>
              {item.barberSnapshot?.name ?? "Berber"}
            </Text>
          </View>

          <View className="items-end">
            <Text className="text-base font-semibold" style={{ color: c.text }}>
              {item.serviceSnapshot?.price ?? 0} ₺
            </Text>
            <View className="mt-2">
              <StatusBadge status={item.status} c={c} />
            </View>
          </View>
        </View>

        <View className="mt-3 flex-row items-center justify-between">
          <Text className="text-sm" style={{ color: c.textMuted }}>
            {formatDateTR(item.startAt)} • {formatTimeTR(item.startAt)}
          </Text>
          <Text className="text-sm" style={{ color: c.textMuted }}>
            {item.serviceSnapshot?.durationMin ?? 0} dk
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function MyAppointmentsScreen() {
  const { effectiveTheme } = useAppTheme();
  const c = colors[effectiveTheme];

  // TODO: userId’yi auth context’inden al
  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [upcoming, setUpcoming] = useState<AppointmentItem | null>(null);
  const [past, setPast] = useState<AppointmentItem[]>([]);

  const [pastOpen, setPastOpen] = useState(false);

  async function load() {
    try {
      setLoading(true);
      if (!userId) return;
      const [up, pa] = await Promise.all([
        getUpcomingAppointmentForUser({ userId }),
        getPastAppointmentsForUser({ userId, limitCount: 50 }),
      ]);
      setUpcoming(up as any);
      setPast(pa as any);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    try {
      setRefreshing(true);
      if (!userId) return;
      const [up, pa] = await Promise.all([
        getUpcomingAppointmentForUser({ userId }),
        getPastAppointmentsForUser({ userId, limitCount: 50 }),
      ]);
      setUpcoming(up as any);
      setPast(pa as any);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!userId) return;
    load();
  }, []);

  const pastCount = past.length;

  // Yaklaşan randevu null ise empty state göster
  const upcomingContent = useMemo(() => {
    if (!upcoming) {
      return (
        <View
          className="mt-2 rounded-2xl border p-4"
          style={{ borderColor: c.surfaceBorder }}
        >
          <Text className="text-sm" style={{ color: c.textMuted }}>
            Henüz yaklaşan randevun yok. Hizmet seçerek hemen oluşturabilirsin.
          </Text>

          <Pressable
            className="mt-3 self-start rounded-xl px-4 py-2 border"
            style={{
              borderColor: c.surfaceBorder,
              backgroundColor: c.screenBg,
            }}
            onPress={() => router.push("/(user)")} // senin akışına göre: hizmet seçme sayfası
          >
            <Text className="text-sm font-semibold" style={{ color: c.text }}>
              Randevu Oluştur
            </Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View className="mt-3">
        <AppointmentRow item={upcoming} c={c} />
      </View>
    );
  }, [upcoming, c]);

  return (
    <View className="flex-1 pt-10" style={{ backgroundColor: c.screenBg }}>
      {/* Header */}
      <View className="px-4 pt-5 pb-2">
        <Text className="text-2xl font-bold" style={{ color: c.text }}>
          Randevularım
        </Text>
        <Text className="mt-1" style={{ color: c.textMuted }}>
          Yaklaşan ve geçmiş randevularını buradan yönet.
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={c.textMuted}
          />
        }
      >
        {loading ? (
          <View className="mt-8 items-center justify-center">
            <ActivityIndicator />
            <Text className="text-xs mt-2" style={{ color: c.textMuted }}>
              Randevular yükleniyor...
            </Text>
          </View>
        ) : (
          <View className="mt-4">
            {/* Yaklaşan (ÜSTTE) */}
            <Card
              bg={c.surfaceBg}
              border={c.surfaceBorder}
              shadowColor={c.shadowColor}
            >
              <View className="p-4">
                <View className="flex-row items-center justify-between">
                  <Text
                    className="text-base font-semibold"
                    style={{ color: c.text }}
                  >
                    Yaklaşan Randevular
                  </Text>
                </View>
                {upcomingContent}
              </View>
            </Card>

            {/* Geçmiş (Accordion) */}
            <View className="mt-4">
              <Card
                bg={c.surfaceBg}
                border={c.surfaceBorder}
                shadowColor={c.shadowColor}
              >
                <View className="p-4">
                  <Pressable
                    onPress={() => setPastOpen((s) => !s)}
                    className="active:opacity-80"
                  >
                    <View className="flex-row items-center justify-between">
                      <View>
                        <Text
                          className="text-base font-semibold"
                          style={{ color: c.text }}
                        >
                          Geçmiş Randevularım
                        </Text>
                        <Text
                          className="text-sm mt-1"
                          style={{ color: c.textMuted }}
                        >
                          Toplam {pastCount} kayıt
                        </Text>
                      </View>

                      <Text className="text-sm" style={{ color: c.textMuted }}>
                        {pastOpen ? "Kapat ▼" : "Aç ▲"}
                      </Text>
                    </View>
                  </Pressable>

                  {pastOpen ? (
                    <View className="mt-4">
                      {pastCount === 0 ? (
                        <View
                          className="rounded-2xl border p-4"
                          style={{ borderColor: c.surfaceBorder }}
                        >
                          <Text
                            className="text-sm"
                            style={{ color: c.textMuted }}
                          >
                            Henüz geçmiş randevun yok.
                          </Text>
                        </View>
                      ) : (
                        <FlatList
                          data={past}
                          keyExtractor={(x) => x.id}
                          ItemSeparatorComponent={() => (
                            <View className="h-3" />
                          )}
                          renderItem={({ item }) => (
                            <AppointmentRow item={item} c={c} />
                          )}
                          scrollEnabled={false}
                          refreshing={refreshing}
                          onRefresh={onRefresh}
                        />
                      )}
                    </View>
                  ) : (
                    <View
                      className="mt-3 rounded-2xl border p-4"
                      style={{ borderColor: c.surfaceBorder }}
                    >
                      <Text className="text-sm" style={{ color: c.textMuted }}>
                        Geçmiş randevularını görmek için aç.
                      </Text>
                    </View>
                  )}
                </View>
              </Card>
            </View>

            <View className="h-8" />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
