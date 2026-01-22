import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import Card from "@/src/components/Card";
import { useAppTheme } from "@/src/theme/ThemeProvider";
import { colors } from "@/src/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";

import {
  AppointmentDoc,
  cancelAppointment,
  confirmAppointment,
  listMyAppointments,
} from "@/src/services/berbersAppointment.service";

type Item = { id: string } & AppointmentDoc;

function toDate(ts: any): Date | null {
  try {
    // Firestore Timestamp: ts.toDate()
    if (!ts) return null;
    if (typeof ts?.toDate === "function") return ts.toDate();
    // bazen plain date gelirse
    return new Date(ts);
  } catch {
    return null;
  }
}

function fmtDateTimeTR(d: Date | null) {
  if (!d) return "";
  const date = d.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} • ${time}`;
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

function AppointmentCard({
  item,
  c,
  onConfirm,
  onCancel,
  busy,
}: {
  item: Item;
  c: any;
  onConfirm: () => void;
  onCancel: () => void;
  busy: boolean;
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

        {/* Actions */}
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

export default function BarberHome() {
  const { effectiveTheme } = useAppTheme();
  const c = colors[effectiveTheme];

  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<Item[]>([]);
  const [all, setAll] = useState<Item[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [p, a] = await Promise.all([
        listMyAppointments({ status: "PENDING", pageSize: 20 }),
        listMyAppointments({ pageSize: 50 }),
      ]);
      setPending(p as any);
      setAll(a as any);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onConfirm(id: string) {
    try {
      setBusyId(id);
      await confirmAppointment(id);

      // hızlı UI güncelle (optimistic)
      setPending((x) => x.filter((i) => i.id !== id));
      setAll((x) =>
        x.map((i) => (i.id === id ? { ...i, status: "CONFIRMED" } : i)),
      );
    } finally {
      setBusyId(null);
    }
  }

  async function onCancel(id: string) {
    try {
      setBusyId(id);
      await cancelAppointment(id);

      setPending((x) => x.filter((i) => i.id !== id));
      setAll((x) =>
        x.map((i) => (i.id === id ? { ...i, status: "CANCELED" } : i)),
      );
    } finally {
      setBusyId(null);
    }
  }

  const data = useMemo(() => {
    // pending en üstte ayrı section gibi davranacağız: FlatList header kullan
    return all;
  }, [all]);

  return (
    <View style={{ flex: 1, backgroundColor: c.screenBg }}>
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
          <Text className="mt-2" style={{ color: c.textMuted }}>
            Randevular yükleniyor...
          </Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          data={data}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshing={loading}
          onRefresh={load}
          ListHeaderComponent={
            <View>
              {/* ÜST BLOK: PENDING */}
              <View className="flex-row mt-10 px-4 pt-5 pb-2 items-center justify-between mb-3">
                <Text className="text-2xl font-bold" style={{ color: c.text }}>
                  Onay Bekleyenler
                </Text>

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
                    {pending.length}
                  </Text>
                </View>
              </View>

              {pending.length === 0 ? (
                <Card
                  bg={c.surfaceBg}
                  border={c.surfaceBorder}
                  shadowColor={c.shadowColor}
                >
                  <View className="p-4 flex-row items-center">
                    <Ionicons
                      name="checkmark-done-outline"
                      size={18}
                      color={c.textMuted}
                    />
                    <Text className="ml-2" style={{ color: c.textMuted }}>
                      Onay bekleyen randevu yok.
                    </Text>
                  </View>
                </Card>
              ) : (
                <View style={{ gap: 12 }}>
                  {pending.map((item) => (
                    <AppointmentCard
                      key={item.id}
                      item={item}
                      c={c}
                      busy={busyId === item.id}
                      onConfirm={() => onConfirm(item.id)}
                      onCancel={() => onCancel(item.id)}
                    />
                  ))}
                </View>
              )}

              {/* ALT BAŞLIK */}
              <View className="mt-6 mb-3 flex-row items-center justify-between">
                <Text className="text-2xl font-bold" style={{ color: c.text }}>
                  Tüm Randevular
                </Text>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <AppointmentCard
              item={item}
              c={c}
              busy={busyId === item.id}
              onConfirm={() => onConfirm(item.id)}
              onCancel={() => onCancel(item.id)}
            />
          )}
        />
      )}
    </View>
  );
}
