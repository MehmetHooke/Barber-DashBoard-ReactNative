import i18n from "@/src/i18n/i18n";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LANG_KEY = "APP_LANG";

export type AppLanguage = "tr" | "en";

export async function setAppLanguage(lang: AppLanguage) {
  await AsyncStorage.setItem(LANG_KEY, lang);
  await i18n.changeLanguage(lang);
}

export async function loadAppLanguage() {
  const saved = await AsyncStorage.getItem(LANG_KEY);
  if (saved === "tr" || saved === "en") {
    await i18n.changeLanguage(saved);
    return saved;
  }
  return (i18n.language as AppLanguage) ?? "tr";
}
