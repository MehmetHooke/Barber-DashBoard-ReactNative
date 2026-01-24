import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from "react-native";

import { Text } from "@/components/ui/text";
import Card from "@/src/components/Card";
import { useAppTheme } from "@/src/theme/ThemeProvider";
import { colors } from "@/src/theme/colors";

import { fetchWeeklyCoach, WeeklyCoachData } from "@/src/services/ai.service";

function safeJsonParse<T>(raw?: string): T | null {
    if (!raw) return null;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

export default function WeeklyAnalyzeModal() {
    const { effectiveTheme } = useAppTheme();
    const c = colors[effectiveTheme];

    const [error, setError] = useState<string | null>(null);
    // Dashboard’dan parametre olarak taşıyacağız
    const params = useLocalSearchParams<{
        rangeStart?: string;
        rangeEnd?: string;
        currency?: string;
        dailyRevenue?: string;   // JSON string
        appointments?: string;   // JSON string
        timeBuckets?: string;    // JSON string (opsiyonel)
        shopId?: string;
    }>();

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<WeeklyCoachData | null>(null);

    const payload = useMemo(() => {
        const dailyRevenue = safeJsonParse<any[]>(params.dailyRevenue) ?? [];
        const appointments = safeJsonParse<any>(params.appointments) ?? null;
        const timeBuckets = safeJsonParse<any[]>(params.timeBuckets) ?? [];

        return {
            shopId: params.shopId ?? "main",
            range: { start: params.rangeStart ?? "", end: params.rangeEnd ?? "" },
            currency: params.currency ?? "TRY",
            dailyRevenue,
            appointments: appointments ?? { total: 0, cancelled: 0, completed: 0, pending: 0 },
            timeBuckets,
        };
    }, [params]);

    async function run() {
        setError(null);
        // basit guard
        if (!payload.range.start || !payload.range.end || payload.dailyRevenue.length === 0) {
            Alert.alert("Eksik veri", "Dashboard verisi gelmedi. Tekrar deneyin.");
            return;
        }

        try {
            setLoading(true);
            const res = await fetchWeeklyCoach(payload);
            setData(res.data);
        } catch (e: any) {
            const msg = String(e?.message || "");
            if (msg.includes("503") || msg.toLowerCase().includes("overloaded") || msg.includes("UNAVAILABLE")) {
                setError("AI şu an yoğun. 10-20 saniye sonra tekrar dene.");
            } else {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        // transparan modal arka plan
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", paddingHorizontal: 16, }}>
            {/* modal content */}
            <View
                style={{
                    width: "100%",
                    maxWidth: 520,
                    backgroundColor: c.screenBg,
                    borderRadius: 22,
                    paddingBottom: 16,
                    maxHeight: "85%",
                    borderWidth: 1,
                    borderColor: c.surfaceBorder,
                }}
            >
                {/* header */}
                <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <Text className="text-base font-bold" style={{ color: c.text }}>
                        Haftalık AI Analiz
                    </Text>

                    <Pressable onPress={() => router.back()} style={{ padding: 10 }}>
                        <Text style={{ color: c.textMuted, fontWeight: "700" }}>Kapat</Text>
                    </Pressable>
                </View>

                <View style={{ paddingHorizontal: 16 }}>
                    <Card bg={c.surfaceBg} border={c.surfaceBorder} shadowColor={c.shadowColor}>
                        <View style={{ padding: 14, gap: 10 }}>
                            <Text className="text-sm" style={{ color: c.textMuted }}>
                                Tarih aralığı: {payload.range.start} → {payload.range.end}
                            </Text>

                            <Pressable
                                onPress={run}
                                disabled={loading}
                                style={{
                                    backgroundColor: c.accent,
                                    paddingVertical: 12,
                                    borderRadius: 14,
                                    alignItems: "center",
                                    opacity: loading ? 0.7 : 1,
                                }}
                            >
                                {loading ? (
                                    <ActivityIndicator />
                                ) : (
                                    <Text style={{ color: "white", fontWeight: "800" }}>Haftalık Analiz Al</Text>
                                )}
                            </Pressable>

                            {!data && (
                                <Text className="text-xs" style={{ color: c.textMuted }}>
                                    Butona basınca özet + uyarılar + 3 aksiyon önerisi gelecektir.
                                </Text>
                            )}
                        </View>
                    </Card>
                </View>

                <ScrollView style={{ paddingHorizontal: 16, marginTop: 12 }} showsVerticalScrollIndicator={false}>
                    {data && (
                        <View style={{ gap: 12, paddingBottom: 24 }}>
                            <Text className="text-base font-bold" style={{ color: c.text }}>
                                {data.title}
                            </Text>

                            <Card bg={c.surfaceBg} border={c.surfaceBorder} shadowColor={c.shadowColor}>
                                <View style={{ padding: 14, gap: 10 }}>
                                    <Text className="text-sm font-bold" style={{ color: c.text }}>Özet</Text>
                                    {data.insights.map((it, idx) => (
                                        <View key={`${it.label}-${idx}`} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                            <Text style={{ color: c.textMuted }}>{it.label}</Text>
                                            <Text style={{ color: c.text, fontWeight: "700" }}>{it.value}</Text>
                                        </View>
                                    ))}
                                </View>
                            </Card>

                            {data.warnings?.length > 0 && (
                                <Card bg={c.surfaceBg} border={c.surfaceBorder} shadowColor={c.shadowColor}>
                                    <View style={{ padding: 14, gap: 8 }}>
                                        <Text className="text-sm font-bold" style={{ color: c.text }}>Uyarılar</Text>
                                        {data.warnings.map((w, idx) => (
                                            <Text key={`w-${idx}`} style={{ color: c.textMuted }}>
                                                • {w.text}
                                            </Text>
                                        ))}
                                    </View>
                                </Card>
                            )}

                            <Card bg={c.surfaceBg} border={c.surfaceBorder} shadowColor={c.shadowColor}>
                                <View style={{ padding: 14, gap: 10 }}>
                                    <Text className="text-sm font-bold" style={{ color: c.text }}>Aksiyon Planı</Text>
                                    {data.actions.map((a, idx) => (
                                        <View key={`a-${idx}`} style={{ gap: 4 }}>
                                            <Text style={{ color: c.text, fontWeight: "800" }}>• {a.title}</Text>
                                            <Text style={{ color: c.textMuted, fontSize: 12 }}>Neden: {a.why}</Text>
                                            <Text style={{ color: c.textMuted, fontSize: 12 }}>Nasıl: {a.how}</Text>
                                        </View>
                                    ))}
                                </View>
                            </Card>

                            <Text style={{ color: c.textMuted, fontSize: 12 }}>
                                {data.oneLineSummary}
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </View>
        </View>
    );
}
