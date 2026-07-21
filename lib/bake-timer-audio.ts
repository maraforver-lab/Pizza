import type { MutableRefObject } from "react";
import type { BakeTimerSoundCue } from "@/lib/bake-timer";
import {
  CLASSIC_BAKE_TIMER_SOUND_THEME_ID,
  getBakeTimerSoundPatternForTheme,
  type BakeTimerSoundThemeId,
} from "@/lib/bake-timer-sound-themes";

type WindowWithAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export type BakeTimerAudioRef = MutableRefObject<AudioContext | null>;

export function closeBakeTimerAudioContext(audioRef: BakeTimerAudioRef) {
  const currentAudio = audioRef.current;
  audioRef.current = null;
  void currentAudio?.close();
}

export function playBakeTimerCue({
  audioRef,
  enabled,
  cue,
  themeId = CLASSIC_BAKE_TIMER_SOUND_THEME_ID,
}: {
  audioRef: BakeTimerAudioRef;
  enabled: boolean;
  cue: BakeTimerSoundCue;
  themeId?: BakeTimerSoundThemeId;
}) {
  if (!enabled || typeof window === "undefined") return;
  const AudioCtor = window.AudioContext ?? (window as WindowWithAudio).webkitAudioContext;
  if (!AudioCtor) return;

  try {
    const context = audioRef.current ?? new AudioCtor();
    audioRef.current = context;
    void context.resume?.();

    for (const tone of getBakeTimerSoundPatternForTheme(cue, themeId)) {
      const startAt = context.currentTime + tone.offset;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = tone.type ?? "sine";
      oscillator.frequency.setValueAtTime(tone.frequency, startAt);
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(Math.min(tone.gain, 0.24), startAt + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + tone.length);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(startAt);
      oscillator.stop(startAt + tone.length + 0.03);
    }
  } catch {
    // Audio must never block the visual timer.
  }
}
