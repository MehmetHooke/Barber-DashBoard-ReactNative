import { Platform } from "react-native";

export function shadowMd(shadowColor: string) {
  if (Platform.OS === "android") {
    return {
      elevation: 6,
    };
  }
  // iOS shadow
  return {
    shadowColor,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  };
}
