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

function timeAgoTR(ms?: number | null) {
    if (!ms) return "";
    const diff = Date.now() - ms;
    const sec = Math.floor(diff / 1000);
    if (sec < 10) return "az önce";
    if (sec < 60) return `${sec} sn önce`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} dk önce`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} saat önce`;
    const day = Math.floor(hr / 24);
    return `${day} gün önce`;
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
    const [cached, setCached] = useState(false);
    const [createdAtMs, setCreatedAtMs] = useState<number | null>(null);
    type Upsell = { title?: string; detail?: string; cta?: string } | null;
    const [upsell, setUpsell] = useState<Upsell>(null);


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

    async function run(force = false) {
        setUpsell(null);
        setError(null);

        console.log("RUN CLICKED", {
            start: payload.range.start,
            end: payload.range.end,
            dailyRevenueLen: payload.dailyRevenue.length,
        });

        try {
            setLoading(true);
            console.log("BEFORE FETCH");

            const res = await fetchWeeklyCoach({ ...payload, force });

            console.log("AFTER FETCH", res);
            setData(res.data);
            setCached(!!res.cached);
            setCreatedAtMs(res.meta?.createdAtMs ?? null);
            console.log("Zaman", createdAtMs);
        } catch (e: any) {
            console.log("FETCH ERROR", e);

            // ✅ Limit dolduysa: premium kartı göster
            if (e?.code === "WEEKLY_LIMIT") {
                setError(e?.message || "Bu hafta için limit doldu.");
                setUpsell(e?.payload?.upsell ?? {
                    title: "Premium ile sınırsız analiz",
                    detail: "Premium’da haftalık limit kalkar ve analizleri istediğin zaman yenileyebilirsin.",
                    cta: "Premium’u Gör",
                });
                return;
            }

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
                                onPress={() => run(false)}
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
                                    <Text style={{ color: "white", fontWeight: "800" }}>
                                        {upsell ? "Premium ile devam et" : error ? "Tekrar Dene" : "Haftalık Analiz Al"}

                                    </Text>

                                )}
                            </Pressable>

                            {!data && (
                                <Text className="text-xs" style={{ color: c.textMuted }}>
                                    Butona basınca özet + uyarılar + 3 aksiyon önerisi gelecektir.
                                </Text>
                            )}

                            {!!error && (
                                <Text className="text-xs" style={{ color: "tomato" }}>
                                    {error}
                                </Text>
                            )}

                            {upsell && (
                                <Card bg={c.surfaceBg} border={c.surfaceBorder} shadowColor={c.shadowColor}>
                                    <View style={{ padding: 14, gap: 10 }}>
                                        <Text style={{ color: c.text, fontWeight: "800", fontSize: 14 }}>
                                            {upsell.title ?? "Premium ile sınırsız analiz"}
                                        </Text>

                                        {!!upsell.detail && (
                                            <Text style={{ color: c.textMuted, fontSize: 12, lineHeight: 16 }}>
                                                {upsell.detail}
                                            </Text>
                                        )}

                                        <Pressable
                                            onPress={() => {
                                                Alert.alert("Premium", "Premium sayfasına yönlendireceğiz (sonraki adım).");
                                            }}
                                            style={{
                                                marginTop: 4,
                                                backgroundColor: c.accent,
                                                borderRadius: 14,
                                                paddingVertical: 10,
                                                alignItems: "center",
                                            }}
                                        >
                                            <Text style={{ color: "white", fontWeight: "900" }}>
                                                {upsell.cta ?? "Premium’u Gör"}
                                            </Text>
                                        </Pressable>

                                        <Text style={{ color: c.textMuted, fontSize: 11 }}>
                                            Premium ile haftalık limit kalkar, önerileri dilediğin zaman güncellersin.
                                        </Text>
                                    </View>
                                </Card>
                            )}
                        </View>
                    </Card>
                </View>

                <ScrollView style={{ paddingHorizontal: 16, marginTop: 12 }} showsVerticalScrollIndicator={false}>
                    {data && (
                        <View style={{ gap: 12, paddingBottom: 24 }}>
                            {/* ✅ Badge row */}
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                {cached ? (
                                    <View
                                        style={{
                                            paddingHorizontal: 10,
                                            paddingVertical: 6,
                                            borderRadius: 999,
                                            backgroundColor: c.accentSoft,
                                            borderWidth: 1,
                                            borderColor: c.surfaceBorder,
                                        }}
                                    >
                                        <Text style={{ color: c.accent, fontWeight: "800", fontSize: 12 }}>
                                            🧠 Önbellekten gösteriliyor
                                        </Text>
                                    </View>
                                ) : (
                                    <View
                                        style={{
                                            paddingHorizontal: 10,
                                            paddingVertical: 6,
                                            borderRadius: 999,
                                            backgroundColor: c.surfaceBg,
                                            borderWidth: 1,
                                            borderColor: c.surfaceBorder,
                                        }}
                                    >
                                        <Text style={{ color: c.accent, fontWeight: "800", fontSize: 12 }}>
                                           ⚡ Yeni analiz
                                        </Text>
                                    </View>
                                )}

                                {!!createdAtMs && (
                                    <Text style={{ color: c.textMuted, fontSize: 12 }}>
                                        Son analiz: {timeAgoTR(createdAtMs)}
                                    </Text>
                                )}
                            </View>

                            {/* ✅ Title */}
                            <Text className="text-base font-bold" style={{ color: c.text }}>
                                {data.title}
                            </Text>

                            {/* ✅ Insights */}
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

                            {/* ✅ Warnings */}
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

                            {/* ✅ Actions */}
                            <Card bg={c.surfaceBg} border={c.surfaceBorder} shadowColor={c.surfaceBorder}>
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
                    {data && cached && (
                        <Pressable
                            onPress={() => run(true)}
                            disabled={loading}
                            style={{
                                marginTop: 8,
                                backgroundColor: c.surfaceBg,
                                borderWidth: 1,
                                borderColor: c.surfaceBorder,
                                borderRadius: 14,
                                paddingVertical: 10,
                                alignItems: "center",
                                opacity: loading ? 0.7 : 1,
                            }}
                        >
                            {loading ? (
                                <ActivityIndicator />
                            ) : (
                                <Text style={{ color: c.text, fontWeight: "800" }}>
                                    Yeniden Analiz Al
                                </Text>
                            )}
                        </Pressable>
                    )}

                </ScrollView>

            </View>
        </View>
    );
}
