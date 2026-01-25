import { router } from "expo-router";
import React from "react";
import {
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  View,
} from "react-native";

import { Button } from "@/components/ui/button";
import { EyeIcon, EyeOffIcon } from "@/components/ui/icon";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { LinearGradient } from "expo-linear-gradient";

import { registerWithEmail } from "@/src/services/auth.service";

export default function Register() {
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const [name, setName] = React.useState("");
  const [surname, setSurname] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const togglePassword = () => setShowPassword((p) => !p);

  function validate() {
    if (!name.trim()) return "İsim zorunlu.";
    if (!surname.trim()) return "Soyisim zorunlu.";
    if (!phone.trim()) return "Telefon zorunlu.";
    if (phone.trim().length < 10) return "Telefon en az 10 hane olmalı.";
    if (!email.trim()) return "Email zorunlu.";
    if (!email.includes("@")) return "Email formatı hatalı.";
    if (!password.trim()) return "Şifre zorunlu.";
    if (password.trim().length < 6) return "Şifre en az 6 karakter olmalı.";
    return null;
  }

  async function onSubmit() {
    const error = validate();
    if (error) {
      Alert.alert("Hata", error);
      return;
    }

    try {
      setLoading(true);

      await registerWithEmail({
        name,
        surname,
        phone,
        email,
        password,
      });

      router.replace("/");
    } catch (e: any) {
      Alert.alert("Kayıt başarısız", e?.message ?? "Bilinmeyen hata");
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
        <SafeAreaView style={{ flex: 1 }}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
          >
            <ScrollView
              contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={{ flex: 1,justifyContent:"center", paddingHorizontal: 24, paddingTop: 80, paddingBottom: 24 }}>
                <VStack space="xs">
                  <Text className="text-white text-3xl font-bold mb-6">
                    Kayıt Ol
                  </Text>

                  <Input
                    variant="rounded"
                    className="mb-4 bg-zinc-900/90 border border-zinc-700"
                  >
                    <InputField
                      placeholder="İsim"
                      placeholderTextColor="#9ca3af"
                      className="text-white"
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                      editable={!loading}
                    />
                  </Input>

                  <Input
                    variant="rounded"
                    className="mb-4 bg-zinc-900/90 border border-zinc-700"
                  >
                    <InputField
                      placeholder="Soyisim"
                      placeholderTextColor="#9ca3af"
                      className="text-white"
                      value={surname}
                      onChangeText={setSurname}
                      autoCapitalize="words"
                      editable={!loading}
                    />
                  </Input>

                  <Input
                    variant="rounded"
                    className="mb-4 bg-zinc-900/90 border border-zinc-700"
                  >
                    <InputField
                      inputMode="numeric"
                      keyboardType="number-pad"
                      placeholder="Telefon"
                      placeholderTextColor="#9ca3af"
                      className="text-white"
                      value={phone}
                      onChangeText={setPhone}
                      editable={!loading}
                    />
                  </Input>

                  <Input
                    variant="rounded"
                    className="mb-4 bg-zinc-900/90 border border-zinc-700"
                  >
                    <InputField
                      placeholder="Email"
                      placeholderTextColor="#9ca3af"
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
                      placeholderTextColor="#9ca3af"
                      className="text-white"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      editable={!loading}
                    />
                    <InputSlot className="pr-3" onPress={togglePassword}>
                      <InputIcon as={showPassword ? EyeOffIcon : EyeIcon} />
                    </InputSlot>
                  </Input>

                  <Button
                    variant="outline"
                    className="rounded-2xl"
                    onPress={onSubmit}
                    isDisabled={loading}
                  >
                    <Text className="text-white font-semibold">
                      {loading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
                    </Text>
                  </Button>

                  <Button
                    variant="link"
                    className="mt-3"
                    onPress={() => router.replace("/(auth)/login")}
                    isDisabled={loading}
                  >
                    <Text className="text-white/70">
                      Zaten hesabın var mı? Giriş yap
                    </Text>
                  </Button>
                </VStack>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
}
