import { router } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import { loadAppLanguage } from "../i18n/language";
import { auth } from "../lib/firebase";
import { getUserDoc } from "../services/user.service";


export default function Index() {
  const [checking, setChecking] = useState(true);

  const [langReady, setLangReady] = useState(false);

  useEffect(() => {
    (async () => {
      await loadAppLanguage();
      setLangReady(true);
    })();
  }, []);

  if (!langReady) return null;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {

      if (!user) {
        router.replace("/(auth)/login");
        setChecking(false);
        return;
      }
      (async () => {
        try {
          const profile = await getUserDoc(user.uid);
          const role = profile?.role;
          if (role === "BARBER") {
            router.replace("/(barber)/(tabs)");
          }
          else {
            router.replace("/(user)/(tabs)");
          }


        } catch (err) {
          Alert.alert(`Hata ! ${err}`)
          router.replace("/(user)/(tabs)")
        }
        finally {
          setChecking(false);
        }
      })();
      setChecking(false);
    });

    return unsub;
  }, []);

  if (checking) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  return null;
}
