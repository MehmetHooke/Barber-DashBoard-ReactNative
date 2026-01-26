import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, ImageBackground, Pressable, ScrollView, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

import { auth } from "@/src/lib/firebase";
import { logout } from "@/src/services/auth.service";

import { useAppAlert } from "@/src/components/AppAlertProvider";
import Card from "@/src/components/Card";
import { BarberDoc } from "@/src/services/barbers.service";
import { getBarberDoc } from "@/src/services/barbersSettings.service";
import { useAppTheme } from "@/src/theme/ThemeProvider";
import { colors } from "@/src/theme/colors";

type ThemePreference = "system" | "light" | "dark";

function SectionTitle({ title, color }: { title: string; color: string }) {
  return (
    <View className="mt-4 mb-2 px-1">
      <Text className="text-xs font-semibold" style={{ color }}>
        {title}
      </Text>
    </View>
  );
}

function Divider({
  color,
  insetLeft = 16,
}: {
  color: string;
  insetLeft?: number;
}) {
  return (
    <View
      style={{ height: 1, marginLeft: insetLeft, backgroundColor: color }}
    />
  );
}

function Row({
  icon,
  title,
  subtitle,
  onPress,
  textColor,
  mutedColor,
  dividerColor,
  accent,
  accentSoft,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  textColor: string;
  mutedColor: string;
  dividerColor: string;
  accent: string;
  accentSoft: string;
}) {
  const content = (
    <View className="px-4 py-3 flex-row items-center justify-between">
      <View className="flex-row items-center flex-1">
        <View
          className="w-10 h-10 rounded-xl items-center justify-center mr-3"
          style={{ backgroundColor: accentSoft }}
        >
          <Ionicons name={icon} size={18} color={accent} />
        </View>

        <View className="flex-1">
          <Text className="font-semibold" style={{ color: textColor }}>
            {title}
          </Text>
          {subtitle ? (
            <Text
              className="text-xs mt-1"
              style={{ color: mutedColor }}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color={mutedColor} />
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress}>
      {content}
      <Divider color={dividerColor} insetLeft={64} />
    </Pressable>
  );
}

function ThemePill({
  label,
  selected,
  onPress,
  accent,
  accentSoft,
  accentBorder,
  borderDefault,
  mutedColor,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  accent: string;
  accentSoft: string;
  accentBorder: string;
  borderDefault: string;
  mutedColor: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="px-3 h-9 rounded-xl items-center justify-center border"
      style={{
        backgroundColor: selected ? accentSoft : "transparent",
        borderColor: selected ? accentBorder : borderDefault,
      }}
    >
      <Text
        className="font-semibold"
        style={{ color: selected ? accent : mutedColor }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function BarberSettings() {
  const { preference, effectiveTheme, setPreference } = useAppTheme();
  const theme = effectiveTheme; // "light" | "dark"
  const c = colors[theme];

  const BG_BY_THEME = {
    light: require("@/src/assets/images/theme/settingsLight.png"),
    dark: require("@/src/assets/images/theme/settingsDark.png"),
  } as const;

  const [profile, setProfile] = useState<BarberDoc | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const { confirm, alert } = useAppAlert();

  const hasImage = profile?.imageUrl && profile?.imageUrl.trim().length > 0;

  useEffect(() => {
    (async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        const data = await getBarberDoc(uid);
        setProfile(data);
      } finally {
        setLoadingProfile(false);
      }
    })();
  }, []);

  const themeSubtitle = useMemo(() => {
    const map: Record<ThemePreference, string> = {
      system: `Sistem (${theme === "dark" ? "Koyu" : "Açık"})`,
      dark: "Koyu",
      light: "Açık",
    };
    return map[preference as ThemePreference];
  }, [preference, theme]);

  async function onLogout() {
    confirm({
      title: "Çıkış Yap",
      message: "Hesabından çıkmak istiyor musun?",
      cancelText: "İptal",
      confirmText: "Çıkış Yap",
      destructive: true,
      onConfirm: async () => {
        try {
          setLogoutLoading(true);
          await logout();
          router.replace("/(auth)/login");
        } catch {
          alert("Hata", "Çıkış yapılamadı.");
        } finally {
          setLogoutLoading(false);
        }
      },
    });
  }

  return (
    <ImageBackground
      source={BG_BY_THEME[effectiveTheme]}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: 10,
          paddingHorizontal: 16,
          paddingBottom: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 pt-10" >
          {/* Header */}
          <View className="px-3 pt-10 pb-3">
            <Text className="text-2xl font-bold" style={{ color: c.text }}>
              Ayarlar
            </Text>
            <Text className="mt-1" style={{ color: c.textMuted }}>
              İşletme ve uygulama tercihleri
            </Text>
          </View>

          <View className="px-4 flex-1">
            {/* Account */}
            <SectionTitle title="HESAP" color={c.textMuted} />
            <Card
              bg={c.surfaceBg}
              border={c.surfaceBorder}
              shadowColor={c.shadowColor}
            >
              <View className="px-4 py-4 flex-row items-center">
                <View
                  className="w-28 h-28 rounded-2xl items-center justify-center mr-3 border"
                  style={{
                    backgroundColor: c.accentSoft,
                    borderColor: c.accentBorder,
                  }}
                >
                  {hasImage ? (
                    <Image
                      source={{ uri: profile.imageUrl }}
                      style={{ width: 112, height: 112, borderRadius: 10 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Ionicons name="cut-outline" size={22} color={c.accent} />
                  )}
                </View>

                {loadingProfile ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator />
                    <Text className="ml-2" style={{ color: c.textMuted }}>
                      Profil yükleniyor...
                    </Text>
                  </View>
                ) : (
                  <View className="flex-1 pl-5">
                    <Text
                      className="font-bold  text-base"
                      style={{ color: c.text }}
                    >
                      {profile ? `${profile.name}` : "Berber"}
                    </Text>
                    <Text className="text-xs mt-1" style={{ color: c.textMuted }}>
                      {auth.currentUser?.email ?? ""}
                    </Text>
                  </View>
                )}
              </View>

              <Divider color={c.divider} insetLeft={16} />

              <Row
                icon="time-outline"
                title="Çalışma Saatleri"
                subtitle="Açılış/kapanış ve slot aralığı"
                onPress={() => router.push("/(barber)/(tabs)/working-hours")}
                textColor={c.text}
                mutedColor={c.textMuted}
                dividerColor={c.divider}
                accent={c.accent}
                accentSoft={c.accentSoft}
              />

              <Row
                icon="create-outline"
                title="Profili Düzenle"
                subtitle="İsim, telefon ve diğer bilgileri güncelle"
                onPress={() => router.push("/(barber)/editProfile")}
                textColor={c.text}
                mutedColor={c.textMuted}
                dividerColor={c.divider}
                accent={c.accent}
                accentSoft={c.accentSoft}
              />
            </Card>

            {/* Appearance */}
            <SectionTitle title="GÖRÜNÜM" color={c.textMuted} />
            <Card
              bg={c.surfaceBg}
              border={c.surfaceBorder}
              shadowColor={c.shadowColor}
            >
              <View className="px-4 py-4">
                <View className="flex-row items-center">
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: c.accentSoft }}
                  >
                    <Ionicons
                      name="color-palette-outline"
                      size={18}
                      color={c.accent}
                    />
                  </View>

                  <View className="flex-1">
                    <Text className="font-semibold" style={{ color: c.text }}>
                      Tema
                    </Text>
                    <Text className="text-xs mt-1" style={{ color: c.textMuted }}>
                      {themeSubtitle}
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-2 mt-3">
                  <ThemePill
                    label="Sistem"
                    selected={preference === "system"}
                    onPress={() => setPreference("system")}
                    accent={c.accent}
                    accentSoft={c.accentSoft}
                    accentBorder={c.accentBorder}
                    borderDefault={c.surfaceBorder}
                    mutedColor={c.textMuted}
                  />
                  <ThemePill
                    label="Açık"
                    selected={preference === "light"}
                    onPress={() => setPreference("light")}
                    accent={c.accent}
                    accentSoft={c.accentSoft}
                    accentBorder={c.accentBorder}
                    borderDefault={c.surfaceBorder}
                    mutedColor={c.textMuted}
                  />
                  <ThemePill
                    label="Koyu"
                    selected={preference === "dark"}
                    onPress={() => setPreference("dark")}
                    accent={c.accent}
                    accentSoft={c.accentSoft}
                    accentBorder={c.accentBorder}
                    borderDefault={c.surfaceBorder}
                    mutedColor={c.textMuted}
                  />
                </View>
              </View>
            </Card>

            {/* Other */}
            <SectionTitle title="DİĞER" color={c.textMuted} />
            <Card
              bg={c.surfaceBg}
              border={c.surfaceBorder}
              shadowColor={c.shadowColor}
            >
              <Row
                icon="help-circle-outline"
                title="Destek"
                subtitle="Sorun bildir / iletişim"
                onPress={() => router.push("/(barber)/support")}
                textColor={c.text}
                mutedColor={c.textMuted}
                dividerColor={c.divider}
                accent={c.accent}
                accentSoft={c.accentSoft}
              />
              <Row
                icon="information-circle-outline"
                title="Hakkında"
                subtitle="Sürüm, lisans, bilgiler"
                onPress={() => router.push("/(barber)/about")}
                textColor={c.text}
                mutedColor={c.textMuted}
                dividerColor={c.divider}
                accent={c.accent}
                accentSoft={c.accentSoft}
              />
            </Card>

            {/* Logout */}
            <View className="mt-5">
              <Button
                style={{
                  backgroundColor: c.accentSoft,
                  borderColor: c.accentBorder,
                }}
                variant="outline"
                className="rounded-xl"
                onPress={onLogout}
                isDisabled={logoutLoading}
              >
                <Text className="font-semibold" style={{ color: c.text }}>
                  {logoutLoading ? "Çıkış yapılıyor..." : "Çıkış Yap"}
                </Text>
              </Button>
            </View>

            <View className="h-6" />
          </View>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}
