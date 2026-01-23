// app/(barber)/(tabs)/dashboard.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
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

import { LineChart, PieChart } from "react-native-gifted-charts";

import { db } from "@/src/lib/firebase";
import { getAuth } from "firebase/auth";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";

type Range = "today" | "7d" | "30d";

type AppointmentStatus = "PENDING" | "CONFIRMED" | "CANCELED" | "COMPLETED";

type AppointmentDoc = {
  status: AppointmentStatus;
  startAt: Timestamp;
  endAt: Timestamp;
  serviceSnapshot?: { price?: number };
};

function currencyTRY(v: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(v);
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function addDays(d: Date, delta: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + delta);
  return x;
}

function dateKey(d: Date) {
  // YYYY-MM-DD
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}


function formatLabelTR(d: Date) {
  // "23 Oca" gibi
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
  }).format(d);
}

function getRangeWindow(range: Range) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  if (range === "today") {
    return { from: todayStart, to: todayEnd, days: 1 };
  }
  if (range === "7d") {
    const from = startOfDay(addDays(now, -6)); // bugün dahil 7 gün
    return { from, to: todayEnd, days: 7 };
  }
  // 30d
  const from = startOfDay(addDays(now, -29)); // bugün dahil 30 gün
  return { from, to: todayEnd, days: 30 };
}

function Segment({
  value,
  onChange,
  c,
}: {
  value: Range;
  onChange: (v: Range) => void;
  c: any;
}) {
  const items: { key: Range; label: string }[] = [
    { key: "today", label: "Günlük" },
    { key: "7d", label: "Haftalık" },
    { key: "30d", label: "Aylık" },
  ];

  return (
    <View
      className="flex-row rounded-2xl border overflow-hidden"
      style={{ borderColor: c.surfaceBorder, backgroundColor: c.surfaceBg }}
    >
      {items.map((it) => {
        const active = it.key === value;
        return (
          <Pressable
            key={it.key}
            onPress={() => onChange(it.key)}
            style={{
              flex: 1,
              paddingVertical: 10,
              alignItems: "center",
              backgroundColor: active ? c.accentSoft : "transparent",
            }}
          >
            <Text
              style={{
                color: active ? c.accent : c.textMuted,
                fontWeight: "700",
              }}
            >
              {it.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function KpiCard({
  c,
  label,
  value,
  sub,
}: {
  c: any;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card bg={c.surfaceBg} border={c.surfaceBorder} shadowColor={c.shadowColor}>
      <View className="p-4">
        <Text className="text-xs font-semibold" style={{ color: c.textMuted }}>
          {label}
        </Text>
        <Text className="text-2xl font-bold mt-2" style={{ color: c.text }}>
          {value}
        </Text>
        {!!sub && (
          <Text className="text-xs mt-2" style={{ color: c.textMuted }}>
            {sub}
          </Text>
        )}
      </View>
    </Card>
  );
}

type ChartPoint = { label: string; value: number };

type PiePoint = { value: number; text: string; color: string };

type DashboardState = {
  chartData: ChartPoint[];
  totalRevenue: number;
  totalAppointments: number;
  pieStatus: Record<AppointmentStatus, number>;
};

const INITIAL_STATE: DashboardState = {
  chartData: [],
  totalRevenue: 0,
  totalAppointments: 0,
  pieStatus: {
    PENDING: 0,
    CONFIRMED: 0,
    CANCELED: 0,
    COMPLETED: 0,
  },
};

async function fetchDashboardForBarber(args: {
  barberId: string;
  range: Range;
}): Promise<DashboardState> {
  const { from, to, days } = getRangeWindow(args.range);

  // Firestore query:
  // barberId == X AND startAt between [from,to] orderBy startAt asc
  const q = query(
    collection(db, "appointments"),
    where("barberId", "==", args.barberId),
    where("startAt", ">=", Timestamp.fromDate(from)),
    where("startAt", "<=", Timestamp.fromDate(to)),
    orderBy("startAt", "asc"),
    limit(1000)
  );

  const snap = await getDocs(q);



  const pieStatus: Record<AppointmentStatus, number> = {
    PENDING: 0,
    CONFIRMED: 0,
    CANCELED: 0,
    COMPLETED: 0,
  };

  // Günlük gelir map'i (COMPLETED üzerinden)
  const revenueByDay = new Map<string, number>();

  let totalRevenue = 0;
  let totalAppointments = 0;

  snap.docs.forEach((docSnap) => {
    const d = docSnap.data() as AppointmentDoc;

    const status = d.status;
    if (status && pieStatus[status] !== undefined) {
      pieStatus[status] += 1;
    }

    totalAppointments += 1;

    const startDate = d.startAt?.toDate?.();
    const price = Number(d.serviceSnapshot?.price ?? 0);

    // Geliri "COMPLETED" kabul ettim (gerçekleşen gelir).
    if (status === "CONFIRMED" && startDate && price > 0) {
      totalRevenue += price;
      const key = dateKey(startDate);
      revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + price);
    }
  });

  // Chart: seçili aralıktaki tüm günleri doldur (boş günler 0)
  const chartData: ChartPoint[] = [];
  const start = startOfDay(from);

  for (let i = 0; i < days; i++) {
    const day = addDays(start, i);
    const key = dateKey(day);
    chartData.push({
      label: formatLabelTR(day),
      value: revenueByDay.get(key) ?? 0,
    });
  }


  // today seçiliyse tek nokta kalsın
  const finalChart = args.range === "today" ? chartData.slice(-1) : chartData;

  return {
    chartData: finalChart,
    totalRevenue,
    totalAppointments,
    pieStatus,
  };
}

export default function Dashboard() {
  const { effectiveTheme } = useAppTheme();
  const c = colors[effectiveTheme];

  const [range, setRange] = useState<Range>("30d");

  const [w, setW] = useState(0);
  const innerPadding = 32;
  const yAxisLabelWidth = 44;
  const chartWidth = Math.max(0, w - innerPadding - yAxisLabelWidth);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [state, setState] = useState<DashboardState>(INITIAL_STATE);
  const [chartW, setChartW] = useState<number>(0);
  const [forceTick, setForceTick] = useState(0);

  function downsampleLabels(data: { label: string; value: number }[], range: Range) {
    if (range !== "30d") return data;

    const step = 5;
    return data.map((p, i) => ({
      ...p,

      label: i % step === 0 || i === data.length - 1 ? p.label : " ",
    }));
  }

  useEffect(() => {
    setChartW(0);
    const id = requestAnimationFrame(() => setForceTick((x) => x + 1));
    return () => cancelAnimationFrame(id);
  }, [range]);

  const load = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      const auth = getAuth();
      const barberId = auth.currentUser?.uid;

      if (!barberId) {
        // giriş yoksa boş göster
        setState(INITIAL_STATE);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        if (mode === "initial") setLoading(true);
        if (mode === "refresh") setRefreshing(true);

        const data = await fetchDashboardForBarber({ barberId, range });
        setState(data);
      } catch (e) {
        // sessiz fallback
        setState(INITIAL_STATE);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [range]
  );

  useEffect(() => {
    load("initial");
  }, [load]);

  const onRefresh = useCallback(() => {
    load("refresh");
  }, [load]);

  const pieData: PiePoint[] = useMemo(() => {
    const ps = state.pieStatus;
    return [
      { value: ps.PENDING, text: "Beklemede", color: "#f59e0b" },
      { value: ps.CONFIRMED, text: "Onaylandı", color: "#3b82f6" },
      { value: ps.COMPLETED, text: "Tamamlandı", color: "#22c55e" },
      { value: ps.CANCELED, text: "İptal", color: "#ef4444" },
    ].filter((x) => x.value > 0);
  }, [state.pieStatus]);

  const rangeTitle = useMemo(() => {
    return range === "today" ? "Bugün" : range === "7d" ? "Son 7 gün" : "Son 30 gün";
  }, [range]);

  return (
    <View style={{ flex: 1, backgroundColor: c.screenBg }}>
      <View className="px-4 pt-10 pb-3">
        <Text className="text-2xl pt-10 font-bold" style={{ color: c.text }}>
          Dashboard
        </Text>
        <Text className="mt-1 pl-2" style={{ color: c.textMuted }}>
          KPI + Gelir Grafiği + Durum Dağılımı
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingTop: 10,
          paddingHorizontal: 16,
          paddingBottom: 24,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={c.textMuted}
          />
        }
      >
        <Segment
          value={range}
          onChange={(v) => {
            setRange(v);
            // range değişince otomatik useEffect -> load
          }}
          c={c}
        />

        <View style={{ height: 14 }} />

        {loading ? (
          <View style={{ paddingVertical: 24 }}>
            <ActivityIndicator />
          </View>
        ) : (
          <>
            {/* KPI */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <KpiCard
                  c={c}
                  label="Seçili Aralık Gelir"
                  value={currencyTRY(state.totalRevenue)}
                  sub="(Tamamlanan randevular)"
                />
              </View>
              <View style={{ flex: 1 }}>
                <KpiCard
                  c={c}
                  label="Randevu Sayısı"
                  value={`${state.totalAppointments}`}
                  sub={rangeTitle}
                />
              </View>
            </View>

            <View style={{ height: 12 }} />

            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <KpiCard c={c} label="İptal" value={`${state.pieStatus.CANCELED}`} />
              </View>
              <View style={{ flex: 1 }}>
                <KpiCard
                  c={c}
                  label="Onay Bekleyen"
                  value={`${state.pieStatus.PENDING}`}
                />
              </View>
            </View>

            <View style={{ height: 14 }} />

            {/* Line Chart */}
            <Card bg={c.surfaceBg} border={c.surfaceBorder} shadowColor={c.shadowColor}>
              <View
                className="p-4"
                onLayout={(e) => {
                  const full = e.nativeEvent.layout.width;
                  const innerPadding = 32;
                  const yAxisLabelWidth = 44;
                  const cw = Math.max(0, full - innerPadding - yAxisLabelWidth);
                  setChartW(cw);
                }}
              >
                <Text className="text-base font-bold" style={{ color: c.text }}>
                  Gelir Trendi
                </Text>
                <Text className="text-xs mt-1" style={{ color: c.textMuted }}>
                  {rangeTitle}
                </Text>

                <View style={{ height: 12 }} />

                {/* ✅ sabit yükseklikli container */}
                <View style={{ width: "100%", height: 250 }}>
                  {chartW > 0 && (
                    <LineChart
                      key={`${range}-${chartW}-${state.chartData.length}-${forceTick}`}
                      data={downsampleLabels(
                        state.chartData.map((x) => ({ value: x.value, label: x.label })),
                        range
                      )}
                      width={chartW}
                      height={200}
                      areaChart
                      curved
                      hideRules
                      yAxisLabelWidth={44}
                      yAxisThickness={0}
                      hideDataPoints={range === "30d"}
                      xAxisThickness={0}
                      showVerticalLines={false}
                      initialSpacing={0}
                      endSpacing={0}
                      spacing={
                        state.chartData.length > 1
                          ? Math.max(1, chartW / (state.chartData.length - 1))
                          : chartW
                      }
                      xAxisLabelsHeight={range === "30d" ? 0 : 18}
                      xAxisLabelTextStyle={{ color: c.text, fontSize: 11 }}
                      yAxisTextStyle={{ color: c.text, fontSize: 11 }}
                      color={c.accent}
                      thickness={3}
                      startFillColor={c.accent}
                      endFillColor={c.accent}
                      startOpacity={0.18}
                      endOpacity={0.02}
                    />)

                  }
                  {range === "30d" && state.chartData.length > 0 && (
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        paddingHorizontal: 4,
                        marginTop: 8,
                      }}
                    >
                      <Text style={{ color: c.textMuted, fontSize: 11 }}>
                        {state.chartData[0]?.label}
                      </Text>

                      <Text style={{ color: c.textMuted, fontSize: 11 }}>
                        {state.chartData[Math.floor(state.chartData.length / 2)]?.label}
                      </Text>

                      <Text style={{ color: c.textMuted, fontSize: 11 }}>
                        {state.chartData[state.chartData.length - 1]?.label}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </Card>

            <View style={{ height: 14 }} />

            {/* Pie Chart */}
            <Card bg={c.surfaceBg} border={c.surfaceBorder} shadowColor={c.shadowColor}>
              <View className="p-4">
                <Text className="text-base font-bold" style={{ color: c.text }}>
                  Durum Dağılımı
                </Text>
                <Text className="text-xs mt-1" style={{ color: c.textMuted }}>
                  {rangeTitle}
                </Text>

                <View style={{ height: 12 }} />

                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <PieChart
                    data={pieData}
                    donut
                    radius={92}
                    innerRadius={50}
                    showText={false}
                    strokeColor={c.cardBg}
                    strokeWidth={10}
                    focusOnPress
                    centerLabelComponent={() => (
                      <View
                        style={{
                          width: 2 * 60,       // innerRadius * 2
                          height: 2 * 60,      // innerRadius * 2
                          borderRadius: 60,
                          backgroundColor: c.surfaceBg, // ✅ merkez rengi burada
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {/* istersen merkezde text */}
                        {/* <Text style={{ color: c.text, fontWeight: "700" }}>Toplam</Text> */}
                      </View>
                    )}
                  />

                  <View style={{ flex: 1, gap: 10 }}>
                    {pieData.map((s) => (
                      <View
                        key={`${s.text}-${s.value}`}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingVertical: 10,
                          paddingHorizontal: 12,
                          borderRadius: 14,
                          borderWidth: 1,
                          borderColor: c.surfaceBorder,
                          backgroundColor: c.cardBg,
                        }}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                          <View
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: 99,
                              backgroundColor: s.color,
                            }}
                          />
                          <Text style={{ color: c.text, fontWeight: "700" }}>{s.text}</Text>
                        </View>
                        <Text style={{ color: c.textMuted, fontWeight: "700" }}>{s.value}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </Card>

            <View style={{ height: 24 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
}
