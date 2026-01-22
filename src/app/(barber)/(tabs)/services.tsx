import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  TextInput,
  View,
} from "react-native";

import { Text } from "@/components/ui/text";
import Card from "@/src/components/Card";
import { useAppTheme } from "@/src/theme/ThemeProvider";
import { colors } from "@/src/theme/colors";

import { auth } from "@/src/lib/firebase";
import {
  createService,
  getActiveServices,
  ServiceDoc,
  updateService,
} from "@/src/services/services.service";
import { pickAndUploadImage } from "@/src/services/storage.service";

type Draft = {
  name: string;
  description: string;
  durationMin: string; // input string
  price: string; // input string
  imageUrl: string | null;
};

const SHOP_ID = "main";

export default function ServicesManage() {
  const { effectiveTheme } = useAppTheme();
  const c = colors[effectiveTheme];

  const [services, setServices] = useState<ServiceDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Accordion kontrolü
  const [openKey, setOpenKey] = useState<string | null>(null); // "new" veya serviceId

  // NEW draft
  const [newDraft, setNewDraft] = useState<Draft>({
    name: "",
    description: "",
    durationMin: "30",
    price: "350",
    imageUrl: null,
  });

  // EXISTING drafts (serviceId -> Draft)
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [uploadingKey, setUploadingKey] = useState<string | null>(null); // "new" | serviceId | null
  const [savingKey, setSavingKey] = useState<string | null>(null); // "new" | serviceId | null

  async function load() {
    try {
      const list = await getActiveServices(SHOP_ID);
      setServices(list);
    } catch (e) {
      Alert.alert("Hata", "Hizmetler yüklenemedi.");
    }
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function toggle(key: string) {
    setOpenKey((prev) => (prev === key ? null : key));
    // mevcut hizmet card’ı açılınca draft init
    if (key !== "new") {
      const svc = services.find((s) => s.id === key);
      if (!svc) return;

      setDrafts((prev) => {
        if (prev[key]) return prev; // zaten var, ezme
        return {
          ...prev,
          [key]: {
            name: svc.name ?? "",
            description: svc.description ?? "",
            durationMin: String(svc.durationMin ?? ""),
            price: String(svc.price ?? ""),
            imageUrl: svc.imageUrl ?? null,
          },
        };
      });
    }
  }

  function SectionTitle({
    c,
    title,
    subtitle,
  }: {
    c: any;
    title: string;
    subtitle?: string;
  }) {
    return (
      <View className="px-1 mt-1">
        <Text className="text-lg font-semibold" style={{ color: c.text }}>
          {title}
        </Text>
        {!!subtitle && (
          <Text className="mt-1 text-sm" style={{ color: c.textMuted }}>
            {subtitle}
          </Text>
        )}
      </View>
    );
  }

  function validDraft(d: Draft) {
    const dur = Number(d.durationMin);
    const pr = Number(d.price);
    return (
      d.name.trim().length >= 2 &&
      d.description.trim().length >= 4 &&
      !!d.imageUrl &&
      Number.isFinite(dur) &&
      dur > 0 &&
      Number.isFinite(pr) &&
      pr > 0
    );
  }

  const canCreate = useMemo(() => validDraft(newDraft), [newDraft]);

  function isChanged(service: ServiceDoc, d: Draft) {
    const dur = Number(d.durationMin);
    const pr = Number(d.price);

    return (
      service.name !== d.name.trim() ||
      service.description !== d.description.trim() ||
      service.imageUrl !== (d.imageUrl ?? "") ||
      service.durationMin !== dur ||
      service.price !== pr
    );
  }

  async function pickImageFor(key: "new" | string) {
    try {
      setUploadingKey(key);

      const uid = auth.currentUser?.uid;
      if (!uid) {
        Alert.alert("Giriş gerekli", "Devam etmek için giriş yapmalısın.");
        return;
      }

      const fileName = `svc_${uid}_${key}_${Date.now()}.jpg`;
      const res = await pickAndUploadImage({ folder: "services", fileName });
      if (res.canceled) return;

      if (key === "new") {
        setNewDraft((p) => ({ ...p, imageUrl: res.downloadUrl }));
      } else {
        setDrafts((p) => ({
          ...p,
          [key]: { ...(p[key] ?? emptyDraft()), imageUrl: res.downloadUrl },
        }));
      }
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (msg.includes("MEDIA_PERMISSION_DENIED")) {
        Alert.alert(
          "İzin gerekli",
          "Galeriden foto seçebilmek için izin vermelisin.",
        );
      } else {
        Alert.alert("Hata", "Fotoğraf yüklenemedi.");
      }
    } finally {
      setUploadingKey(null);
    }
  }

  async function onCreate() {
    if (!canCreate) return;

    const uid = auth.currentUser?.uid;
    if (!uid) {
      Alert.alert("Giriş gerekli", "Devam etmek için giriş yapmalısın.");
      return;
    }

    try {
      setSavingKey("new");

      await createService({
        shopId: SHOP_ID,
        createdByBarberId: uid,
        name: newDraft.name,
        description: newDraft.description,
        imageUrl: newDraft.imageUrl!,
        durationMin: Number(newDraft.durationMin),
        price: Number(newDraft.price),
      });

      Alert.alert("Başarılı", "Hizmet oluşturuldu.");

      // reset + listeyi yenile
      setNewDraft({
        name: "",
        description: "",
        durationMin: "30",
        price: "350",
        imageUrl: null,
      });
      setOpenKey(null);
      await load();
    } catch (e) {
      Alert.alert("Hata", "Hizmet oluşturulamadı.");
    } finally {
      setSavingKey(null);
    }
  }

  async function onUpdate(service: ServiceDoc) {
    const d = drafts[service.id];
    if (!d) return;

    const changed = isChanged(service, d);
    const canUpdate = changed && validDraft(d);
    if (!canUpdate) return;

    try {
      setSavingKey(service.id);

      await updateService(service.id, {
        name: d.name,
        description: d.description,
        imageUrl: d.imageUrl!,
        durationMin: Number(d.durationMin),
        price: Number(d.price),
      });

      Alert.alert("Başarılı", "Hizmet güncellendi.");

      // listeyi yenile (ve draft’ı da yeni data ile güncelle)
      await load();
    } catch (e) {
      Alert.alert("Hata", "Hizmet güncellenemedi.");
    } finally {
      setSavingKey(null);
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
          Yükleniyor...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 pt-10" style={{ backgroundColor: c.screenBg }}>
      {/* Header */}
      <View className="px-4 pt-10 pb-3">
        <Text className="text-2xl font-bold" style={{ color: c.text }}>
          Hizmetler
        </Text>
        <Text className="mt-1" style={{ color: c.textMuted }}>
          Yeni hizmet ekle, mevcut hizmetleri düzenle.
        </Text>
      </View>
      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 24,
          gap: 12,
        }}
        ListEmptyComponent={
          <Card
            bg={c.surfaceBg}
            border={c.surfaceBorder}
            shadowColor={c.shadowColor}
          >
            <View className="px-4 py-4">
              <Text className="font-semibold" style={{ color: c.text }}>
                Henüz mevcut hizmet yok
              </Text>
              <Text className="mt-1" style={{ color: c.textMuted }}>
                Yukarıdan yeni hizmet ekleyebilirsin.
              </Text>
            </View>
          </Card>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View className="gap-4">
            {/* ✅ Bölüm 1: Yeni Hizmet Ekle */}
            <SectionTitle
              c={c}
              title="Yeni Hizmet Ekle"
              subtitle="Yeni bir hizmet oluşturmak için aşağıdan ekle."
            />

            <AccordionCard
              c={c}
              title="Hizmet Oluştur"
              subtitle="Yeni bir hizmet ekle"
              open={openKey === "new"}
              onToggle={() => toggle("new")}
            >
              <ServiceForm
                c={c}
                draft={newDraft}
                setDraft={setNewDraft}
                imageUploading={uploadingKey === "new"}
                onPickImage={() => pickImageFor("new")}
              />

              <Pressable
                disabled={!canCreate || savingKey === "new"}
                onPress={onCreate}
              >
                <View
                  className="rounded-2xl py-4 items-center justify-center border mt-3"
                  style={{
                    backgroundColor:
                      !canCreate || savingKey === "new"
                        ? "transparent"
                        : c.accentSoft,
                    borderColor:
                      !canCreate || savingKey === "new"
                        ? c.surfaceBorder
                        : c.accentBorder,
                    opacity: !canCreate || savingKey === "new" ? 0.6 : 1,
                  }}
                >
                  {savingKey === "new" ? (
                    <View className="flex-row items-center">
                      <ActivityIndicator />
                      <Text
                        className="ml-2 font-semibold"
                        style={{ color: c.textMuted }}
                      >
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

              <View className="h-2" />
            </AccordionCard>

            {/* ✅ Ayırıcı çizgi + Bölüm 2 başlığı */}
            <View
              className="h-px"
              style={{ backgroundColor: c.surfaceBorder }}
            />

            <SectionTitle
              c={c}
              title="Mevcut Hizmetler"
              subtitle="Düzenlemek için bir hizmete dokun."
            />

            {/* küçük boşluk */}
            <View className="h-1" />
          </View>
        }
        renderItem={({ item }) => {
          const d = drafts[item.id];
          const open = openKey === item.id;

          const changed = d ? isChanged(item, d) : false;
          const canUpdate = d ? changed && validDraft(d) : false;

          return (
            <>
              <AccordionCard
                c={c}
                title={item.name}
                subtitle={`${item.durationMin} dk • ${item.price} ₺`}
                open={open}
                onToggle={() => toggle(item.id)}
              >
                {/* draft yoksa ilk açılışta init ediliyor; ama güvenli olsun diye fallback */}
                <ServiceForm
                  c={c}
                  draft={
                    d ?? {
                      name: item.name,
                      description: item.description,
                      durationMin: String(item.durationMin),
                      price: String(item.price),
                      imageUrl: item.imageUrl ?? null,
                    }
                  }
                  setDraft={(updater: React.SetStateAction<Draft>) =>
                    setDrafts((prev) => {
                      const current = prev[item.id] ?? {
                        name: item.name,
                        description: item.description,
                        durationMin: String(item.durationMin),
                        price: String(item.price),
                        imageUrl: item.imageUrl ?? null,
                      };

                      const next =
                        typeof updater === "function"
                          ? updater(current)
                          : updater;

                      return { ...prev, [item.id]: next };
                    })
                  }
                  imageUploading={uploadingKey === item.id}
                  onPickImage={() => pickImageFor(item.id)}
                  placeholders={{
                    name: item.name,
                    description: item.description,
                    durationMin: String(item.durationMin),
                    price: String(item.price),
                  }}
                />

                <Pressable
                  disabled={!canUpdate || savingKey === item.id}
                  onPress={() => onUpdate(item)}
                >
                  <View
                    className="rounded-2xl py-4 items-center justify-center border mt-3"
                    style={{
                      backgroundColor:
                        !canUpdate || savingKey === item.id
                          ? "transparent"
                          : c.accentSoft,
                      borderColor:
                        !canUpdate || savingKey === item.id
                          ? c.surfaceBorder
                          : c.accentBorder,
                      opacity: !canUpdate || savingKey === item.id ? 0.6 : 1,
                    }}
                  >
                    {savingKey === item.id ? (
                      <View className="flex-row items-center">
                        <ActivityIndicator />
                        <Text
                          className="ml-2 font-semibold"
                          style={{ color: c.textMuted }}
                        >
                          Güncelleniyor...
                        </Text>
                      </View>
                    ) : (
                      <Text
                        className="font-semibold"
                        style={{ color: c.accent }}
                      >
                        Hizmeti Güncelle
                      </Text>
                    )}
                  </View>
                </Pressable>

                {!changed ? (
                  <Text className="mt-2 text-xs" style={{ color: c.textMuted }}>
                    Değişiklik yok.
                  </Text>
                ) : !canUpdate ? (
                  <Text className="mt-2 text-xs" style={{ color: c.textMuted }}>
                    Güncellemek için alanları geçerli doldur (görsel dahil).
                  </Text>
                ) : null}

                <View className="h-2" />
              </AccordionCard>
            </>
          );
        }}
        ItemSeparatorComponent={() => <View className="h-0" />}
      />
    </View>
  );
}

function emptyDraft(): Draft {
  return {
    name: "",
    description: "",
    durationMin: "",
    price: "",
    imageUrl: null,
  };
}

function AccordionCard({
  c,
  title,
  subtitle,
  open,
  onToggle,
  children,
}: {
  c: any;
  title: string;
  subtitle?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card bg={c.surfaceBg} border={c.surfaceBorder} shadowColor={c.shadowColor}>
      <Pressable onPress={onToggle}>
        <View className="px-4 py-4 flex-row items-center justify-between">
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text
              className="text-base font-bold"
              style={{ color: c.text }}
              numberOfLines={1}
            >
              {title}
            </Text>
            {!!subtitle && (
              <Text
                className="mt-1 text-xs"
                style={{ color: c.textMuted }}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            )}
          </View>

          <Text className="text-sm font-semibold" style={{ color: c.accent }}>
            {open ? "Kapat" : "Aç"}
          </Text>
        </View>
      </Pressable>

      {open ? <View className="px-4 pb-4">{children}</View> : null}
    </Card>
  );
}

function ServiceForm({
  c,
  draft,
  setDraft,
  onPickImage,
  imageUploading,
  placeholders,
}: {
  c: any;
  draft: Draft;
  setDraft:
    | React.Dispatch<React.SetStateAction<Draft>>
    | ((updater: any) => void);
  onPickImage: () => void;
  imageUploading: boolean;
  placeholders?: Partial<Record<keyof Omit<Draft, "imageUrl">, string>>;
}) {
  return (
    <View className="gap-4">
      {/* Image */}
      <View>
        <Text className="text-xs font-semibold" style={{ color: c.textMuted }}>
          GÖRSEL
        </Text>

        <View className="mt-3">
          {draft.imageUrl ? (
            <View
              className="overflow-hidden rounded-2xl border"
              style={{ borderColor: c.surfaceBorder }}
            >
              <Image
                source={{ uri: draft.imageUrl }}
                style={{ width: "100%", height: 180 }}
                resizeMode="cover"
              />
            </View>
          ) : (
            <View
              className="rounded-2xl border items-center justify-center"
              style={{
                borderColor: c.surfaceBorder,
                height: 180,
                backgroundColor: "rgba(0,0,0,0.04)",
              }}
            >
              <Text style={{ color: c.textMuted }}>Henüz görsel seçilmedi</Text>
            </View>
          )}

          <Pressable
            onPress={onPickImage}
            disabled={imageUploading}
            className="rounded-xl border mt-3 py-3 items-center justify-center"
            style={{
              borderColor: imageUploading ? c.surfaceBorder : c.accentBorder,
              backgroundColor: imageUploading ? "transparent" : c.accentSoft,
              opacity: imageUploading ? 0.6 : 1,
            }}
          >
            <Text
              className="font-semibold"
              style={{ color: imageUploading ? c.textMuted : c.accent }}
            >
              {imageUploading ? "Yükleniyor..." : "Galeriden Seç & Yükle"}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Fields */}
      <View>
        <Text className="text-xs font-semibold" style={{ color: c.textMuted }}>
          BİLGİLER
        </Text>

        <View className="mt-3 gap-3">
          <Field
            c={c}
            label="İşlem Adı"
            value={draft.name}
            onChangeText={(t) =>
              (setDraft as any)((p: Draft) => ({ ...p, name: t }))
            }
            placeholder={placeholders?.name ?? "Örn: Saç Kesimi"}
          />
          <Field
            c={c}
            label="Açıklama"
            value={draft.description}
            onChangeText={(t) =>
              (setDraft as any)((p: Draft) => ({ ...p, description: t }))
            }
            placeholder={placeholders?.description ?? "Kısa açıklama"}
            multiline
          />

          <View className="flex-row gap-3">
            <View style={{ flex: 1 }}>
              <Field
                c={c}
                label="Süre (dk)"
                value={draft.durationMin}
                onChangeText={(t) =>
                  (setDraft as any)((p: Draft) => ({ ...p, durationMin: t }))
                }
                placeholder={placeholders?.durationMin ?? "30"}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                c={c}
                label="Fiyat (₺)"
                value={draft.price}
                onChangeText={(t) =>
                  (setDraft as any)((p: Draft) => ({ ...p, price: t }))
                }
                placeholder={placeholders?.price ?? "350"}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
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
