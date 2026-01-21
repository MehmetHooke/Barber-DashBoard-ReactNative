import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  View,
  useWindowDimensions,
} from "react-native";

import { Text } from "@/components/ui/text";
import Card from "@/src/components/Card";
import { useAppTheme } from "@/src/theme/ThemeProvider";
import { colors } from "@/src/theme/colors";

import { getBarberAppointmentsForDay } from "@/src/services/appointmentService";
import { getBarberById, type BarberDoc, type DayHours, type WorkingBreak, type WorkingHours } from "@/src/services/barbers.service";
import { getServiceById, type ServiceDoc } from "@/src/services/services.service";

// -------------------- Helpers --------------------
const TR_MONTHS = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"] as const;
const TR_DAYS = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"] as const;

function pad2(n: number) { return n < 10 ? `0${n}` : `${n}`; }
function formatFullDateTR(d: Date) {
  const day = d.getDate();
  const month = TR_MONTHS[d.getMonth()];
  const dow = TR_DAYS[d.getDay()];
  return `${day} ${month} ${dow}`;
}
function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function minutesToTime(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${pad2(h)}:${pad2(m)}`;
}
function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addMinutes(base: Date, minutes: number) {
  return new Date(base.getTime() + minutes * 60 * 1000);
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && aEnd > bStart;
}
function inBreaks(slotStartMin: number, slotEndMin: number, breaks?: WorkingBreak[]) {
  if (!breaks?.length) return false;
  for (const br of breaks) {
    const bs = timeToMinutes(br.start);
    const be = timeToMinutes(br.end);
    if (overlaps(slotStartMin, slotEndMin, bs, be)) return true;
  }
  return false;
}

// -------------------- UI Pieces --------------------
function SelectedSummary({ c, service, barber }: { c: any; service?: ServiceDoc | null; barber?: BarberDoc | null }) {
  return (
    <Card bg={c.surfaceBg} border={c.surfaceBorder} shadowColor={c.shadowColor}>
      <View className="px-4 py-4">
        <Text className="text-xs font-semibold" style={{ color: c.textMuted }}>
          SEÇTİKLERİN
        </Text>

        <View className="mt-3">
          <Text className="text-sm" style={{ color: c.textMuted }}>Hizmet</Text>
          <Text className="text-base font-bold mt-1" style={{ color: c.text }}>
            {service?.name ?? "—"}
          </Text>
          {service ? (
            <Text className="text-xs mt-1" style={{ color: c.textMuted }}>
              {service.durationMin} dk • {service.price} ₺
            </Text>
          ) : null}
        </View>

        <View className="mt-4">
          <Text className="text-sm" style={{ color: c.textMuted }}>Berber</Text>
          <Text className="text-base font-bold mt-1" style={{ color: c.text }}>
            {barber?.name ?? "—"}
          </Text>
        </View>
      </View>
    </Card>
  );
}

function DateCard({
  c, title, dateText, selected, onPress, width,
}: {
  c: any;
  title?: string;
  dateText: string;
  selected: boolean;
  onPress: () => void;
  width: number;
}) {
  return (
    <Pressable onPress={onPress} style={{ width }}>
      <View
        className="rounded-2xl border px-3 py-3 mr-3"
        style={{
          backgroundColor: selected ? c.accentSoft : c.surfaceBg,
          borderColor: selected ? c.accentBorder : c.surfaceBorder,
        }}
      >
        <Text className="text-xs font-semibold" style={{ color: selected ? c.accent : c.textMuted }} numberOfLines={1}>
          {title || " "}
        </Text>
        <Text className="text-sm font-semibold mt-1" style={{ color: c.text }} numberOfLines={2}>
          {dateText}
        </Text>
      </View>
    </Pressable>
  );
}

function TimeSlotCard({
  c, label, subLabel, disabled, selected, onPress,
}: {
  c: any;
  label: string;
  subLabel: string;
  disabled: boolean;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={{ flex: 1 }}>
      <View
        className="rounded-2xl border px-4 py-4"
        style={{
          backgroundColor: selected ? c.accentSoft : c.surfaceBg,
          borderColor: selected ? c.accentBorder : c.surfaceBorder,
          opacity: disabled ? 0.45 : 1,
        }}
      >
        <Text className="text-base font-bold" style={{ color: c.text }}>
          {label}
        </Text>
        <Text className="text-xs mt-1" style={{ color: c.textMuted }}>
          {subLabel}
        </Text>
      </View>
    </Pressable>
  );
}

// -------------------- Screen --------------------
export default function SelectTime() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const { effectiveTheme } = useAppTheme();
  const c = colors[effectiveTheme];

  const params = useLocalSearchParams<{ serviceId?: string; barberId?: string }>();
  const serviceId = typeof params.serviceId === "string" ? params.serviceId : undefined;
  const barberId = typeof params.barberId === "string" ? params.barberId : undefined;

  // ✅ Firestore verileri
  const [service, setService] = useState<ServiceDoc | null>(null);
  const [barber, setBarber] = useState<BarberDoc | null>(null);

  const [loadingTop, setLoadingTop] = useState(true);

  // Tarihler: bugün + 13 gün
  const days = useMemo(() => {
    const out: { date: Date; title?: string; full: string; key: string }[] = [];
    const now = startOfDay(new Date());
    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const title = i === 0 ? "Bugün" : i === 1 ? "Yarın" : "";
      out.push({ date: d, title, full: formatFullDateTR(d), key: d.toISOString() });
    }
    return out;
  }, []);

  const [selectedDay, setSelectedDay] = useState<Date>(days[0]?.date ?? new Date());
  const [loadingBusy, setLoadingBusy] = useState(false);
  const [busyRanges, setBusyRanges] = useState<{ startAt: Date; endAt: Date }[]>([]);
  const [selectedStart, setSelectedStart] = useState<Date | null>(null);

  // Date slider
  const dateListRef = useRef<FlatList<any>>(null);
  const dateItemWidth = Math.floor(width * 0.42); // geniş kartlar
  const dateGap = 12;

  // ✅ service + barber çek
  useEffect(() => {
    (async () => {
      try {
        setLoadingTop(true);
        if (!serviceId || !barberId) {
          Alert.alert("Eksik bilgi", "Hizmet veya berber seçimi eksik.");
          return;
        }

        const [svc, brb] = await Promise.all([
          getServiceById(serviceId),
          getBarberById(barberId),
        ]);

        setService(svc);
        setBarber(brb);
      } catch (e: any) {
        const msg = String(e?.message || "");
        if (msg.includes("requires an index")) {
          Alert.alert("Firestore Index", "Bu sorgu için index gerekli (Console).");
        } else {
          Alert.alert("Hata", "Veriler yüklenemedi.");
        }
      } finally {
        setLoadingTop(false);
      }
    })();
  }, [serviceId, barberId]);

  // seçili günü ortala
  useEffect(() => {
    const idx = days.findIndex((x) => sameDay(x.date, selectedDay));
    if (idx < 0) return;

    const t = setTimeout(() => {
      dateListRef.current?.scrollToIndex({
        index: idx,
        animated: true,
        viewPosition: 0.5,
      });
    }, 50);

    return () => clearTimeout(t);
  }, [selectedDay, days]);

  // busy randevuları çek
  useEffect(() => {
    (async () => {
      if (!barberId) return;
      setLoadingBusy(true);
      setSelectedStart(null);

      try {
        const shopId = "main";
        const list = await getBarberAppointmentsForDay({
          shopId,
          barberId,
          day: selectedDay,
        });

        setBusyRanges(list.map((x) => ({ startAt: x.startAt, endAt: x.endAt })));
      } catch (e: any) {
        const msg = String(e?.message || "");
        if (msg.includes("requires an index")) {
          Alert.alert("Firestore Index", "Randevu sorgusu için index gerekli (Console).");
        } else {
          Alert.alert("Hata", "Dolu saatler alınamadı.");
        }
      } finally {
        setLoadingBusy(false);
      }
    })();
  }, [barberId, selectedDay]);

  // slot üret
  const slots = useMemo(() => {
    if (!service || !barber) return [];

    const wh: WorkingHours | undefined = (barber as any).workingHours;
    if (!wh || !wh.week) return []; // çalışma saatleri ayarlanmamış

    const dow = selectedDay.getDay(); // 0-6
    const dayConf = wh.week[String(dow)] as DayHours | undefined;
    if (!dayConf || (dayConf as any).closed) return [];

    const conf = dayConf as Extract<DayHours, { start: string; end: string }>;
    const step = wh.slotStepMin || 30;

    const startMin = timeToMinutes(conf.start);
    const endMin = timeToMinutes(conf.end);
    const duration = service.durationMin;

    const now = new Date();
    const items: { label: string; startAt: Date; endAt: Date; disabled: boolean }[] = [];

    for (let m = startMin; m + duration <= endMin; m += step) {
      const slotStartMin = m;
      const slotEndMin = m + duration;

      const startAt = new Date(selectedDay);
      startAt.setHours(Math.floor(slotStartMin / 60), slotStartMin % 60, 0, 0);
      const endAt = addMinutes(startAt, duration);

      const isBreak = inBreaks(slotStartMin, slotEndMin, conf.breaks);
      const isPast = sameDay(selectedDay, now) && startAt.getTime() <= now.getTime();

      const s = startAt.getTime();
      const e = endAt.getTime();
      const isBusy = busyRanges.some((b) => overlaps(s, e, b.startAt.getTime(), b.endAt.getTime()));

      items.push({
        label: minutesToTime(slotStartMin),
        startAt,
        endAt,
        disabled: isBreak || isPast || isBusy,
      });
    }

    return items;
  }, [service, barber, selectedDay, busyRanges]);

  const canContinue = !!selectedStart && !!serviceId && !!barberId && !!service;

  const noWorkingHours = useMemo(() => {
    const wh = (barber as any)?.workingHours;
    return barber && (!wh || !wh.week);
  }, [barber]);

  if (loadingTop) {
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
    <View className="flex-1" style={{ backgroundColor: c.screenBg }}>
      {/* Header */}
      <View className="px-4 pt-10 pb-3">
        <Text className="text-2xl font-bold" style={{ color: c.text }}>
          Tarih & Saat Seç
        </Text>
        <Text className="mt-1" style={{ color: c.textMuted }}>
          Uygun bir saat seç. Dolu saatler pasif görünür.
        </Text>
      </View>

      <View className="px-4">
        <SelectedSummary c={c} service={service} barber={barber} />
      </View>

      {/* Date slider */}
      <View className="px-4 mt-4">
        <FlatList
          ref={dateListRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          data={days}
          keyExtractor={(x) => x.key}
          contentContainerStyle={{ paddingRight: 16 }}
          snapToInterval={dateItemWidth + dateGap}
          decelerationRate="fast"
          renderItem={({ item }) => {
            const selected = sameDay(item.date, selectedDay);
            return (
              <DateCard
                c={c}
                title={item.title}
                dateText={item.full}
                selected={selected}
                onPress={() => setSelectedDay(item.date)}
                width={dateItemWidth}
              />
            );
          }}
        />
      </View>

      {/* Slots */}
      <View className="px-4 mt-4 flex-1">
        {loadingBusy ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator />
            <Text className="mt-2" style={{ color: c.textMuted }}>
              Uygun saatler yükleniyor...
            </Text>
          </View>
        ) : noWorkingHours ? (
          <Card bg={c.surfaceBg} border={c.surfaceBorder} shadowColor={c.shadowColor}>
            <View className="p-4">
              <Text className="font-semibold" style={{ color: c.text }}>
                Çalışma saatleri ayarlanmamış
              </Text>
              <Text className="mt-1 text-sm" style={{ color: c.textMuted }}>
                Berber panelinden “Çalışma Saatleri” eklenince burada saatler görünecek.
              </Text>
            </View>
          </Card>
        ) : slots.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-base font-bold" style={{ color: c.text }}>
              Bu gün için uygun saat yok
            </Text>
            <Text className="mt-2 text-sm" style={{ color: c.textMuted }}>
              Berberin çalışma saati kapalı olabilir.
            </Text>
          </View>
        ) : (
          <FlatList
            data={slots}
            keyExtractor={(x) => x.startAt.toISOString()}
            numColumns={2}
            columnWrapperStyle={{ gap: 12 }}
            contentContainerStyle={{ paddingBottom: 120, gap: 12 }}
            renderItem={({ item }) => {
              const selected = selectedStart?.toISOString() === item.startAt.toISOString();
              return (
                <TimeSlotCard
                  c={c}
                  label={item.label}
                  subLabel={service ? `${service.durationMin} dk • ${service.price} ₺` : ""}
                  disabled={item.disabled}
                  selected={selected}
                  onPress={() => setSelectedStart(item.startAt)}
                />
              );
            }}
          />
        )}
      </View>

      {/* Bottom bar */}
      <View
        className="absolute left-0 right-0 bottom-0 px-4 pb-6 pt-3"
        style={{ backgroundColor: c.screenBg, borderTopWidth: 1, borderTopColor: c.divider }}
      >
        <Pressable
          disabled={!canContinue}
          onPress={() => {
            if (!selectedStart || !service || !barberId || !serviceId) return;
            const endAt = addMinutes(selectedStart, service.durationMin);

            router.push({
              pathname: "/(user)/book/confirm",
              params: {
                serviceId,
                barberId,
                startAt: selectedStart.toISOString(),
                endAt: endAt.toISOString(),
              },
            });
          }}
        >
          <View
            className="rounded-2xl py-4 items-center justify-center border"
            style={{
              backgroundColor: canContinue ? c.accentSoft : "transparent",
              borderColor: canContinue ? c.accentBorder : c.surfaceBorder,
              opacity: canContinue ? 1 : 0.6,
            }}
          >
            <Text className="font-semibold" style={{ color: canContinue ? c.accent : c.textMuted }}>
              Devam Et
            </Text>
          </View>
        </Pressable>

        {!selectedStart ? (
          <Text className="text-xs mt-2" style={{ color: c.textMuted }}>
            Devam etmek için bir saat seç.
          </Text>
        ) : null}
      </View>
    </View>
  );
}
