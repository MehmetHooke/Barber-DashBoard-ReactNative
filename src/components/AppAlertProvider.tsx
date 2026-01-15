import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import Card from "@/src/components/Card";
import { useAppTheme } from "@/src/theme/ThemeProvider";
import { colors } from "@/src/theme/colors";
import React, { createContext, useContext, useMemo, useState } from "react";
import { Modal, Pressable, View } from "react-native";

type AlertButton = {
  text: string;
  variant?: "default" | "cancel" | "destructive";
  onPress?: () => void | Promise<void>;
};

type AlertState = {
  visible: boolean;
  title?: string;
  message?: string;
  buttons: AlertButton[];
};

type AppAlertApi = {
  alert: (title: string, message?: string, buttons?: AlertButton[]) => void;
  confirm: (params: {
    title: string;
    message?: string;
    cancelText?: string;
    confirmText?: string;
    destructive?: boolean;
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
  }) => void;
  hide: () => void;
};

const Ctx = createContext<AppAlertApi | null>(null);

export function AppAlertProvider({ children }: { children: React.ReactNode }) {
  const { effectiveTheme } = useAppTheme();
  const c = colors[effectiveTheme];

  const [state, setState] = useState<AlertState>({
    visible: false,
    title: "",
    message: "",
    buttons: [],
  });

  const hide = () => setState((s) => ({ ...s, visible: false }));

  const alert: AppAlertApi["alert"] = (title, message, buttons) => {
    setState({
      visible: true,
      title,
      message,
      buttons:
        buttons?.length
          ? buttons
          : [{ text: "Tamam", variant: "default", onPress: hide }],
    });
  };

  const confirm: AppAlertApi["confirm"] = ({
    title,
    message,
    cancelText = "İptal",
    confirmText = "Onayla",
    destructive = false,
    onConfirm,
    onCancel,
  }) => {
    setState({
      visible: true,
      title,
      message,
      buttons: [
        { text: cancelText, variant: "cancel", onPress: () => { hide(); onCancel?.(); } },
        {
          text: confirmText,
          variant: destructive ? "destructive" : "default",
          onPress: async () => {
            hide();
            await onConfirm();
          },
        },
      ],
    });
  };

  const api = useMemo<AppAlertApi>(() => ({ alert, confirm, hide }), []);

  const buttons = state.buttons ?? [];

  return (
    <Ctx.Provider value={api}>
      {children}

      <Modal
        transparent
        visible={state.visible}
        animationType="fade"
        onRequestClose={hide}
      >
        {/* Backdrop */}
        <Pressable
          onPress={hide}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.45)",
            paddingHorizontal: 18,
            justifyContent: "center",
          }}
        >
          {/* Stop propagation */}
          <Pressable onPress={() => {}}>

            <Card bg={c.surfaceBg} border={c.surfaceBorder} shadowColor={c.shadowColor}>
              <View style={{ padding: 16 }}>
                {!!state.title && (
                  <Text className="text-lg font-bold" style={{ color: c.text }}>
                    {state.title}
                  </Text>
                )}

                {!!state.message && (
                  <Text className="text-sm mt-2" style={{ color: c.textMuted }}>
                    {state.message}
                  </Text>
                )}

                <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
                  {buttons.map((b, idx) => {
                    const isCancel = b.variant === "cancel";
                    const isDestructive = b.variant === "destructive";

                    // theme-based button styling
                    const bg =
                      isCancel ? "transparent" : c.accentSoft;

                    const border =
                      isCancel ? c.surfaceBorder : c.accentBorder;

                    const textColor =
                      isDestructive ? "#EF4444" : isCancel ? c.text : c.accent;

                    return (
                      <View key={`${b.text}-${idx}`} style={{ flex: 1 }}>
                        <Button
                          variant="outline"
                          className="rounded-xl"
                          style={{ backgroundColor: bg, borderColor: border }}
                          onPress={async () => {
                            try {
                              await b.onPress?.();
                            } finally {
                              // eğer onPress hide etmediyse modal açık kalmasın
                              // ama confirm içinde zaten hide var
                              if (state.visible) hide();
                            }
                          }}
                        >
                          <Text className="font-semibold" style={{ color: textColor }}>
                            {b.text}
                          </Text>
                        </Button>
                      </View>
                    );
                  })}
                </View>
              </View>
            </Card>

          </Pressable>
        </Pressable>
      </Modal>
    </Ctx.Provider>
  );
}

export function useAppAlert() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppAlert must be used within AppAlertProvider");
  return ctx;
}
