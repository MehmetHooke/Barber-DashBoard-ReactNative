import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, TextInput, View } from "react-native";

import { Text } from "@/components/ui/text";
import Card from "@/src/components/Card";
import { useAppTheme } from "@/src/theme/ThemeProvider";
import { colors } from "@/src/theme/colors";

import { auth } from "@/src/lib/firebase";
import { createService } from "@/src/services/services.service";
import { pickAndUploadImage } from "@/src/services/storage.service";

export default function NewService() {
  const { effectiveTheme } = useAppTheme();
  const c = colors[effectiveTheme];

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationMin, setDurationMin] = useState("30");
  const [price, setPrice] = useState("350");

  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const canSave = useMemo(() => {
    const d = Number(durationMin);
    const p = Number(price);
    return (
      name.trim().length >= 2 &&
      description.trim().length >= 4 &&
      !!imageUrl &&
      Number.isFinite(d) && d > 0 &&
      Number.isFinite(p) && p > 0
    );
  }, [name, description, durationMin, price, imageUrl]);

  async function onPickImage() {
    try {
      setUploading(true);
      const uid = auth.currentUser?.uid;
      if (!uid) {
        Alert.alert("Giriş gerekli", "Devam etmek için giriş yapmalısın.");
        return;
      }

      const fileName = `svc_${uid}_${Date.now()}.jpg`;
      const res = await pickAndUploadImage({ folder: "services", fileName });

      if (res.canceled) return;
      setImageUrl(res.downloadUrl);
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (msg.includes("MEDIA_PERMISSION_DENIED")) {
        Alert.alert("İzin gerekli", "Galeriden foto seçebilmek için izin vermelisin.");
      } else {
        Alert.alert("Hata", "Fotoğraf yüklenemedi.");
      }
    } finally {
      setUploading(false);
    }
  }

  async function onSave() {
    if (!canSave) return;

    const uid = auth.currentUser?.uid;
    if (!uid) {
      Alert.alert("Giriş gerekli", "Devam etmek için giriş yapmalısın.");
      return;
    }

    try {
      setSaving(true);

      await createService({
        shopId: "main",
        createdByBarberId: uid,
        name,
        description,
        imageUrl: imageUrl!,
        durationMin: Number(durationMin),
        price: Number(price),
      });

      Alert.alert("Başarılı", "Hizmet oluşturuldu.");
      router.back();
    } catch (e: any) {
      Alert.alert("Hata", "Hizmet oluşturulamadı.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View className="flex-1 pt-10" style={{ backgroundColor: c.screenBg }}>
      {/* Header */}
      <View className="px-4 pt-5 pb-3">
        <Text className="text-2xl font-bold" style={{ color: c.text }}>
          Yeni Hizmet
        </Text>
        <Text className="mt-1" style={{ color: c.textMuted }}>
          Ad, açıklama, süre, fiyat ve görsel ekle.
        </Text>
      </View>

      <View className="px-4 gap-4">
        {/* Image */}
        <Card bg={c.surfaceBg} border={c.surfaceBorder} shadowColor={c.shadowColor}>
          <View className="px-4 py-4">
            <Text className="text-xs font-semibold" style={{ color: c.textMuted }}>
              GÖRSEL
            </Text>

            <View className="mt-3">
              {imageUrl ? (
                <View className="overflow-hidden rounded-2xl border" style={{ borderColor: c.surfaceBorder }}>
                  <Image source={{ uri: imageUrl }} style={{ width: "100%", height: 180 }} resizeMode="cover" />
                </View>
              ) : (
                <View
                  className="rounded-2xl border items-center justify-center"
                  style={{ borderColor: c.surfaceBorder, height: 180, backgroundColor: "rgba(0,0,0,0.04)" }}
                >
                  <Text style={{ color: c.textMuted }}>Henüz görsel seçilmedi</Text>
                </View>
              )}

              <Pressable
                onPress={onPickImage}
                disabled={uploading}
                className="rounded-xl border mt-3 py-3 items-center justify-center"
                style={{
                  borderColor: uploading ? c.surfaceBorder : c.accentBorder,
                  backgroundColor: uploading ? "transparent" : c.accentSoft,
                  opacity: uploading ? 0.6 : 1,
                }}
              >
                <Text className="font-semibold" style={{ color: uploading ? c.textMuted : c.accent }}>
                  {uploading ? "Yükleniyor..." : "Galeriden Seç & Yükle"}
                </Text>
              </Pressable>
            </View>
          </View>
        </Card>

        {/* Form */}
        <Card bg={c.surfaceBg} border={c.surfaceBorder} shadowColor={c.shadowColor}>
          <View className="px-4 py-4">
            <Text className="text-xs font-semibold" style={{ color: c.textMuted }}>
              BİLGİLER
            </Text>

            <View className="mt-3 gap-3">
              <Field
                c={c}
                label="İşlem Adı"
                value={name}
                onChangeText={setName}
                placeholder="Örn: Saç Kesimi"
              />
              <Field
                c={c}
                label="Açıklama"
                value={description}
                onChangeText={setDescription}
                placeholder="Kısa açıklama"
                multiline
              />

              <View className="flex-row gap-3">
                <View style={{ flex: 1 }}>
                  <Field
                    c={c}
                    label="Süre (dk)"
                    value={durationMin}
                    onChangeText={setDurationMin}
                    placeholder="30"
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Field
                    c={c}
                    label="Fiyat (₺)"
                    value={price}
                    onChangeText={setPrice}
                    placeholder="350"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
          </View>
        </Card>

        {/* Save */}
        <Pressable disabled={!canSave || saving} onPress={onSave}>
          <View
            className="rounded-2xl py-4 items-center justify-center border"
            style={{
              backgroundColor: !canSave || saving ? "transparent" : c.accentSoft,
              borderColor: !canSave || saving ? c.surfaceBorder : c.accentBorder,
              opacity: !canSave || saving ? 0.6 : 1,
            }}
          >
            {saving ? (
              <View className="flex-row items-center">
                <ActivityIndicator />
                <Text className="ml-2 font-semibold" style={{ color: c.textMuted }}>
                  Kaydediliyor...
                </Text>
              </View>
            ) : (
              <Text className="font-semibold" style={{ color: c.accent }}>
                Hizmeti Oluştur
              </Text>
            )}
          </View>
        </Pressable>

        <View className="h-6" />
      </View>
    </View>
  );
}

function Field({
  c,
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
}: {
  c: any;
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  keyboardType?: "default" | "numeric";
  multiline?: boolean;
}) {
  return (
    <View>
      <Text className="text-xs font-semibold" style={{ color: c.textMuted }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.textMuted}
        keyboardType={keyboardType ?? "default"}
        multiline={multiline}
        style={{
          marginTop: 8,
          paddingHorizontal: 12,
          paddingVertical: multiline ? 12 : 10,
          minHeight: multiline ? 96 : 44,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: c.surfaceBorder,
          color: c.text,
          backgroundColor: "transparent",
        }}
      />
    </View>
  );
}
