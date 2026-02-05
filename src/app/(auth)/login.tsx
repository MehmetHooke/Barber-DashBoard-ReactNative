import { Button } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import i18n from "@/src/i18n/i18n";
import { loginWithEmail } from "@/src/services/auth.service";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

import React from "react";
import { useTranslation } from "react-i18next";
import { Alert, ImageBackground, View } from "react-native";

export default function Login() {
  const { t } = useTranslation();
  const [loading, setLoading] = React.useState(false);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  function validate() {
    if (!email.trim()) return t("auth.validation.emailRequired");
    if (!email.includes("@")) return t("auth.validation.emailInvalid");
    if (!password.trim()) return t("auth.validation.passwordRequired");
    if (password.trim().length < 6) return t("auth.validation.passwordMin");
    return null;
  }

  async function onLogin() {
    const error = validate();
    if (error) {
      Alert.alert(t("auth.errorTitle"), error);
      return;
    }

    try {
      setLoading(true);
      await loginWithEmail(email, password);
      router.replace("/"); // gate yönlendirecek
    } catch (e: any) {
      Alert.alert(
        t("auth.loginFailed"),
        e?.message ?? t("auth.unknownError")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <ImageBackground
      source={require("@/src/assets/images/barber-login.png")}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <LinearGradient
        colors={["rgba(0,0,0,0.75)", "rgba(0,0,0,0.9)"]}
        style={{ flex: 1 }}
      >
        <VStack className="flex-1 justify-center px-6">
          {/* ✅ Dil Seçimi */}
          
            <Text className="flex">Dil</Text>
        
          <View className="flex-row justify-end gap-2 mb-4">
          
            <Button
              variant={i18n.language === "tr" ? "solid" : "outline"}
              className="rounded-xl border-white/30"
              onPress={() => i18n.changeLanguage("tr")}
              isDisabled={loading}
            >
              <Text className="text-white">{t("auth.language.tr")}</Text>
            </Button>

            <Button
              variant={i18n.language === "en" ? "solid" : "outline"}
              className="rounded-2xl mb-10 border-white/30"
              onPress={() => i18n.changeLanguage("en")}
              isDisabled={loading}
            >
              <Text className="text-white">{t("auth.language.en")}</Text>
            </Button>
          </View>
          <Text className="text-white text-3xl font-bold mb-6">
            {t("auth.welcome")}
          </Text>

          <Input
            variant="rounded"
            className="mb-4 bg-zinc-900/90 border border-zinc-700"
          >
            <InputField
              placeholder={t("auth.emailPlaceholder")}
              placeholderTextColor="rgba(255,255,255,0.5)"
              className="text-white"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
          </Input>

          <Input
            variant="rounded"
            className="mb-6 bg-zinc-900/90 border border-zinc-700"
          >
            <InputField
              placeholder={t("auth.passwordPlaceholder")}
              placeholderTextColor="rgba(255,255,255,0.5)"
              secureTextEntry
              className="text-white"
              value={password}
              onChangeText={setPassword}
              editable={!loading}
            />
          </Input>

          <Button
            variant="outline"
            className="rounded-2xl mb-10 border-white/30"
            onPress={onLogin}
            isDisabled={loading}
          >
            <Text className="text-white font-semibold">
              {loading ? t("auth.loggingIn") : t("auth.login")}
            </Text>
          </Button>

          <Button
            variant="link"
            className="mt-3"
            onPress={() => router.push("/(auth)/register")}
            isDisabled={loading}
          >
            <Text className="text-white/70">
              {t("auth.noAccount")}{" "}
              <Text className="underline font-semibold">{t("auth.register")}</Text>
            </Text>
          </Button>
        </VStack>
      </LinearGradient>
    </ImageBackground>
  );
}