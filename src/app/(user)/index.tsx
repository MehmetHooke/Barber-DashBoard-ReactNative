import { Button } from "@/components/ui/button";
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';


import { auth } from "@/src/lib/firebase";
import { logout } from "@/src/services/auth.service";
import { getUserDoc } from "@/src/services/user.service";
import { UserDoc } from "@/src/types/user";
import { router } from "expo-router";

export default function index() {

  const [profile, setProfile] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);

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
    <View className='h-full bg-black   flex-1 justify-center justify-items-center'>
      {loading ? (
        <ActivityIndicator />
      ) : (
        <Text className="text-white text-2xl font-bold">
          Merhaba {profile ? `${profile.name} ${profile.surname}` : "!"}
        </Text>
      )}

      <View >
        <Text className=' w-auto text-xl text-center color-red-500 '>UserPage Home</Text>
        <Button variant='solid'
          className="mt-3"
          onPress={onLogout}
        >
          <Text>Çıkış yape</Text>
        </Button>
      </View>
    </View>
  )
}
