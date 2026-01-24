// app/(barber)/home/index.tsx  (örnek path)
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import Card from "@/src/components/Card";
import { colors } from "@/src/theme/colors";
import { useAppTheme } from "@/src/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";

import {
  AppointmentItem,
  cancelAppointment,
  confirmAppointment,
  subscribeMyAppointments,
  subscribeMyPendingAppointments,
  subscribeMyTodayAppointments,
} from "@/src/services/berbersAppointment.service";
import Animated, { FadeIn, FadeOut, Layout } from "react-native-reanimated";

function toDate(ts: any): Date | null {
  try {
    if (!ts) return null;
    if (typeof ts?.toDate === "function") return ts.toDate();
    return new Date(ts);
  } catch {
    return null;
  }
}



export function CollapsibleBody({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  // Kapalıyken hiç render etme => ölçüm yok, overflow yok, halo yok
  if (!open) return null;

  return (
    <Animated.View
      // boyut değişimini native layout ile anim eder
      layout={Layout.duration(720)}
      // giriş/çıkış daha yumuşak
      entering={FadeIn.duration(360)}
      exiting={FadeOut.duration(360)}
      // Android'de flicker azaltır
      renderToHardwareTextureAndroid
    >
      {children}
    </Animated.View>
  );
}





function StatusPill({ status, c }: { status: string; c: any }) {
  const meta = useMemo(() => {
    if (status === "PENDING")
      return {
        text: "Bekliyor",
        icon: "time-outline" as const,
        bg: c.cardBg,
        border: c.surfaceBorder,
        color: c.textMuted,
      };

    if (status === "CONFIRMED")
      return {
        text: "Onaylandı",
        icon: "checkmark-circle-outline" as const,
        bg: "rgba(34,197,94,0.15)", // soft green
        border: "rgba(34,197,94,0.35)",
        color: "#22c55e",
      };

    return {
      text: "İptal",
      icon: "close-circle-outline" as const,
      bg: "rgba(239,68,68,0.15)", // soft red
      border: "rgba(239,68,68,0.35)",
      color: "#ef4444",
    };
  }, [status, c]);

  return (
    <View
      className="flex-row items-center gap-1 px-2 py-1 rounded-full border"
      style={{
        backgroundColor: meta.bg,
        borderColor: meta.border,
      }}
    >
      <Ionicons name={meta.icon} size={14} color={meta.color} />
      <Text className="text-xs font-semibold" style={{ color: meta.color }}>
        {meta.text}
      </Text>
    </View>
  );
}

function fmtDateTimeTR(d: Date | null) {
  if (!d) return "";
  const date = d.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
  });
  const time = d.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} • ${time}`;
}

function CollapsibleHeader({
  title,
  count,
  open,
  onToggle,
  c,
  subtitle,
}: {
  title: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  c: any;
  subtitle?: string;
}) {
  return (
    <Pressable onPress={onToggle}>
      <Card
        bg={c.surfaceBg}
        border={c.surfaceBorder}
        shadowColor={c.shadowColor}
      >
        <View className="p-4 flex-row items-center justify-between">
          <View className="flex-1 pr-2">
            <Text className="text-base font-bold" style={{ color: c.text }}>
              {title}
            </Text>
            {!!subtitle && (
              <Text className="text-xs mt-1" style={{ color: c.textMuted }}>
                {subtitle}
              </Text>
            )}
          </View>

          <View className="flex-row items-center gap-2">
            <View
              className="px-2 py-1 rounded-full border"
              style={{
                borderColor: c.surfaceBorder,
                backgroundColor: c.cardBg,
              }}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: c.textMuted }}
              >
                {count}
              </Text>
            </View>
            <Ionicons
              name={open ? "chevron-up" : "chevron-down"}
              size={18}
              color={c.textMuted}
            />
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

function AppointmentCard({
  item,
  c,
  busy,
  onConfirm,
  onCancel,
}: {
  item: AppointmentItem;
  c: any;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const serviceName = item.serviceSnapshot?.name ?? "Hizmet";
  const when = fmtDateTimeTR(toDate(item.startAt));
  const customer =
    `${item.userSnapshot?.name ?? ""} ${item.userSnapshot?.surname ?? ""}`.trim() ||
    "Müşteri";
  const isPending = item.status === "PENDING";

  return (
    <Card bg={c.surfaceBg} border={c.surfaceBorder} shadowColor={c.shadowColor}>
      <View className="p-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-2">
            <Text
              className="text-base font-bold"
              style={{ color: c.text }}
              numberOfLines={1}
            >
              {serviceName}
            </Text>
            <Text className="text-sm mt-1" style={{ color: c.textMuted }}>
              {when}
            </Text>
            <Text className="text-sm mt-1" style={{ color: c.text }}>
              {customer}
            </Text>
          </View>

          <StatusPill status={item.status} c={c} />
        </View>

        <View className="flex-row gap-2 mt-4">
          <Button
            onPress={onConfirm}
            isDisabled={!isPending || busy}
            className="flex-1 rounded-xl"
            style={{
              backgroundColor: c.accentSoft,
              borderColor: c.accentBorder,
            }}
            variant="outline"
          >
            <Text className="font-semibold" style={{ color: c.text }}>
              Onayla
            </Text>
          </Button>

          <Button
            onPress={onCancel}
            isDisabled={!isPending || busy}
            className="flex-1 rounded-xl"
            style={{ borderColor: c.surfaceBorder }}
            variant="outline"
          >
            <Text className="font-semibold" style={{ color: c.textMuted }}>
              İptal
            </Text>
          </Button>
        </View>
      </View>
    </Card>
  );
}

function StatTile({
  label,
  value,
  c,
}: {
  label: string;
  value: string;
  c: any;
}) {
  return (
    <View className="flex-1">
      <Card
        bg={c.surfaceBg}
        border={c.surfaceBorder}
        shadowColor={c.shadowColor}
      >
        <View className="p-3">
          <Text
            className="text-xs font-semibold"
            style={{ color: c.textMuted }}
          >
            {label}
          </Text>
          <Text className="text-lg font-bold mt-1" style={{ color: c.text }}>
            {value}
          </Text>
        </View>
      </Card>
    </View>
  );
}

export default function BarberHome() {
  const { effectiveTheme } = useAppTheme();
  const c = colors[effectiveTheme];

  const [loading, setLoading] = useState(true);

  const [pending, setPending] = useState<AppointmentItem[]>([]);
  const [all, setAll] = useState<AppointmentItem[]>([]);
  const [today, setToday] = useState<AppointmentItem[]>([]);

  const [openPending, setOpenPending] = useState(true);
  const [openAll, setOpenAll] = useState(false);

  const [busyId, setBusyId] = useState<string | null>(null);

  // Realtime subscriptions
  useEffect(() => {
    setLoading(true);

    const unsub1 = subscribeMyPendingAppointments(
      (items) => setPending(items),
      { pageSize: 30 },
    );
    const unsub2 = subscribeMyAppointments((items) => setAll(items), {
      pageSize: 80,
    });
    const unsub3 = subscribeMyTodayAppointments((items) => setToday(items), {
      pageSize: 80,
    });

    // İlk snapshot gelince loading false yapmak için basit yaklaşım:
    // Burada “ilk setState” anını yakalamak için flag kullanıyoruz.
    let t = setTimeout(() => setLoading(false), 400);

    return () => {
      clearTimeout(t);
      unsub1();
      unsub2();
      unsub3();
    };
  }, []);

  async function onConfirm(id: string) {
    try {
      setBusyId(id);
      await confirmAppointment(id);
      // realtime zaten güncelleyecek. ekstra local manipülasyona gerek yok.
    } finally {
      setBusyId(null);
    }
  }

  async function onCancel(id: string) {
    try {
      setBusyId(id);
      await cancelAppointment(id);
    } finally {
      setBusyId(null);
    }
  }

  // Gün özeti hesapları (client-side)
  const summary = useMemo(() => {
    const now = new Date();

    const notCanceled = today.filter((a) => a.status !== "CANCELED");

    const done = notCanceled.filter((a) => {
      const d = toDate(a.startAt);
      if (!d) return false;
      // "yapıldı" için en mantıklı: CONFIRMED ve startAt geçmişte
      return a.status === "CONFIRMED" && d.getTime() < now.getTime();
    });

    const remaining = notCanceled.filter((a) => {
      const d = toDate(a.startAt);
      if (!d) return false;
      // kalan: şimdi ve sonrası, pending/confirmed olabilir ama iptal değil
      return d.getTime() >= now.getTime();
    });

    const next = remaining
      .slice()
      .sort(
        (x, y) =>
          (toDate(x.startAt)?.getTime() ?? 0) -
          (toDate(y.startAt)?.getTime() ?? 0),
      )[0];

    return {
      doneCount: done.length,
      remainingCount: remaining.length,
      pendingCount: pending.length,
      next,
    };
  }, [today, pending]);

  return (
    <View style={{ flex: 1, backgroundColor: c.screenBg }}>
      <View className="px-4 pt-10 pb-3">
        <Text className="text-2xl pt-10 font-bold" style={{ color: c.text }}>
          Bugün
        </Text>
        <Text className="text-sm mt-1" style={{ color: c.textMuted }}>
          Randevularını hızlıca yönet.
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
          <Text className="mt-2" style={{ color: c.textMuted }}>
            Yükleniyor...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="px-4" style={{ gap: 14 }}>
            {/* Günün özeti tiles */}
            <View className="flex-row" style={{ gap: 12 }}>
              <StatTile
                label="Bugün yapıldı"
                value={`${summary.doneCount}`}
                c={c}
              />
              <StatTile
                label="Kalan"
                value={`${summary.remainingCount}`}
                c={c}
              />
            </View>
            <View className="flex-row" style={{ gap: 10 }}>
              <StatTile
                label="Onay bekleyen"
                value={`${summary.pendingCount}`}
                c={c}
              />
              <StatTile
                label="Toplam (bugün)"
                value={`${today.length}`}
                c={c}
              />
            </View>

            {/* Sıradaki randevu */}
            <Card
              bg={c.surfaceBg}
              border={c.surfaceBorder}
              shadowColor={c.shadowColor}
            >
              <View className="p-4">
                <View className="flex-row items-center justify-between">
                  <Text
                    className="text-base font-bold"
                    style={{ color: c.text }}
                  >
                    Sıradaki Randevu
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color={c.textMuted}
                  />
                </View>

                {summary.next ? (
                  <View className="mt-2">
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: c.text }}
                    >
                      {summary.next.serviceSnapshot?.name ?? "Hizmet"}
                    </Text>
                    <Text
                      className="text-sm mt-1"
                      style={{ color: c.textMuted }}
                    >
                      {fmtDateTimeTR(toDate(summary.next.startAt))}
                    </Text>
                    <Text className="text-sm mt-1" style={{ color: c.text }}>
                      {`${summary.next.userSnapshot?.name ?? ""} ${summary.next.userSnapshot?.surname ?? ""}`.trim() ||
                        "Müşteri"}
                    </Text>
                  </View>
                ) : (
                  <Text className="text-sm mt-2" style={{ color: c.textMuted }}>
                    Bugün sıradaki randevu yok.
                  </Text>
                )}
              </View>
            </Card>

            {/* Collapsible: Onay Bekleyen */}
            <CollapsibleHeader
              title="Onay Bekleyenler"
              subtitle="Yeni gelen randevular burada görünür"
              count={pending.length}
              open={openPending}
              onToggle={() => setOpenPending((v) => !v)}
              c={c}
            />

            <CollapsibleBody open={openPending}>
              <View style={{ gap: 12, paddingHorizontal: 8, paddingBottom: 12 }}>
                {pending.length === 0 ? (
                  <Card bg={c.surfaceBg} border={c.surfaceBorder} shadowColor={c.shadowColor}>
                    <View className="p-4 flex-row items-center">
                      <Ionicons name="checkmark-done-outline" size={18} color={c.textMuted} />
                      <Text className="ml-2" style={{ color: c.textMuted }}>
                        Onay bekleyen randevu yok.
                      </Text>
                    </View>
                  </Card>
                ) : (

                  <View style={{ gap: 12 }}>
                    {pending.map(item => (
                      <View key={item.id} style={{ padding: 3 }}>
                        <AppointmentCard
                          key={item.id}
                          item={item}
                          c={c}
                          busy={busyId === item.id}
                          onConfirm={() => onConfirm(item.id)}
                          onCancel={() => onCancel(item.id)}
                        />
                      </View>
                    ))}
                  </View>

                )}
              </View>
            </CollapsibleBody>


            {/* Collapsible: Tüm randevular */}
            <CollapsibleHeader
              title="Randevular"
              subtitle="Burada tüm randevularını görebilirsin."
              count={all.length}
              open={openAll}
              onToggle={() => setOpenAll((v) => !v)}
              c={c}
            />

            <CollapsibleBody open={openAll}>
              <View style={{ gap: 18, paddingBottom: 4, paddingHorizontal: 8 }}>
                {all.length === 0 ? (
                  <Card bg={c.surfaceBg} border={c.surfaceBorder} shadowColor={c.shadowColor}>
                    <View className="p-4">
                      <Text style={{ color: c.textMuted }}>Henüz randevu yok.</Text>
                    </View>
                  </Card>
                ) : (
                    all.map((item) => (
                      <AppointmentCard
                        key={item.id}
                        item={item}
                        c={c}
                        busy={busyId === item.id}
                        onConfirm={() => onConfirm(item.id)}
                        onCancel={() => onCancel(item.id)}
                      />
                    ))

                )}
              </View>
            </CollapsibleBody>

          </View>
        </ScrollView>
      )}
    </View>
  );
}
