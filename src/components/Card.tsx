import { View } from "react-native";
import { shadowMd } from "../theme/shadows";

export default function Card({
  children,
  bg,
  border,
  shadowColor,
}: {
  children: React.ReactNode;
  bg: string;
  border: string;
  shadowColor: string;
}) {
  return (
    <View
      className="rounded-2xl border overflow-hidden"
      style={[{ backgroundColor: bg, borderColor: border }, shadowMd(shadowColor)]}
    >
      {children}
    </View>
  );
}