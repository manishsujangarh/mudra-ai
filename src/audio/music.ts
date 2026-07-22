export type PracticeMusicId = "meditation" | "calm_breath" | "soft_bells" | "soft_promise" | "off";

export const PRACTICE_MUSIC_STORAGE_KEY = "practice_music";

export const DEFAULT_PRACTICE_MUSIC: PracticeMusicId = "meditation";

export const PRACTICE_MUSIC_OPTIONS: {
  id: PracticeMusicId;
  label: string;
  description: string;
  source: number;
}[] = [
    {
      id: "meditation",
      label: "Meditation",
      description: "Original bundled ambient loop",
      source: require("../../assets/audio/meditation.wav"),
    },
    {
      id: "calm_breath",
      label: "Calm Breath",
      description: "Original soft drone loop",
      source: require("../../assets/audio/calm-breath.wav"),
    },
    {
      id: "soft_bells",
      label: "Soft Bells",
      description: "Original gentle bell loop",
      source: require("../../assets/audio/soft-bells.wav"),
    },
    {
      id: "soft_promise",
      label: "Soft Promise",
      description: "Original gentle promise loop",
      source: require("../../assets/audio/promise.mp3"),
    },
    {
      id: "off",
      label: "No Music",
      description: "Practice with timer bell only",
      source: require("../../assets/audio/meditation.wav"),
    },
  ];

export function isPracticeMusicId(value: string | null): value is PracticeMusicId {
  return PRACTICE_MUSIC_OPTIONS.some((option) => option.id === value);
}
