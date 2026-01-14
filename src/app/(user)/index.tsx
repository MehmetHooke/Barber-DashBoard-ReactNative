import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';


import Card from '@/src/components/Card';
import { auth } from "@/src/lib/firebase";
import { logout } from "@/src/services/auth.service";
import { getUserDoc } from "@/src/services/user.service";
import { useAppTheme } from "@/src/theme/ThemeProvider";
import { colors } from "@/src/theme/colors";
import { UserDoc } from "@/src/types/user";
import { router } from "expo-router";

export default function index() {

  const [profile, setProfile] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const { preference, effectiveTheme, setPreference } = useAppTheme();
  const theme = effectiveTheme; // "light" | "dark"
  const c = colors[theme];


  useEffect(() => {
    async function load() {

      const uid = auth.currentUser?.uid;
      if (!uid) {
        setLoading(false)
        return;
      }
      const data = await getUserDoc(uid);
      setProfile(data);
      setLoading(false);
    }
    load();
  }, []);

  async function onLogout() {
    try {
      await logout();
      router.replace("/(auth)/login"); // gate login'e atar

    } catch {
      Alert.alert("Hata", "Çıkış yapılamadı");
    }
  }
  return (
    <View style={{ backgroundColor: c.screenBg }} className=" h-full   flex-1 justify-center justify-items-center">
      {loading ? (
        <ActivityIndicator />
      ) : (
        <View className='px-4'>

          <Card bg={c.surfaceBg} border={c.surfaceBorder} shadowColor={c.shadowColor}>
            <Text className="text-2xl font-bold text-center" style={{ color: c.text }}>
              Merhaba {profile ? `${profile.name} ${profile.surname}` : "!"}
            </Text>
            <Text className=' text-xl text-center' style={{ color: c.text }}>UserPage Home</Text>
          </Card>
        </View>
      )}

      <View >

      </View>
    </View>
  )
}
