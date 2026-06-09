import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { formatTime, parseTime } from "@/lib/utils";

interface Props {
  value: string; // "HH:mm"
  onChange: (value: string) => void;
}

const PRESETS = ["06:00", "07:30", "12:30", "18:00", "19:30", "21:00"];

/** Lightweight time picker: quick presets + +/- steppers. No native deps. */
export function TimePicker({ value, onChange }: Props) {
  const { hour, minute } = useMemo(() => parseTime(value), [value]);
  const [h, setH] = useState(hour);
  const [m, setM] = useState(minute);

  const apply = (nh: number, nm: number) => {
    const hh = (nh + 24) % 24;
    const mm = (nm + 60) % 60;
    setH(hh);
    setM(mm);
    onChange(`${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`);
  };

  return (
    <View>
      <View className="flex-row flex-wrap">
        {PRESETS.map((p) => (
          <Pressable
            key={p}
            onPress={() => {
              const t = parseTime(p);
              apply(t.hour, t.minute);
            }}
            className={`mr-2 mb-2 rounded-full px-3 py-2 ${
              `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}` === p
                ? "bg-brand"
                : "bg-surface border border-brand-light/40"
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}` ===
                p
                  ? "text-white"
                  : "text-brand"
              }`}
            >
              {formatTime(p)}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="mt-3 flex-row items-center justify-center rounded-2xl bg-surface p-4">
        <Stepper
          label="Hour"
          onUp={() => apply(h + 1, m)}
          onDown={() => apply(h - 1, m)}
        />
        <Text className="mx-4 text-3xl font-bold text-ink">
          {formatTime(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`)}
        </Text>
        <Stepper
          label="Min"
          onUp={() => apply(h, m + 5)}
          onDown={() => apply(h, m - 5)}
        />
      </View>
    </View>
  );
}

function Stepper({
  label,
  onUp,
  onDown,
}: {
  label: string;
  onUp: () => void;
  onDown: () => void;
}) {
  return (
    <View className="items-center">
      <Pressable
        onPress={onUp}
        className="h-9 w-9 items-center justify-center rounded-full bg-brand/10 active:opacity-70"
      >
        <Text className="text-lg font-bold text-brand">+</Text>
      </Pressable>
      <Text className="my-1 text-[10px] uppercase text-muted">{label}</Text>
      <Pressable
        onPress={onDown}
        className="h-9 w-9 items-center justify-center rounded-full bg-brand/10 active:opacity-70"
      >
        <Text className="text-lg font-bold text-brand">−</Text>
      </Pressable>
    </View>
  );
}
