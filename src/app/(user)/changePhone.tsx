import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    View,
} from "react-native";

import { Button } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import Card from "@/src/components/Card";

import {
    getMyUserDoc,
    updateMyPhone,
} from "@/src/services/userSettings.service";
import { colors } from "@/src/theme/colors";
import { useAppTheme } from "@/src/theme/ThemeProvider";

export default function ChangePhone() {
  const { effectiveTheme } = useAppTheme();
  const c = colors[effectiveTheme];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [currentPhone, setCurrentPhone] = useState("");
  const [phone, setPhone] = useState("");

  const slide = useRef(new Animated.Value(0)).current; // 0->1
  const translateY = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [420, 0],
  });

  useEffect(() => {
    Animated.timing(slide, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();

    (async () => {
      try {
        const doc = await getMyUserDoc();
        const p = doc?.phone ?? "";
        setCurrentPhone(p);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function close() {
    Animated.timing(slide, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      router.back();
    });
  }

  async function onSave() {
    const next = phone.trim();
    if (!next) return;

    try {
      setSaving(true);
      await updateMyPhone(next);
      close();
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.root}>
      {/* backdrop */}
      <Pressable style={StyleSheet.absoluteFillObject} onPress={close} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Animated.View style={{ transform: [{ translateY }] }}>
          <Card
            bg={c.surfaceBg}
            border={c.surfaceBorder}
            shadowColor={c.shadowColor}
          >
            <View className="p-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-bold" style={{ color: c.text }}>
                  Telefonu Değiştir
                </Text>
                <Pressable onPress={close} className="p-2">
                  <Ionicons name="close" size={22} color={c.textMuted} />
                </Pressable>
              </View>

              <Text className="text-sm mt-1" style={{ color: c.textMuted }}>
                Yeni telefon numaranı gir. Kaydettikten sonra profilinde
                güncellenecek.
              </Text>

              <View className="mt-4">
                {loading ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator />
                    <Text className="ml-2" style={{ color: c.textMuted }}>
                      Yükleniyor...
                    </Text>
                  </View>
                ) : (
                  <Input
                    className="rounded-xl"
                    style={{ borderColor: c.surfaceBorder }}
                  >
                    <InputField
                      value={phone}
                      onChangeText={setPhone}
                      placeholder={currentPhone || "05xx xxx xx xx"}
                      placeholderTextColor={c.textMuted}
                      keyboardType="phone-pad"
                    />
                  </Input>
                )}
              </View>

              <View className="mt-4">
                <Button
                  onPress={onSave}
                  isDisabled={saving || loading}
                  className="rounded-xl"
                  style={{
                    backgroundColor: c.accentSoft,
                    borderColor: c.accentBorder,
                  }}
                  variant="outline"
                >
                  <Text className="font-semibold" style={{ color: c.text }}>
                    {saving ? "Kaydediliyor..." : "Telefonu Değiştir"}
                  </Text>
                </Button>
              </View>

              <View className="h-2" />
            </View>
          </Card>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-start",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
});
