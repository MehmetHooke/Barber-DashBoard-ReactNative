import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";

import { Text } from "@/components/ui/text";
import Card from "@/src/components/Card";
import { useAppTheme } from "@/src/theme/ThemeProvider";
import { colors } from "@/src/theme/colors";

import UserHeroCarousel, {
  type HeroSlide,
} from "@/src/components/UserHeroCarousel";
import { getUpcomingAppointmentForUser } from "@/src/services/appointmentService";
import {
  getActiveServices,
  type ServiceDoc,
} from "@/src/services/services.service";
import { AppointmentStatus } from "@/src/types/appointments";
import { getAuth } from "firebase/auth";

export default function UserHome() {
  const { effectiveTheme } = useAppTheme();
  const c = colors[effectiveTheme];

  const [services, setServices] = useState<ServiceDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [upcoming, setUpcoming] = useState<any | null>(null);
  const [upcomingLoading, setUpcomingLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  function formatDateTR(d: Date) {
    return d.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }
  function formatTimeTR(d: Date) {
    return d.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function StatusBadge({ status, c }: { status: AppointmentStatus; c: any }) {
    const label =
      status === "PENDING"
        ? "Berberden Onay Bekliyor"
        : status === "CONFIRMED"
          ? "Onaylandı"
          : status === "DONE"
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
              <Text
                className="text-base font-semibold"
                style={{ color: c.text }}
              >
                {item.serviceSnapshot?.name ?? "Hizmet"}
              </Text>
              <Text className="text-sm mt-1" style={{ color: c.textMuted }}>
                {item.barberSnapshot?.name ?? "Berber"}
              </Text>
            </View>

            <View className="items-end">
              <Text
                className="text-base font-semibold"
                style={{ color: c.text }}
              >
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

  const upcomingContent = useMemo(() => {
    if (upcomingLoading) {
      return (
        <Text className="text-sm mt-1" style={{ color: c.textMuted }}>
          Yükleniyor...
        </Text>
      );
    }

    if (!upcoming) {
      return (
        <Text className="text-sm mt-1" style={{ color: c.textMuted }}>
          Henüz randevun yok. Yukarıdan bir hizmet seçerek başlayabilirsin.
        </Text>
      );
    }

    return (
      <View className="mt-3">
        <AppointmentRow
          item={upcoming}
          c={c}
          onPress={() =>
            router.push({
              pathname: "/(user)/mybooks",
              params: { appointmentId: upcoming.id },
            })
          }
        />
      </View>
    );
  }, [upcoming, upcomingLoading, c]);

  async function fetchHome() {
    try {
      setLoading(true);
      setUpcomingLoading(true);

      const [data, up] = await Promise.all([
        getActiveServices("main"),
        (async () => {
          const uid = getAuth().currentUser?.uid;
          if (!uid) return null;
          return getUpcomingAppointmentForUser({ userId: uid });
        })(),
      ]);

      setServices(data);
      setUpcoming(up);
    } finally {
      setLoading(false);
      setUpcomingLoading(false);
    }
  }

  useEffect(() => {
    fetchHome();
  }, []);

  async function onRefresh() {
    try {
      setRefreshing(true);
      await fetchHome();
    } finally {
      setRefreshing(false);
    }
  }
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
          router.replace({
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
        {/* ✅ Slider burada: yaklaşan randevunun ÜSTÜ */}
        {loading ? (
          <View
            className="mt-4 items-center justify-center"
            style={{ height: 140 }}
          >
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
                  Yaklaşan Randevu
                </Text>
              </View>

              {/* ✅ burası önemli */}
              {upcomingContent}
            </View>
          </Card>
        </View>

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
