import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  title?: string;      // hizmet adı
  subtitle?: string;   // fiyat/süre veya kısa açıklama
  badge?: string;      // örn "Popüler"
  onPress?: () => void;
};

type Props = {
  slides: HeroSlide[];
  autoMs?: number;           // default 2500
  height?: number;           // default 140
  headerTitle?: string;      // default "Hızlı Randevu"
  headerSubtitle?: string;   // default "Öne çıkan hizmetler"
};

export default function UserHeroCarousel({
  slides,
  autoMs = 2500,
  height = 240,
  headerTitle = "Hızlı Randevu",
  headerSubtitle = "Öne çıkan hizmetler",
}: Props) {
  const { width } = useWindowDimensions();
  const { effectiveTheme } = useAppTheme();
  const c = colors[effectiveTheme];

  const hasSlides = slides?.length > 0;
  const listRef = useRef<FlatList<any>>(null);
  const timerRef = useRef<any>(null);

  // infinite loop için 3x data
  const data = useMemo(() => {
    if (!hasSlides) return [];
    return [...slides, ...slides, ...slides];
  }, [slides, hasSlides]);

  const base = slides.length;
  const startIndex = useMemo(() => (hasSlides ? base : 0), [hasSlides, base]);

  const itemWidth = width - 32; // page padding 16*2
  const [index, setIndex] = useState(startIndex);

  const realIndex = useMemo(() => {
    if (!hasSlides) return 0;
    return ((index % base) + base) % base;
  }, [index, base, hasSlides]);

  const goTo = useCallback(
    (next: number, animated = true) => {
      if (!hasSlides) return;
      setIndex(next);
      listRef.current?.scrollToIndex({ index: next, animated });
    },
    [hasSlides]
  );

  const goNext = useCallback(() => goTo(index + 1, true), [goTo, index]);
  const goPrev = useCallback(() => goTo(index - 1, true), [goTo, index]);

  // init jump
  useEffect(() => {
    if (!hasSlides) return;
    const t = setTimeout(() => {
      listRef.current?.scrollToIndex({ index: startIndex, animated: false });
      setIndex(startIndex);
    }, 30);
    return () => clearTimeout(t);
  }, [hasSlides, startIndex]);

  // autoplay
  useEffect(() => {
    if (!hasSlides) return;
    timerRef.current && clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setIndex((prev) => prev + 1);
    }, autoMs);
    return () => timerRef.current && clearInterval(timerRef.current);
  }, [hasSlides, autoMs]);

  // loop fix
  useEffect(() => {
    if (!hasSlides) return;
    const endThreshold = base * 2 + Math.floor(base / 2);
    const startThreshold = Math.floor(base / 2);

    if (index >= endThreshold) {
      const next = index - base;
      setTimeout(() => {
        listRef.current?.scrollToIndex({ index: next, animated: false });
        setIndex(next);
      }, 250);
    }
    if (index <= startThreshold) {
      const next = index + base;
      setTimeout(() => {
        listRef.current?.scrollToIndex({ index: next, animated: false });
        setIndex(next);
      }, 250);
    }
  }, [index, hasSlides, base]);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / itemWidth);
    setIndex(page);
  };

  if (!hasSlides) return null;

  const current = slides[realIndex];

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
            {realIndex + 1}/{slides.length}
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
            data={data}
            keyExtractor={(item, idx) => `${item.id}-${idx}`}
            horizontal
            pagingEnabled
            snapToInterval={itemWidth}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            getItemLayout={(_, i) => ({ length: itemWidth, offset: itemWidth * i, index: i })}
            onMomentumScrollEnd={onMomentumEnd}
            renderItem={({ item }) => {
              const slide = item as HeroSlide;
              return (
                <Pressable
                  onPress={slide.onPress}
                  style={{ width: itemWidth, height }}
                >
                  {/* image */}
                  <Image
                    source={{ uri: slide.imageUrl }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />

                  {/* overlay gradient-ish */}
                  <View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: 0,
                      top: 0,
                      // basit gradient benzeri: altta daha koyu
                      backgroundColor: "transparent",
                    }}
                  />
                  <View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: 0,
                      height: Math.max(70, Math.floor(height * 0.65)),
                      backgroundColor: "rgba(0,0,0,0.55)",
                    }}
                  />

                  {/* text */}
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
                      {slide.badge ? (
                        <View
                          style={{
                            alignSelf: "flex-start",
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 999,
                            backgroundColor: "rgba(255,255,255,0.18)",
                            borderWidth: 1,
                            borderColor: "rgba(255,255,255,0.20)",
                            marginBottom: 6,
                          }}
                        >
                          <Text className="text-[11px] font-semibold" style={{ color: "#fff" }}>
                            {slide.badge}
                          </Text>
                        </View>
                      ) : null}

                      {!!slide.title && (
                        <Text className="text-base font-bold" style={{ color: "#fff" }} numberOfLines={1}>
                          {slide.title}
                        </Text>
                      )}
                      {!!slide.subtitle && (
                        <Text className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.78)" }} numberOfLines={1}>
                          {slide.subtitle}
                        </Text>
                      )}
                    </View>

                    {/* dots */}
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      {slides.map((s, i) => {
                        const active = i === realIndex;
                        return (
                          <Pressable
                            key={s.id}
                            onPress={() => goTo(startIndex + i, true)}
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
              );
            }}
          />

          {/* nav buttons */}
          <Pressable
            onPress={goPrev}
            style={{
              position: "absolute",
              left: 10,
              top: height / 2 - 18,
              width: 36,
              height: 36,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255,255,255,0.22)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.18)",
            }}
          >
            <Ionicons name="chevron-back" size={18} color="#fff" />
          </Pressable>

          <Pressable
            onPress={goNext}
            style={{
              position: "absolute",
              right: 10,
              top: height / 2 - 18,
              width: 36,
              height: 36,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255,255,255,0.22)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.18)",
            }}
          >
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>
    </Card>
  );
}
