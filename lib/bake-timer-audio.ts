import type { MutableRefObject } from "react";
import type { BakeTimerSoundCue } from "@/lib/bake-timer";
import {
  CLASSIC_BAKE_TIMER_SOUND_THEME_ID,
  getBakeTimerSoundPatternForTheme,
  type BakeTimerSoundTone,
  type BakeTimerSoundThemeId,
} from "@/lib/bake-timer-sound-themes";

type WindowWithAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export type BakeTimerAudioEngine = {
  context: AudioContext;
  sources: Set<AudioScheduledSourceNode>;
};

export type BakeTimerAudioRef = MutableRefObject<BakeTimerAudioEngine | null>;

function stopActiveBakeTimerSources(engine: BakeTimerAudioEngine) {
  for (const source of engine.sources) {
    try {
      source.stop();
    } catch {
      // The source may already have finished naturally.
    }
  }
  engine.sources.clear();
}

export function closeBakeTimerAudioContext(audioRef: BakeTimerAudioRef) {
  const currentAudio = audioRef.current;
  audioRef.current = null;
  if (!currentAudio) return;
  stopActiveBakeTimerSources(currentAudio);
  void currentAudio.context.close();
}

function getSafeBakeTimerSoundPattern(cue: BakeTimerSoundCue, themeId: BakeTimerSoundThemeId): readonly BakeTimerSoundTone[] {
  try {
    return getBakeTimerSoundPatternForTheme(cue, themeId);
  } catch {
    return getBakeTimerSoundPatternForTheme(cue, CLASSIC_BAKE_TIMER_SOUND_THEME_ID);
  }
}

function getOrCreateBakeTimerAudioEngine(audioRef: BakeTimerAudioRef, AudioCtor: typeof AudioContext) {
  if (audioRef.current && audioRef.current.context.state !== "closed") return audioRef.current;
  const context = new AudioCtor();
  const engine = { context, sources: new Set<AudioScheduledSourceNode>() };
  audioRef.current = engine;
  return engine;
}

export function playBakeTimerCue({
  audioRef,
  enabled,
  cue,
  themeId = CLASSIC_BAKE_TIMER_SOUND_THEME_ID,
  delaySeconds = 0,
}: {
  audioRef: BakeTimerAudioRef;
  enabled: boolean;
  cue: BakeTimerSoundCue;
  themeId?: BakeTimerSoundThemeId;
  delaySeconds?: number;
}) {
  if (!enabled || typeof window === "undefined") return;
  const AudioCtor = window.AudioContext ?? (window as WindowWithAudio).webkitAudioContext;
  if (!AudioCtor) return;

  try {
    const engine = getOrCreateBakeTimerAudioEngine(audioRef, AudioCtor);
    const context = engine.context;
    if (context.state === "suspended") void context.resume?.();

    for (const tone of getSafeBakeTimerSoundPattern(cue, themeId)) {
      const startAt = context.currentTime + delaySeconds + tone.offset;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      engine.sources.add(oscillator);
      oscillator.type = tone.type ?? "sine";
      oscillator.frequency.setValueAtTime(tone.frequency, startAt);
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(Math.min(tone.gain, 0.24), startAt + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + tone.length);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.addEventListener("ended", () => {
        engine.sources.delete(oscillator);
        oscillator.disconnect();
        gain.disconnect();
      }, { once: true });
      oscillator.start(startAt);
      oscillator.stop(startAt + tone.length + 0.03);
    }
  } catch {
    // Audio must never block the visual timer.
  }
}
