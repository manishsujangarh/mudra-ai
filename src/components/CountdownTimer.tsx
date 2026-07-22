import { useAudioPlayer } from "expo-audio";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View, useColorScheme } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg"; // 👈 SVG इम्पोर्ट किया
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DEFAULT_PRACTICE_MUSIC,
  isPracticeMusicId,
  PRACTICE_MUSIC_OPTIONS,
  PRACTICE_MUSIC_STORAGE_KEY,
  PracticeMusicId,
} from "@/audio/music";

interface Props {
  /** Total duration in minutes. */
  minutes: number;
  onComplete?: () => void;
}

function fmt(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function CountdownTimer({ minutes, onComplete }: Props) {
  const total = Math.max(1, Math.round(minutes * 60));
  const { t } = useTranslation();
  const colorScheme = useColorScheme(); // 👈 डार्क/लाइट थीम डिटेक्ट करने के लिए
  
  const [remaining, setRemaining] = useState(total);
  const [running, setRunning] = useState(false);
  const [musicId, setMusicId] = useState<PracticeMusicId>(DEFAULT_PRACTICE_MUSIC);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bellTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);
  const selectedMusic = PRACTICE_MUSIC_OPTIONS.find((option) => option.id === musicId) ?? PRACTICE_MUSIC_OPTIONS[0];
  const musicEnabled = selectedMusic.id !== "off";

  const meditationPlayer = useAudioPlayer(selectedMusic.source);
  const bellPlayer = useAudioPlayer(require("../../assets/audio/timer-bell.wav"));

  useEffect(() => {
    const loadMusicPreference = async () => {
      try {
        const savedMusicId = await AsyncStorage.getItem(PRACTICE_MUSIC_STORAGE_KEY);
        setMusicId(isPracticeMusicId(savedMusicId) ? savedMusicId : DEFAULT_PRACTICE_MUSIC);
      } catch (error) {
        console.error("Failed to load practice music preference:", error);
      }
    };

    loadMusicPreference();
  }, []);

  useEffect(() => {
    meditationPlayer.loop = true;
    meditationPlayer.volume = 0.35;
    bellPlayer.loop = false;
    bellPlayer.volume = 0.8;
  }, [bellPlayer, meditationPlayer]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  useEffect(() => {
    if (remaining === 0 && !firedRef.current) {
      let cancelled = false;
      firedRef.current = true;
      meditationPlayer.pause();
      void meditationPlayer.seekTo(0);
      void bellPlayer
        .seekTo(0)
        .then(() => {
          if (cancelled) return;
          bellPlayer.play();
          bellTimeoutRef.current = setTimeout(() => {
            bellPlayer.pause();
            void bellPlayer.seekTo(0);
          }, 2000);
        })
        .catch(() => {});
      onComplete?.();
      return () => {
        cancelled = true;
      };
    }
  }, [bellPlayer, meditationPlayer, remaining, onComplete]);

  useEffect(() => {
    if (remaining === 0) return;
    if (running && musicEnabled) {
      meditationPlayer.play();
      return;
    }
    meditationPlayer.pause();
  }, [meditationPlayer, musicEnabled, remaining, running]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (bellTimeoutRef.current) clearTimeout(bellTimeoutRef.current);
    };
  }, []);

  const resetTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (bellTimeoutRef.current) clearTimeout(bellTimeoutRef.current);
    firedRef.current = false;
    setRunning(false);
    setRemaining(total);
    meditationPlayer.pause();
    bellPlayer.pause();
    void meditationPlayer.seekTo(0);
    void bellPlayer.seekTo(0);
  };

  // 🧮 SVG Circle Math 
  const size = 260; // टाइमर का साइज
  const strokeWidth = 10; // लाइन की मोटाई
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  
  const progress = remaining / total; 
  const strokeDashoffset = circumference - (progress * circumference);

  // 🎨 डार्क और लाइट मोड के हिसाब से बैकग्राउंड रिंग का कलर
  const trackColor = colorScheme === 'dark' ? '#1E293B' : '#E2E8F0'; 
  const brandColor = '#FF9500'; // आपका ऑरेंज थीम कलर

  return (
    <View className="items-center w-full">

      {/* 🌟 Circular Timer UI (SVG) */}
      <View className="items-center justify-center relative" style={{ width: size, height: size }}>
        
        {/* SVG Progress Ring */}
        <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
          {/* Background Track Circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Animated Progress Circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={brandColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round" // 👈 इससे लाइन के किनारे गोल (Smooth) दिखेंगे
          />
        </Svg>

        {/* Center Text (Timer & Subtitle) */}
        <View className="absolute items-center justify-center">
          <Text className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            {fmt(remaining)}
          </Text>
          <Text className="mt-2 text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-gray-400">
            {running ? t("remaining") || "REMAINING" : remaining === 0 ? t("complete") || "COMPLETE" : t("paused") || "PAUSED"}
          </Text>
        </View>

      </View>

      {/* ⏯️ Controls (Buttons) */}
      <View className="mt-8 flex-row justify-center gap-4 w-full px-5">

        {/* Play/Pause Button */}
        {remaining > 0 && (
          <Pressable
            onPress={() => setRunning((r) => !r)}
            className="flex-row items-center justify-center bg-brand px-8 py-4 rounded-2xl active:opacity-80 flex-1 max-w-[160px]"
          >
            <Ionicons
              name={running ? "pause" : "play"}
              size={18}
              color="white"
              className="mr-2"
            />
            <Text className="text-base font-bold text-white">
              {running ? t("pause") || "Pause" : remaining === total ? t("start") || "Start" : t("resume") || "Resume"}
            </Text>
          </Pressable>
        )}

        {/* Reset Button */}
        <Pressable
          onPress={resetTimer}
          className="flex-row items-center justify-center border border-slate-300 dark:border-gray-700 bg-white dark:bg-[#1A1A1A] px-6 py-4 rounded-2xl active:bg-slate-100 dark:active:bg-[#262626]"
        >
          <MaterialCommunityIcons name="reload" size={18} color="#FF9500" className="mr-2" />
          <Text className="text-base font-bold text-slate-700 dark:text-gray-300">
            {t("reset") || "Reset"}
          </Text>
        </Pressable>

      </View>
    </View>
  );
}
