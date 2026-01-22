import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { Text } from "@/components/ui/text";
import Card from "@/src/components/Card";
import { useAppTheme } from "@/src/theme/ThemeProvider";
import { colors } from "@/src/theme/colors";

import { LineChart, PieChart } from "react-native-gifted-charts";

type Range = "today" | "7d" | "30d";

function currencyTRY(v: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(v);
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
            <Text style={{ color: active ? c.accent : c.textMuted, fontWeight: "700" }}>
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

export default function DashboardDemo() {
  const { effectiveTheme } = useAppTheme();
  const c = colors[effectiveTheme];

  const [range, setRange] = useState<Range>("30d");

  // --- DEMO DATA (sonradan API ile değiştirirsin)
  const revenueDaily30 = [
    { label: "01 Oca", value: 1200 },
    { label: "02 Oca", value: 900 },
    { label: "03 Oca", value: 1600 },
    { label: "04 Oca", value: 800 },
    { label: "05 Oca", value: 2100 },
    { label: "06 Oca", value: 1400 },
    { label: "07 Oca", value: 2600 },
    { label: "08 Oca", value: 1900 },
    { label: "09 Oca", value: 2300 },
    { label: "10 Oca", value: 1700 },
  ];

  const pieStatus = {
    PENDING: 6,
    CONFIRMED: 14,
    DONE: 9,
    CANCELLED: 2,
  };

  const chartData = useMemo(() => {
    if (range === "today") return revenueDaily30.slice(-1);
    if (range === "7d") return revenueDaily30.slice(-7);
    return revenueDaily30;
  }, [range]);

  const rangeRevenue = useMemo(
    () => chartData.reduce((s, x) => s + (x.value ?? 0), 0),
    [chartData]
  );

  const rangeAppointments = useMemo(() => {
    const total = Object.values(pieStatus).reduce((s, n) => s + n, 0);
    if (range === "today") return Math.max(1, Math.round(total * 0.15));
    if (range === "7d") return Math.max(1, Math.round(total * 0.55));
    return total;
  }, [range]);

  const pieData = useMemo(() => {
    // gifted-charts PieChart: { value, text, color }
    return [
      { value: pieStatus.PENDING, text: "Beklemede", color: "#f59e0b" },
      { value: pieStatus.CONFIRMED, text: "Onaylandı", color: "#3b82f6" },
      { value: pieStatus.DONE, text: "Tamamlandı", color: "#22c55e" },
      { value: pieStatus.CANCELLED, text: "İptal", color: "#ef4444" },
    ].filter((x) => x.value > 0);
  }, [range]);

  return (
    <View style={{ flex: 1, backgroundColor: c.screenBg }}>
      <View className="px-4 pt-10 pb-3">
        <Text className="text-2xl font-bold" style={{ color: c.text }}>
          Dashboard (Demo)
        </Text>
        <Text className="mt-1" style={{ color: c.textMuted }}>
          KPI + Gelir Grafiği + Durum Dağılımı
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Segment value={range} onChange={setRange} c={c} />

        <View style={{ height: 14 }} />

        {/* KPI */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <KpiCard c={c} label="Seçili Aralık Gelir" value={currencyTRY(rangeRevenue)} sub="(demo veri)" />
          </View>
          <View style={{ flex: 1 }}>
            <KpiCard c={c} label="Randevu Sayısı" value={`${rangeAppointments}`} sub="(demo hesap)" />
          </View>
        </View>

        <View style={{ height: 12 }} />

        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <KpiCard c={c} label="İptal" value={`${pieStatus.CANCELLED}`} />
          </View>
          <View style={{ flex: 1 }}>
            <KpiCard c={c} label="Onay Bekleyen" value={`${pieStatus.PENDING}`} />
          </View>
        </View>

        <View style={{ height: 14 }} />

        {/* Line Chart */}
        <Card bg={c.surfaceBg} border={c.surfaceBorder} shadowColor={c.shadowColor}>
          <View className="p-4">
            <Text className="text-base font-bold" style={{ color: c.text }}>
              Gelir Trendi
            </Text>
            <Text className="text-xs mt-1" style={{ color: c.textMuted }}>
              {range === "today" ? "Bugün" : range === "7d" ? "Son 7 gün" : "Son 30 gün"} (demo)
            </Text>

            <View style={{ height: 12 }} />

            <LineChart
              data={chartData}
              height={220}
              areaChart
              curved
              hideRules
              hideYAxisText
              yAxisThickness={0}
              xAxisThickness={0}
              showVerticalLines={false}
              isAnimated
              animationDuration={700}
              initialSpacing={10}
              spacing={34}
              // “tek renk” istersen burayı theme’den bağlarız
              color={c.accent}
              thickness={3}
              startFillColor={c.accent}
              endFillColor={c.accent}
              startOpacity={0.18}
              endOpacity={0.02}
              pointerConfig={{
                pointerStripUptoDataPoint: true,
                pointerStripColor: c.surfaceBorder,
                pointerStripWidth: 2,
                pointerColor: c.accent,
                radius: 4,
                pointerLabelComponent: (
                  items: { value: number; label?: string }[]
                ) => {
                  const v = items?.[0]?.value ?? 0;

                  return (
                    <View
                      style={{
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: c.surfaceBorder,
                        backgroundColor: c.surfaceBg,
                      }}
                    >
                      <Text style={{ color: c.text, fontWeight: "700" }}>
                        {currencyTRY(Number(v))}
                      </Text>
                    </View>
                  );
                },
              }}
            />
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
              Seçili aralıkta (demo)
            </Text>

            <View style={{ height: 12 }} />

            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <PieChart
                data={pieData}
                donut
                radius={92}
                innerRadius={60}
                showText={false}
                strokeColor={c.screenBg}
                strokeWidth={10}
                focusOnPress
              />

              <View style={{ flex: 1, gap: 10 }}>
                {pieData.map((s) => (
                  <View
                    key={s.text}
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
      </ScrollView>
    </View>
  );
}
