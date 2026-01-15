import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    View,
} from "react-native";

import { Text } from "@/components/ui/text";
import Card from "@/src/components/Card";
import { useAppTheme } from "@/src/theme/ThemeProvider";
import { colors } from "@/src/theme/colors";

import { auth } from "@/src/lib/firebase";
import { getBarberById, updateBarberWorkingHours } from "@/src/services/barbers.service";
import { DEFAULT_WORKING_HOURS, DayHours, WorkingBreak, WorkingHours } from "@/src/types/workingHours";

const TR_DAYS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"] as const;

const TIME_OPTIONS = [
  "08:00","08:30","09:00","09:30","10:00","10:30",
  "11:00","11:30","12:00","12:30","13:00","13:30",
  "14:00","14:30","15:00","15:30","16:00","16:30",
  "17:00","17:30","18:00","18:30","19:00","19:30",
  "20:00","20:30","21:00","21:30","22:00",
];

function isClosed(x: DayHours): x is { closed: true } {
  return (x as any)?.closed === true;
}

function DayRow({
  c,
  label,
  value,
  onToggle,
  onPickStart,
  onPickEnd,
}: {
  c: any;
  label: string;
  value: DayHours;
  onToggle: () => void;
  onPickStart: () => void;
  onPickEnd: () => void;
}) {
  const closed = isClosed(value);

  return (
    <View className="px-4 py-3">
      <View className="flex-row items-center justify-between">
        <Text className="font-semibold" style={{ color: c.text }}>
          {label}
        </Text>

        <Pressable
          onPress={onToggle}
          className="px-3 h-9 rounded-xl items-center justify-center border"
          style={{
            backgroundColor: closed ? "transparent" : c.accentSoft,
            borderColor: closed ? c.surfaceBorder : c.accentBorder,
          }}
        >
          <Text style={{ color: closed ? c.textMuted : c.accent, fontWeight: "700", fontSize: 12 }}>
            {closed ? "Kapalı" : "Açık"}
          </Text>
        </Pressable>
      </View>

      {!closed ? (
        <View className="flex-row gap-3 mt-3">
          <Pressable onPress={onPickStart} className="flex-1">
            <View
              className="rounded-2xl border px-3 py-3"
              style={{ borderColor: c.surfaceBorder, backgroundColor: c.surfaceBg }}
            >
              <Text className="text-xs" style={{ color: c.textMuted }}>
                Başlangıç
              </Text>
              <Text className="text-base font-bold mt-1" style={{ color: c.text }}>
                {(value as any).start}
              </Text>
            </View>
          </Pressable>

          <Pressable onPress={onPickEnd} className="flex-1">
            <View
              className="rounded-2xl border px-3 py-3"
              style={{ borderColor: c.surfaceBorder, backgroundColor: c.surfaceBg }}
            >
              <Text className="text-xs" style={{ color: c.textMuted }}>
                Bitiş
              </Text>
              <Text className="text-base font-bold mt-1" style={{ color: c.text }}>
                {(value as any).end}
              </Text>
            </View>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function PickerSheet({
  c,
  title,
  value,
  onSelect,
  onClose,
}: {
  c: any;
  title: string;
  value: string;
  onSelect: (t: string) => void;
  onClose: () => void;
}) {
  return (
    <View className="left-0 right-0 bottom-0">
      {/* Backdrop */}
      <Pressable
        onPress={onClose}
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: "rgba(0,0,0,0.35)",
        }}
      />

      {/* Sheet */}
      <View
        style={{
          backgroundColor: c.screenBg,
          borderTopWidth: 1,
          borderTopColor: c.divider,
          paddingTop: 50, // ✅ en az 20
          paddingBottom: 18,
        }}
      >
        <View className="px-4 pb-3 flex-row items-center justify-between">
          <Text className="text-base font-bold" style={{ color: c.text }}>
            {title}
          </Text>

          <Pressable onPress={onClose} className="w-10 h-10 rounded-2xl items-center justify-center border"
            style={{ borderColor: c.surfaceBorder, backgroundColor: c.surfaceBg }}>
            <Ionicons name="close" size={18} color={c.textMuted} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 16,
          }}
        >
          {/* ✅ 3 kolon + gap-4 */}
          <View  style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
            {TIME_OPTIONS.map((t) => {
              const selected = t === value;
              return (
                <Pressable
                  key={t}
                  onPress={() => onSelect(t)}
                  style={{
                    width: "31%", // 3 kolon (yaklaşık)
                  }}
                >
                  <View
                    className="rounded-2xl border px-3 py-3 items-center justify-center"
                    style={{
                      backgroundColor: selected ? c.accentSoft : c.surfaceBg,
                      borderColor: selected ? c.accentBorder : c.surfaceBorder,
                    }}
                  >
                    <Text style={{ color: selected ? c.accent : c.text, fontWeight: "700" }}>
                      {t}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

// ✅ StyleSheet gerekli (backdrop için)
import { StyleSheet } from "react-native";

export default function WorkingHoursScreen() {
  const { effectiveTheme } = useAppTheme();
  const c = colors[effectiveTheme];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [hours, setHours] = useState<WorkingHours>(DEFAULT_WORKING_HOURS);

  const [sheet, setSheet] = useState<null | { dayKey: string; field: "start" | "end" }>(null);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    (async () => {
      try {
        if (!uid) return;
        setLoading(true);
        const barber = await getBarberById(uid);
        if (barber?.workingHours) setHours(barber.workingHours);
        else setHours(DEFAULT_WORKING_HOURS);
      } finally {
        setLoading(false);
      }
    })();
  }, [uid]);

  const currentSheetValue = useMemo(() => {
    if (!sheet) return "09:00";
    const d = hours.week[sheet.dayKey];
    if (!d || (d as any).closed) return "09:00";
    return (d as any)[sheet.field] ?? "09:00";
  }, [sheet, hours]);

  function toggleDay(dayKey: string) {
    setHours((prev) => {
      const cur = prev.week[dayKey];
      const nextWeek = { ...prev.week };

      if (!cur || (cur as any).closed) {
        nextWeek[dayKey] = { start: "09:00", end: "21:00", breaks: [{ start: "13:00", end: "14:00" }] as WorkingBreak[] };
      } else {
        nextWeek[dayKey] = { closed: true };
      }

      return { ...prev, week: nextWeek };
    });
  }

  function setDayTime(dayKey: string, field: "start" | "end", value: string) {
    setHours((prev) => {
      const cur = prev.week[dayKey];
      if (!cur || (cur as any).closed) return prev;

      const nextWeek = { ...prev.week };
      nextWeek[dayKey] = { ...(cur as any), [field]: value };
      return { ...prev, week: nextWeek };
    });
  }

  async function onSave() {
    try {
      if (!uid) return;
      setSaving(true);
      await updateBarberWorkingHours(uid, hours);
      Alert.alert("Kaydedildi", "Çalışma saatleri güncellendi.");
      router.back();
    } catch {
      Alert.alert("Hata", "Kaydetme başarısız.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: c.screenBg }}>
        <ActivityIndicator />
        <Text className="mt-2" style={{ color: c.textMuted }}>
          Yükleniyor...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: c.screenBg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
    >
      {/* ✅ Scroll */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 40,
          paddingBottom: 140, // alttaki kaydet barı için boşluk
        }}
      >
        {/* Header */}
        <View className="px-4 pb-3 flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold" style={{ color: c.text }}>
              Çalışma Saatleri
            </Text>
            <Text className="mt-1" style={{ color: c.textMuted }}>
              Müşterilerin göreceği uygun saatleri ayarla.
            </Text>
          </View>

          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-2xl items-center justify-center border"
            style={{ borderColor: c.surfaceBorder, backgroundColor: c.surfaceBg }}
          >
            <Ionicons name="close" size={20} color={c.textMuted} />
          </Pressable>
        </View>

        {/* Slot step */}
        <View className="px-4">
          <Card bg={c.surfaceBg} border={c.surfaceBorder} shadowColor={c.shadowColor}>
            <View className="px-4 py-4 flex-row items-center justify-between">
              <View>
                <Text className="font-semibold" style={{ color: c.text }}>
                  Slot Aralığı
                </Text>
                <Text className="text-xs mt-1" style={{ color: c.textMuted }}>
                  Saatlerin listelenme adımı (15/30 dk)
                </Text>
              </View>

              <View className="flex-row gap-2">
                {[15, 30].map((v) => {
                  const selected = hours.slotStepMin === v;
                  return (
                    <Pressable
                      key={v}
                      onPress={() => setHours((p) => ({ ...p, slotStepMin: v }))}
                      className="px-3 h-9 rounded-xl items-center justify-center border"
                      style={{
                        backgroundColor: selected ? c.accentSoft : "transparent",
                        borderColor: selected ? c.accentBorder : c.surfaceBorder,
                      }}
                    >
                      <Text style={{ color: selected ? c.accent : c.textMuted, fontWeight: "700", fontSize: 12 }}>
                        {v} dk
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </Card>
        </View>

        {/* Week */}
        <View className="px-4 mt-4">
          <Card bg={c.surfaceBg} border={c.surfaceBorder} shadowColor={c.shadowColor}>
            {Object.keys(hours.week)
              .map((k) => Number(k))
              .sort((a, b) => a - b)
              .map((dayIndex, idx, arr) => {
                const dayKey = String(dayIndex);
                const value = hours.week[dayKey];

                return (
                  <View key={dayKey}>
                    <DayRow
                      c={c}
                      label={TR_DAYS[dayIndex]}
                      value={value}
                      onToggle={() => toggleDay(dayKey)}
                      onPickStart={() => setSheet({ dayKey, field: "start" })}
                      onPickEnd={() => setSheet({ dayKey, field: "end" })}
                    />
                    {idx !== arr.length - 1 ? (
                      <View style={{ height: 1, backgroundColor: c.divider, marginLeft: 16 }} />
                    ) : null}
                  </View>
                );
              })}
          </Card>
        </View>
      </ScrollView>

      {/* ✅ Sabit Kaydet bar */}
      <View
        className="absolute left-0 right-0 bottom-0 px-4 pb-8 pt-3"
        style={{ backgroundColor: c.screenBg, borderTopWidth: 1, borderTopColor: c.divider }}
      >
        <Pressable disabled={saving} onPress={onSave}>
          <View
            className="rounded-2xl py-4 items-center justify-center border"
            style={{
              backgroundColor: c.accentSoft,
              borderColor: c.accentBorder,
              opacity: saving ? 0.7 : 1,
            }}
          >
            <Text className="font-semibold" style={{ color: c.accent }}>
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Text>
          </View>
        </Pressable>
      </View>

      {/* ✅ Saat seçme sheet */}
      {sheet ? (
        <PickerSheet
          c={c}
          title={sheet.field === "start" ? "Başlangıç Saati" : "Bitiş Saati"}
          value={currentSheetValue}
          onSelect={(t) => {
            setDayTime(sheet.dayKey, sheet.field, t);
            setSheet(null);
          }}
          onClose={() => setSheet(null)}
        />
      ) : null}
    </KeyboardAvoidingView>
  );
}
