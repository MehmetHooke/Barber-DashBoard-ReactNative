import { Text } from "@/components/ui/text";
import Card from "@/src/components/Card";
import { useAppTheme } from "@/src/theme/ThemeProvider";
import { colors } from "@/src/theme/colors";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";

import { useAppAlert } from "@/src/components/AppAlertProvider";
import { auth } from "@/src/lib/firebase";
import {
  checkBarberAvailability,
  createAppointment,
} from "@/src/services/appointment.service";
import { getBarberById } from "@/src/services/barbers.service";
import {
  getServiceById,
  type ServiceDoc,
} from "@/src/services/services.service";
import { getUserDoc } from "@/src/services/user.service";

type BarberDocLite = {
  id: string;
  name: string;
  imageUrl?: string;
  shopId?: string;
};

function formatDateTimeTR(d: Date) {
  const months = [
    "Ocak",
    "Şubat",
    "Mart",
    "Nisan",
    "Mayıs",
    "Haziran",
    "Temmuz",
    "Ağustos",
    "Eylül",
    "Ekim",
    "Kasım",
    "Aralık",
  ];
  const days = [
    "Pazar",
    "Pazartesi",
    "Salı",
    "Çarşamba",
    "Perşembe",
    "Cuma",
    "Cumartesi",
  ];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const dow = days[d.getDay()];
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${day} ${month} ${dow} • ${hh}:${mm}`;
}

export default function Confirm() {
  const router = useRouter();
  const { effectiveTheme } = useAppTheme();
  const c = colors[effectiveTheme];

  const params = useLocalSearchParams<{
    serviceId?: string;
    barberId?: string;
    startAt?: string;
    endAt?: string;
  }>();

  const serviceId =
    typeof params.serviceId === "string" ? params.serviceId : undefined;
  const barberId =
    typeof params.barberId === "string" ? params.barberId : undefined;
  const startAtISO =
    typeof params.startAt === "string" ? params.startAt : undefined;
  const endAtISO = typeof params.endAt === "string" ? params.endAt : undefined;

  const startAt = startAtISO ? new Date(startAtISO) : null;
  const endAt = endAtISO ? new Date(endAtISO) : null;

  const [service, setService] = useState<ServiceDoc | null>(null);
  const [barber, setBarber] = useState<BarberDocLite | null>(null);
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [user, setUser] = useState<{ name: string; surname: string } | null>(
    null,
  );

  // ✅ Firestore’dan service + barber çek
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        if (!serviceId || !barberId) {
          setService(null);
          setBarber(null);
          setUser(null);
          return;
        }
        const uid = auth.currentUser?.uid;

        const [svc, brb, userDoc] = await Promise.all([
          getServiceById(serviceId),
          getBarberById(barberId),
          uid ? getUserDoc(uid) : Promise.resolve(null),
        ]);

        setService(svc);

        // getBarberById senin serviste BarberDoc döndürüyor olabilir
        // burada minimal shape’e çeviriyoruz:
        setBarber(
          brb
            ? {
                id: barberId,
                name: (brb as any).name ?? "Berber",
                imageUrl: (brb as any).imageUrl ?? "",
                shopId: (brb as any).shopId ?? "main",
              }
            : null,
        );

        setUser(
          userDoc
            ? { name: userDoc.name ?? "", surname: userDoc.surname ?? "" }
            : null,
        );
      } catch (e: any) {
        alert("Hata", "Randevu bilgileri yüklenemedi.");
        setService(null);
        setBarber(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [serviceId, barberId]);

  // ✅ Valid kontrol: id’ler + time + doc’lar
  const invalid = useMemo(() => {
    return (
      !serviceId ||
      !barberId ||
      !startAt ||
      !endAt ||
      !service ||
      !barber ||
      !user
    );
  }, [serviceId, barberId, startAt, endAt, service, barber, user]);

  const { alert, confirm } = useAppAlert();

  async function onConfirm() {
    if (invalid) {
      alert("Hata", "Eksik bilgi var. Lütfen tekrar deneyin.");
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) {
      alert("Giriş gerekli", "Randevu almak için giriş yapmalısın.");
      router.replace("/(auth)/login");
      return;
    }

    try {
      setSaving(true);

      const shopId = barber?.shopId ?? "main";

      const ok = await checkBarberAvailability({
        shopId,
        barberId: barberId!,
        startAt: startAt!,
        endAt: endAt!,
      });

      if (!ok.available) {
        alert("Dolu saat", "Seçtiğin saat dolmuş. Lütfen başka bir saat seç.");
        router.back();
        return;
      }

      const result = await createAppointment({
        shopId,
        userId: uid,
        barberId: barberId!,
        serviceId: serviceId!,
        serviceSnapshot: {
          name: service!.name,
          description: service!.description,
          durationMin: service!.durationMin,
          price: service!.price,
          imageUrl: service!.imageUrl,
        },
        barberSnapshot: {
          name: barber!.name,
          imageUrl: barber!.imageUrl,
        },
        userSnapshot: { name: user!.name, surname: user!.surname },
        startAt: startAt!,
        endAt: endAt!,
        status: "PENDING",
      });

      // ✅ Başarı: kendi alert’in
      alert("Başarılı", "Randevun oluşturuldu.", [
        {
          text: "Tamam",
          onPress: () => {
            // ✅ Akışı temiz başlat: book root’a dön (param yok)
            router.replace({ pathname: "/(user)/(tabs)/book", params: {} });

            // Eğer direkt ana sayfaya dönmek istiyorsan:
            // router.replace("/(user)");
          },
        },
      ]);
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (msg.includes("requires an index") || msg.includes("index")) {
        alert(
          "Firestore Index Gerekli",
          "Bu sorgu için index gerekiyor. Firebase Console’dan index oluşturup tamamlanmasını beklemelisin.",
        );
      } else {
        alert("Hata", "Randevu oluşturulamadı. Tekrar deneyin.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: c.screenBg }}
      >
        <ActivityIndicator />
        <Text className="mt-2" style={{ color: c.textMuted }}>
          Bilgiler yükleniyor...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 pt-10" style={{ backgroundColor: c.screenBg }}>
      {/* Header */}
      <View className="px-4 pt-5 pb-3">
        <Text className="text-2xl font-bold" style={{ color: c.text }}>
          Onayla
        </Text>
        <Text className="mt-1" style={{ color: c.textMuted }}>
          Randevu bilgilerini kontrol et ve oluştur.
        </Text>
      </View>

      <View className="px-4 gap-4">
        {/* Summary */}
        <Card
          bg={c.surfaceBg}
          border={c.surfaceBorder}
          shadowColor={c.shadowColor}
        >
          <View className="px-4 py-4">
            <Text
              className="text-xs font-semibold"
              style={{ color: c.textMuted }}
            >
              ÖZET
            </Text>

            <View className="mt-3">
              <Text className="text-sm" style={{ color: c.textMuted }}>
                Hizmet
              </Text>
              <Text
                className="text-base font-bold mt-1"
                style={{ color: c.text }}
              >
                {service?.name ?? "—"}
              </Text>
              {service ? (
                <Text className="text-xs mt-1" style={{ color: c.textMuted }}>
                  {service.durationMin} dk • {service.price} ₺
                </Text>
              ) : null}
            </View>

            <View className="mt-4">
              <Text className="text-sm" style={{ color: c.textMuted }}>
                Berber
              </Text>
              <Text
                className="text-base font-bold mt-1"
                style={{ color: c.text }}
              >
                {barber?.name ?? "—"}
              </Text>
            </View>

            <View className="mt-4">
              <Text className="text-sm" style={{ color: c.textMuted }}>
                Tarih & Saat
              </Text>
              <Text
                className="text-base font-bold mt-1"
                style={{ color: c.text }}
              >
                {startAt ? formatDateTimeTR(startAt) : "—"}
              </Text>
            </View>
          </View>
        </Card>

        {/* Info */}
        <Card
          bg={c.surfaceBg}
          border={c.surfaceBorder}
          shadowColor={c.shadowColor}
        >
          <View className="px-4 py-4">
            <Text
              className="text-xs font-semibold"
              style={{ color: c.textMuted }}
            >
              BİLGİ
            </Text>
            <Text className="text-sm mt-2" style={{ color: c.textMuted }}>
              Randevun oluşturulduktan sonra durum “Beklemede” olarak
              görünebilir. Berber onayladığında “Onaylandı” olur.
            </Text>
          </View>
        </Card>

        {/* Actions */}
        <View className="gap-3 mt-1">
          <Pressable disabled={saving || invalid} onPress={onConfirm}>
            <View
              className="rounded-2xl py-4 items-center justify-center border"
              style={{
                backgroundColor:
                  saving || invalid ? "transparent" : c.accentSoft,
                borderColor:
                  saving || invalid ? c.surfaceBorder : c.accentBorder,
                opacity: saving || invalid ? 0.6 : 1,
              }}
            >
              <Text
                className="font-semibold"
                style={{ color: saving || invalid ? c.textMuted : c.accent }}
              >
                {saving ? "Oluşturuluyor..." : "Randevuyu Oluştur"}
              </Text>
            </View>
          </Pressable>

          <Pressable
            disabled={saving}
            onPress={() => router.replace("/(user)/(tabs)")}
          >
            <View
              className="rounded-2xl py-4 items-center justify-center border"
              style={{
                backgroundColor: "transparent",
                borderColor: c.surfaceBorder,
              }}
            >
              <Text className="font-semibold" style={{ color: c.text }}>
                Geri Dön
              </Text>
            </View>
          </Pressable>

          {invalid ? (
            <Text className="text-xs" style={{ color: c.textMuted }}>
              Eksik seçim var. Lütfen geri dönüp seçimleri tamamla.
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}
