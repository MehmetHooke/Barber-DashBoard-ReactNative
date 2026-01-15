import React from "react";
import { View, ViewProps } from "react-native";

type Props = ViewProps & {
  className?: string;
};

export function Card({ className, style, ...props }: Props) {
  return (
    <View
      {...props}
      className={[
        "rounded-2xl border border-outline-200 bg-background-0",
        className,
      ].filter(Boolean).join(" ")}
      style={style}
    />
  );
}

export function CardHeader({ className, style, ...props }: Props) {
  return <View {...props} className={["p-4", className].filter(Boolean).join(" ")} style={style} />;
}

export function CardContent({ className, style, ...props }: Props) {
  return <View {...props} className={["px-4 pb-4", className].filter(Boolean).join(" ")} style={style} />;
}

export function CardFooter({ className, style, ...props }: Props) {
  return <View {...props} className={["px-4 pb-4 pt-2", className].filter(Boolean).join(" ")} style={style} />;
}
