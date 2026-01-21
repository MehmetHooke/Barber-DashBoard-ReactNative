import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

import { auth, db } from "@/src/lib/firebase";
import { logout } from "@/src/services/auth.service";
import type { UserDoc } from "@/src/types/user";

import { useAppAlert } from "@/src/components/AppAlertProvider";
import Card from "@/src/components/Card";
import { useAppTheme } from "@/src/theme/ThemeProvider";
import { colors } from "@/src/theme/colors";
import { doc, onSnapshot } from "firebase/firestore";

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
  textColor,
  mutedColor,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  accent: string;
  accentSoft: string;
  accentBorder: string;
  borderDefault: string;
  textColor: string;
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

export default function UserSettings() {
  const { preference, effectiveTheme, setPreference } = useAppTheme();
  const theme = effectiveTheme; // "light" | "dark"
  const c = colors[theme];

  const [profile, setProfile] = useState<UserDoc | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const { confirm, alert } = useAppAlert();

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    setLoadingProfile(true);

    const unsub = onSnapshot(
      doc(db, "users", uid),
      (snap) => {
        setProfile((snap.data() as UserDoc) ?? null);
        setLoadingProfile(false);
      },
      () => {
        setLoadingProfile(false);
      },
    );

    return () => unsub();
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
    <View className="flex-1 pt-10" style={{ backgroundColor: c.screenBg }}>
      {/* Header */}
      <View className="px-4 pt-5 pb-3">
        <Text className="text-2xl font-bold" style={{ color: c.text }}>
          Ayarlar
        </Text>
        <Text className="mt-1" style={{ color: c.textMuted }}>
          Hesap ve uygulama tercihleri
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
              className="w-12 h-12 rounded-2xl items-center justify-center mr-3 border overflow-hidden"
              style={{
                backgroundColor: c.accentSoft,
                borderColor: c.accentBorder,
              }}
            >
              {profile?.profileImage ? (
                <Image
                  source={{ uri: profile.profileImage }}
                  style={{ width: 48, height: 48 }}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="person" size={22} color={c.accent} />
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
              <View className="flex-1">
                <Text className="font-bold text-base" style={{ color: c.text }}>
                  {profile ? `${profile.name} ${profile.surname}` : "Kullanıcı"}
                </Text>
                <Text className="text-xs mt-1" style={{ color: c.textMuted }}>
                  {auth.currentUser?.email ?? ""}
                </Text>
              </View>
            )}
          </View>

          <Divider color={c.divider} insetLeft={16} />

          <Row
            icon="call-outline"
            title="Telefon"
            subtitle={profile?.phone ?? "—"}
            onPress={() => router.push("/(user)/changePhone")}
            textColor={c.text}
            mutedColor={c.textMuted}
            dividerColor={c.divider}
            accent={c.accent}
            accentSoft={c.accentSoft}
          />
          <Row
            icon="create-outline"
            title="Profili Düzenle"
            subtitle="Ad, telefon ve diğer bilgileri güncelle"
            onPress={() => router.push("/(user)/editProfile")}
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
                textColor={c.text}
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
                textColor={c.text}
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
                textColor={c.text}
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
            onPress={() => router.push("/(user)/support")}
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
            onPress={() => router.push("/(user)/about")}
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
  );
}
