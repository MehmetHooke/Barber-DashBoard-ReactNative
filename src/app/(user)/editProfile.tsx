import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Image,
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
    pickAndUploadMyProfileImage,
    removeMyProfileImage,
    updateMyProfile,
} from "@/src/services/userSettings.service";
import { colors } from "@/src/theme/colors";
import { useAppTheme } from "@/src/theme/ThemeProvider";

export default function EditProfile() {
  const { effectiveTheme } = useAppTheme();
  const c = colors[effectiveTheme];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [profileImage, setProfileImage] = useState("");

  // ChangePhone gibi: 0 -> 1
  const slide = useRef(new Animated.Value(0)).current;

  // ✅ Ortada "yukarıdan hafif" gelsin
  const translateY = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0],
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
        setName(doc?.name ?? "");
        setSurname(doc?.surname ?? "");
        setProfileImage(doc?.profileImage ?? "");
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
    }).start(() => router.back());
  }

  async function onPickImage() {
    try {
      setUploading(true);
      const url = await pickAndUploadMyProfileImage();
      setProfileImage(url);
    } finally {
      setUploading(false);
    }
  }

  async function onRemoveImage() {
    try {
      setUploading(true);
      await removeMyProfileImage();
      setProfileImage("");
    } finally {
      setUploading(false);
    }
  }

  async function onSave() {
    if (!name.trim() || !surname.trim()) return;

    try {
      setSaving(true);
      await updateMyProfile({ name, surname });
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
        style={styles.kav}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* ✅ Ortaya hizalama */}
        <View style={styles.centerWrap} pointerEvents="box-none">
          <Animated.View
            style={[styles.modalWrap, { transform: [{ translateY }] }]}
          >
            <Card
              bg={c.surfaceBg}
              border={c.surfaceBorder}
              shadowColor={c.shadowColor}
            >
              <View className="p-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-lg font-bold" style={{ color: c.text }}>
                    Profili Düzenle
                  </Text>
                  <Pressable onPress={close} className="p-2">
                    <Ionicons name="close" size={22} color={c.textMuted} />
                  </Pressable>
                </View>

                <Text className="text-sm mt-1" style={{ color: c.textMuted }}>
                  Ad, soyad ve profil fotoğrafını güncelleyebilirsin.
                </Text>

                {/* Avatar */}
                <View className="mt-4 items-center">
                  <View
                    className="w-24 h-24 rounded-3xl border overflow-hidden items-center justify-center"
                    style={{
                      borderColor: c.accentBorder,
                      backgroundColor: c.accentSoft,
                    }}
                  >
                    {profileImage ? (
                      <Image
                        source={{ uri: profileImage }}
                        style={{ width: 96, height: 96 }}
                      />
                    ) : (
                      <Ionicons name="person" size={34} color={c.accent} />
                    )}
                  </View>

                  <View className="flex-row gap-2 mt-3">
                    <Button
                      onPress={onPickImage}
                      isDisabled={uploading || loading}
                      className="rounded-xl"
                      style={{
                        backgroundColor: c.accentSoft,
                        borderColor: c.accentBorder,
                      }}
                      variant="outline"
                    >
                      <Text className="font-semibold" style={{ color: c.text }}>
                        {uploading ? "Yükleniyor..." : "Fotoğraf Seç"}
                      </Text>
                    </Button>

                    <Button
                      onPress={onRemoveImage}
                      isDisabled={uploading || loading || !profileImage}
                      className="rounded-xl"
                      style={{ borderColor: c.surfaceBorder }}
                      variant="outline"
                    >
                      <Text
                        className="font-semibold"
                        style={{ color: c.textMuted }}
                      >
                        Kaldır
                      </Text>
                    </Button>
                  </View>
                </View>

                {/* Inputs */}
                <View className="mt-4">
                  {loading ? (
                    <View className="flex-row items-center">
                      <ActivityIndicator />
                      <Text className="ml-2" style={{ color: c.textMuted }}>
                        Yükleniyor...
                      </Text>
                    </View>
                  ) : (
                    <>
                      <Input
                        className="rounded-xl"
                        style={{ borderColor: c.surfaceBorder }}
                      >
                        <InputField
                          value={name}
                          onChangeText={setName}
                          placeholder="Ad"
                          placeholderTextColor={c.textMuted}
                        />
                      </Input>

                      <View className="h-3" />

                      <Input
                        className="rounded-xl"
                        style={{ borderColor: c.surfaceBorder }}
                      >
                        <InputField
                          value={surname}
                          onChangeText={setSurname}
                          placeholder="Soyad"
                          placeholderTextColor={c.textMuted}
                        />
                      </Input>
                    </>
                  )}
                </View>

                {/* Save */}
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
                      {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                    </Text>
                  </Button>
                </View>
              </View>
            </Card>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  kav: {
    flex: 1,
  },
  centerWrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  modalWrap: {
    width: "100%",
  },
});
