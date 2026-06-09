import { useAudioPlayer } from "expo-audio";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";

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

/**
 * Practice countdown timer with start/pause/reset. Fires onComplete once when
 * it reaches zero. Uses setInterval (1s tick) — fine for a foreground timer.
 */
export function CountdownTimer({ minutes, onComplete }: Props) {
  const total = Math.max(1, Math.round(minutes * 60));
  const [remaining, setRemaining] = useState(total);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bellTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);
  const meditationPlayer = useAudioPlayer(
    require("../../assets/audio/meditation.wav")
  );
  const bellPlayer = useAudioPlayer(require("../../assets/audio/timer-bell.wav"));

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
        .catch(() => {
          // The player can be released if the screen unmounts during the seek.
        });
      onComplete?.();
      return () => {
        cancelled = true;
      };
    }
  }, [bellPlayer, meditationPlayer, remaining, onComplete]);

  useEffect(() => {
    if (remaining === 0) return;
    if (running) {
      meditationPlayer.play();
      return;
    }

    meditationPlayer.pause();
  }, [meditationPlayer, remaining, running]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (bellTimeoutRef.current) clearTimeout(bellTimeoutRef.current);
    };
  }, []);

  const progress = 1 - remaining / total;

  return (
    <View className="items-center">
      <View className="h-56 w-56 items-center justify-center rounded-full border-8 border-brand/15">
        <View
          className="absolute h-56 w-56 rounded-full border-8 border-brand"
          style={{ opacity: 0.25 + progress * 0.75 }}
        />
        <Text className="text-5xl font-bold text-ink">{fmt(remaining)}</Text>
        <Text className="mt-1 text-xs uppercase tracking-widest text-muted">
          {running ? "in practice" : remaining === 0 ? "complete" : "paused"}
        </Text>
      </View>

      <View className="mt-8 flex-row gap-3">
        {remaining > 0 && (
          <Pressable
            onPress={() => setRunning((r) => !r)}
            className="rounded-2xl bg-brand px-8 py-4 active:opacity-80"
          >
            <Text className="text-base font-semibold text-white">
              {running ? "Pause" : remaining === total ? "Start" : "Resume"}
            </Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (bellTimeoutRef.current) clearTimeout(bellTimeoutRef.current);
            firedRef.current = false;
            setRunning(false);
            setRemaining(total);
            meditationPlayer.pause();
            bellPlayer.pause();
            void meditationPlayer.seekTo(0);
            void bellPlayer.seekTo(0);
          }}
          className="rounded-2xl border border-brand bg-surface px-6 py-4 active:opacity-80"
        >
          <Text className="text-base font-semibold text-brand">Reset</Text>
        </Pressable>
      </View>
    </View>
  );
}
