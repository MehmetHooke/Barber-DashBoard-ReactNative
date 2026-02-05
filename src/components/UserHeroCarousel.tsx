import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  View,
  useWindowDimensions,
} from "react-native";

import { Text } from "@/components/ui/text";
import Card from "@/src/components/Card";
import { useAppTheme } from "@/src/theme/ThemeProvider";
import { colors } from "@/src/theme/colors";

export type HeroSlide = {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  onPress?: () => void;
};

type Props = {
  slides: HeroSlide[];
  height?: number; // default 140
  headerTitle?: string;
  headerSubtitle?: string;
};


export default function UserHeroCarousel({
  slides,
  height = 140,
  headerTitle = "Hizmetlerimiz",
  headerSubtitle = "Öne çıkan hizmetler",
}: Props) {
  const { width } = useWindowDimensions();
  const { effectiveTheme } = useAppTheme();
  const c = colors[effectiveTheme];

  const listRef = useRef<FlatList<HeroSlide>>(null);

  // Sayfa padding 16 + 16 ise:
  const itemWidth = width - 60 ;

  const [index, setIndex] = useState(0);

  const hasSlides = slides?.length > 0;
  const count = slides.length;

  const safeIndex = useMemo(() => {
    if (!hasSlides) return 0;
    return Math.min(Math.max(index, 0), count - 1);
  }, [index, hasSlides, count]);

  const scrollTo = useCallback(
    (i: number, animated = true) => {
      if (!hasSlides) return;
      const next = Math.min(Math.max(i, 0), count - 1);

      // ✅ scrollToOffset en stabil çözüm
      listRef.current?.scrollToOffset({
        offset: next * itemWidth,
        animated,
      });

      setIndex(next);
    },
    [hasSlides, count, itemWidth]
  );


  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / itemWidth);
    setIndex(page);
  };

  if (!hasSlides) return null;

  return (
    <Card bg={c.surfaceBg} border={c.surfaceBorder} shadowColor={c.shadowColor}>
      {/* Header */}
      <View className="px-4 pt-4 pb-3 flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-base font-bold" style={{ color: c.text }}>
            {headerTitle}
          </Text>
          <Text className="text-xs mt-1" style={{ color: c.textMuted }}>
            {headerSubtitle}
          </Text>
        </View>

        <View
          className="px-3 py-1 rounded-full border"
          style={{ borderColor: c.surfaceBorder, backgroundColor: c.accentSoft }}
        >
          <Text className="text-xs font-semibold" style={{ color: c.accent }}>
            {safeIndex + 1}/{count}
          </Text>
        </View>
      </View>

      {/* Stage */}
      <View className="px-4 pb-4">
        <View
          className="overflow-hidden rounded-2xl border"
          style={{ borderColor: c.surfaceBorder, height }}
        >
          <FlatList
            ref={listRef}
            data={slides}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            snapToInterval={itemWidth}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onMomentumEnd}
            getItemLayout={(_, i) => ({
              length: itemWidth,
              offset: itemWidth * i,
              index: i,
            })}
            renderItem={({ item }) => (
              <Pressable onPress={item.onPress} style={{ width: itemWidth, height }}>
                <Image
                  source={{ uri: item.imageUrl }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />

                {/* bottom overlay */}
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: Math.max(70, Math.floor(height * 0.4)),
                    backgroundColor: "rgba(0,0,0,0.55)",
                  }}
                />

                {/* text + dots */}
                <View
                  style={{
                    position: "absolute",
                    left: 12,
                    right: 12,
                    bottom: 10,
                    flexDirection: "row",
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    {item.badge ? (
                      <View
                        style={{
                          alignSelf: "flex-start",
                          paddingHorizontal: 12,
                          paddingVertical: 4,
                          borderRadius: 999,
                          backgroundColor: "rgba(255,255,255,0.18)",
                          borderWidth: 1,
                          borderColor: "rgba(255,255,255,0.20)",
                          marginBottom: 6,
                        }}
                      >
                        <Text className="text-[11px] font-semibold" style={{ color: "#fff" }}>
                          {item.badge}
                        </Text>
                      </View>
                    ) : null}

                    {!!item.title && (
                      <Text className="text-base font-bold" style={{ color: "#fff" }} numberOfLines={1}>
                        {item.title}
                      </Text>
                    )}
                    {!!item.subtitle && (
                      <Text className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.78)" }} numberOfLines={1}>
                        {item.subtitle}
                      </Text>
                    )}
                  </View>

                  {/* dots */}
                  <View style={{  flexDirection: "row", gap: 6 }}>
                    {slides.map((s, i) => {
                      const active = i === safeIndex;
                      return (
                        <Pressable
                          key={s.id}
                          onPress={() => scrollTo(i, true)}
                          hitSlop={10}
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 999,
                            backgroundColor: active ? "#fff" : "rgba(255,255,255,0.45)",
                          }}
                        />
                      );
                    })}
                  </View>
                </View>
              </Pressable>
            )}
          />

        
        </View>
      </View>
    </Card>
  );
}
