import { Button } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { loginWithEmail } from "@/src/services/auth.service";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { Alert, ImageBackground } from "react-native";

export default function Login() {
  const [loading, setLoading] = React.useState(false);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  function validate() {
    if (!email.trim()) return "Email zorunlu.";
    if (!email.includes("@")) return "Email formatı hatalı.";
    if (!password.trim()) return "Şifre zorunlu.";
    if (password.trim().length < 6) return "Şifre en az 6 karakter olmalı.";
    return null;
  }

  async function onLogin() {
    const error = validate();
    if (error) {
      Alert.alert("Hata", error);
      return;
    }

    try {
      setLoading(true);
      await loginWithEmail(email, password);
      router.replace("/"); // gate yönlendirecek
    } catch (e: any) {
      Alert.alert("Giriş başarısız", e?.message ?? "Bilinmeyen hata");
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
          <Text className="text-white text-3xl font-bold mb-6">
            Hoş Geldin
          </Text>

          <Input
            variant="rounded"
            className="mb-4 bg-zinc-900/90 border border-zinc-700"
          >
            <InputField
              placeholder="Eposta"
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
              placeholder="Şifre"
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
              {loading ? "Giriş yapılıyor..." : "Giriş yap"}
            </Text>
          </Button>

          <Button
            variant="link"
            className="mt-3"
            onPress={() => router.push("/(auth)/register")}
            isDisabled={loading}
          >
            <Text className="text-white/70">
              Hesabın yok mu?{" "}
              <Text className="underline font-semibold">Kayıt ol</Text>
            </Text>
          </Button>
        </VStack>
      </LinearGradient>
    </ImageBackground>
  );
}