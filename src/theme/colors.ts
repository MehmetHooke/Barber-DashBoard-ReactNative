export type AppTheme = "light" | "dark";

export const colors = {
  dark: {
    // screens
    screenBg: "#000000",

    // text
    text: "#FFFFFF",
    textMuted: "rgba(255,255,255,0.65)",

    // surfaces (cards/blocks)
    surfaceBg: "rgba(20,20,20,0.95)",
    surfaceBorder: "rgba(255,255,255,0.08)",

    // navbar
    tabWrapBg: "#000000",
    cardBg: "rgba(20,20,20,0.95)",
    cardBorder: "rgba(255,255,255,0.06)",
    inactiveIcon: "rgba(255,255,255,0.70)",

    // divider
    divider: "rgba(255,255,255,0.08)",

    // shadow
    shadowColor: "#000000",

    //red button bg

    // ✅ accent (dark = mor)
    accent: "#7C3AED",
    accentSoft: "rgba(124,58,237,0.14)",
    accentBorder: "rgba(124,58,237,0.22)",
  },

  light: {
    screenBg: "#EEF2FF",

    text: "#0F172A",
    textMuted: "rgba(15,23,42,0.65)",

    surfaceBg: "rgba(255,255,255,0.92)",
    surfaceBorder: "rgba(15,23,42,0.08)",

    tabWrapBg: "#EEF2FF",
    cardBg: "rgba(255,255,255,0.92)",
    cardBorder: "rgba(15,23,42,0.08)",
    inactiveIcon: "rgba(15,23,42,0.70)",

    divider: "rgba(15,23,42,0.10)",
    shadowColor: "#0F172A",

    // ✅ accent (light = mavi)
    accent: "#2563EB",
    accentSoft: "rgba(37,99,235,0.14)",
    accentBorder: "rgba(37,99,235,0.22)",
  },
} as const;
