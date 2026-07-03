type BrowserAudioContext = typeof AudioContext;

let sharedContext: AudioContext | undefined;

function resolveAudioContext(): BrowserAudioContext | undefined {
  if (typeof window === "undefined") return undefined;
  return window.AudioContext ?? window.webkitAudioContext;
}

declare global {
  interface Window {
    webkitAudioContext?: BrowserAudioContext;
  }
}

export async function enableKitchenStepAudioAlerts() {
  const AudioContextConstructor = resolveAudioContext();
  if (!AudioContextConstructor) return false;

  try {
    sharedContext ??= new AudioContextConstructor();
    if (sharedContext.state === "suspended") await sharedContext.resume();

    const gain = sharedContext.createGain();
    gain.gain.setValueAtTime(0.0001, sharedContext.currentTime);
    gain.connect(sharedContext.destination);

    const oscillator = sharedContext.createOscillator();
    oscillator.frequency.setValueAtTime(440, sharedContext.currentTime);
    oscillator.connect(gain);
    oscillator.start();
    oscillator.stop(sharedContext.currentTime + 0.03);
    window.setTimeout(() => gain.disconnect(), 80);

    return true;
  } catch {
    return false;
  }
}

export async function playKitchenStepChime() {
  const AudioContextConstructor = resolveAudioContext();
  if (!AudioContextConstructor) return false;

  try {
    const context = sharedContext ?? new AudioContextConstructor();
    if (context.state === "suspended") await context.resume();
    const now = context.currentTime;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
    gain.connect(context.destination);

    const first = context.createOscillator();
    first.type = "sine";
    first.frequency.setValueAtTime(660, now);
    first.frequency.exponentialRampToValueAtTime(880, now + 0.12);
    first.connect(gain);
    first.start(now);
    first.stop(now + 0.28);

    const second = context.createOscillator();
    second.type = "triangle";
    second.frequency.setValueAtTime(440, now + 0.12);
    second.connect(gain);
    second.start(now + 0.12);
    second.stop(now + 0.42);

    if (!sharedContext) {
      window.setTimeout(() => {
        void context.close().catch(() => undefined);
      }, 650);
    }
    return true;
  } catch {
    return false;
  }
}
