import { afterEach, describe, expect, it } from "vitest";
import {
  closeBakeTimerAudioContext,
  playBakeTimerCue,
  type BakeTimerAudioEngine,
} from "@/lib/bake-timer-audio";

class FakeGain {
  gain = {
    setValueAtTime: () => undefined,
    exponentialRampToValueAtTime: () => undefined,
  };
  connect() {}
  disconnect() {}
}

class FakeOscillator {
  static instances: FakeOscillator[] = [];
  frequency = { setValueAtTime: () => undefined };
  stopCalls = 0;
  startCalls = 0;
  type: OscillatorType = "sine";

  constructor() {
    FakeOscillator.instances.push(this);
  }

  connect() {}
  disconnect() {}
  start() {
    this.startCalls += 1;
  }
  stop() {
    this.stopCalls += 1;
  }
  addEventListener() {}
}

class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  currentTime = 0;
  destination = {};
  closeCalls = 0;
  resumeCalls = 0;
  state: AudioContextState = "suspended";

  constructor() {
    FakeAudioContext.instances.push(this);
  }

  createOscillator() {
    return new FakeOscillator();
  }

  createGain() {
    return new FakeGain();
  }

  resume() {
    this.resumeCalls += 1;
    this.state = "running";
    return Promise.resolve();
  }

  close() {
    this.closeCalls += 1;
    this.state = "closed";
    return Promise.resolve();
  }
}

const originalWindow = globalThis.window;

function installAudioWindow(AudioCtor: typeof AudioContext | null = FakeAudioContext as unknown as typeof AudioContext) {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: AudioCtor ? { AudioContext: AudioCtor } : {},
  });
}

function resetFakes() {
  FakeAudioContext.instances = [];
  FakeOscillator.instances = [];
}

afterEach(() => {
  resetFakes();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: originalWindow,
  });
});

describe("Bake Timer audio lifecycle", () => {
  it("reuses one shared audio engine across cues and resumes suspended audio", () => {
    installAudioWindow();
    const audio = { current: null } as { current: BakeTimerAudioEngine | null };

    playBakeTimerCue({ audioRef: audio, enabled: true, cue: "normal", themeId: "bell" });
    playBakeTimerCue({ audioRef: audio, enabled: true, cue: "final_ten", themeId: "robot-chef" });

    expect(FakeAudioContext.instances).toHaveLength(1);
    expect(FakeAudioContext.instances[0].resumeCalls).toBe(1);
    expect(audio.current?.sources.size).toBeGreaterThan(0);
    expect(FakeOscillator.instances.every((source) => source.startCalls === 1)).toBe(true);
  });

  it("stops active tones and releases the context on cleanup", () => {
    installAudioWindow();
    const audio = { current: null } as { current: BakeTimerAudioEngine | null };

    playBakeTimerCue({ audioRef: audio, enabled: true, cue: "expired", themeId: "dark-commander" });
    const context = FakeAudioContext.instances[0];

    closeBakeTimerAudioContext(audio);

    expect(audio.current).toBeNull();
    expect(context.closeCalls).toBe(1);
    expect(FakeOscillator.instances.every((source) => source.stopCalls >= 2)).toBe(true);
  });

  it("creates a fresh engine after a closed context without replaying old sources", () => {
    installAudioWindow();
    const audio = { current: null } as { current: BakeTimerAudioEngine | null };

    playBakeTimerCue({ audioRef: audio, enabled: true, cue: "normal", themeId: "classic" });
    closeBakeTimerAudioContext(audio);
    playBakeTimerCue({ audioRef: audio, enabled: true, cue: "normal", themeId: "classic" });

    expect(FakeAudioContext.instances).toHaveLength(2);
    expect(audio.current?.context).toBe(FakeAudioContext.instances[1]);
  });

  it("does not create audio when muted or unsupported", () => {
    const audio = { current: null } as { current: BakeTimerAudioEngine | null };

    installAudioWindow();
    playBakeTimerCue({ audioRef: audio, enabled: false, cue: "normal", themeId: "classic" });
    expect(FakeAudioContext.instances).toHaveLength(0);

    installAudioWindow(null);
    playBakeTimerCue({ audioRef: audio, enabled: true, cue: "normal", themeId: "classic" });
    expect(audio.current).toBeNull();
  });
});
