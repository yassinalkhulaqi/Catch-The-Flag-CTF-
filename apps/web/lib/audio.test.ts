import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MUTED_STORAGE_KEY } from "@/lib/audio";

function stubMatchMedia(matches: boolean): void {
  window.matchMedia = ((query: string) => ({
    matches,
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
    onchange: null,
  })) as typeof window.matchMedia;
}

/**
 * Constructable stub — `new` on a vi.fn() is not a reliable constructor,
 * so tests use a real class (like the browser's AudioContext).
 */
function stubAudioContext() {
  const oscillator = {
    type: "sine" as OscillatorType,
    frequency: { setValueAtTime: vi.fn() },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
  const gainNode = {
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
  };
  class MockAudioContext {
    static instances: MockAudioContext[] = [];
    state: AudioContextState = "running";
    currentTime = 0;
    destination = {};
    resume = vi.fn();
    createOscillator = vi.fn(() => oscillator);
    createGain = vi.fn(() => gainNode);
    constructor() {
      MockAudioContext.instances.push(this);
    }
  }
  vi.stubGlobal("AudioContext", MockAudioContext as unknown as typeof AudioContext);
  return { MockAudioContext, oscillator };
}

describe("lib/audio", () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    stubMatchMedia(false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.matchMedia = originalMatchMedia;
  });

  it("persists the muted preference to localStorage", async () => {
    const audio = await import("@/lib/audio");
    expect(audio.isMuted()).toBe(false);

    audio.setMuted(true);
    expect(audio.isMuted()).toBe(true);
    expect(localStorage.getItem(MUTED_STORAGE_KEY)).toBe("1");

    audio.setMuted(false);
    expect(audio.isMuted()).toBe(false);
    expect(localStorage.getItem(MUTED_STORAGE_KEY)).toBe("0");
  });

  it("no-ops every player when muted without touching AudioContext", async () => {
    const { MockAudioContext } = stubAudioContext();
    const audio = await import("@/lib/audio");

    audio.setMuted(true);
    audio.playClick();
    audio.playType();
    audio.playUnlock();
    audio.playFanfare();

    expect(MockAudioContext.instances).toHaveLength(0);
  });

  it("plays through AudioContext when unmuted", async () => {
    const { MockAudioContext, oscillator } = stubAudioContext();
    const audio = await import("@/lib/audio");

    audio.setMuted(false);
    audio.playClick();

    expect(MockAudioContext.instances).toHaveLength(1);
    expect(MockAudioContext.instances[0]?.createOscillator).toHaveBeenCalled();
    expect(oscillator.start).toHaveBeenCalled();
  });

  it("no-ops when reduced motion is preferred", async () => {
    stubMatchMedia(true);
    const { MockAudioContext } = stubAudioContext();
    const audio = await import("@/lib/audio");

    audio.setMuted(false);
    audio.playClick();
    audio.playType();
    audio.playUnlock();
    audio.playFanfare();

    expect(MockAudioContext.instances).toHaveLength(0);
  });

  it("no-ops when AudioContext is unavailable", async () => {
    vi.stubGlobal("AudioContext", undefined);
    const audio = await import("@/lib/audio");

    audio.setMuted(false);
    expect(() => {
      audio.playClick();
      audio.playFanfare();
    }).not.toThrow();
  });
});
