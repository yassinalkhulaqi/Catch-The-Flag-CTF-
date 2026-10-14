"use client";

import { useSyncExternalStore } from "react";
import { prefersReducedMotion } from "@/lib/motion/reduced";

/**
 * Tiny WebAudio synth for UI feedback (clicks, unlock chimes, fanfares).
 * No dependencies — WebAudio only. Every player no-ops during SSR, when
 * muted, when reduced motion is preferred, or when AudioContext is missing.
 */

export const MUTED_STORAGE_KEY = "ctf-muted";

type MutedListener = () => void;

const listeners = new Set<MutedListener>();
let mutedCache: boolean | null = null;

function readStoredMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(MUTED_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Current mute state. Safe during SSR (returns the cached value, else false). */
export function isMuted(): boolean {
  if (mutedCache === null) {
    mutedCache = readStoredMuted();
  }
  return mutedCache;
}

/** Persist the mute preference and notify subscribers. Never throws. */
export function setMuted(muted: boolean): void {
  mutedCache = muted;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(MUTED_STORAGE_KEY, muted ? "1" : "0");
    } catch {
      /* Storage unavailable (private mode) — the in-memory value still applies. */
    }
  }
  for (const listener of listeners) listener();
}

function subscribeMuted(listener: MutedListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** React binding for the persisted mute preference. */
export function useMuted(): boolean {
  return useSyncExternalStore(subscribeMuted, isMuted, () => false);
}

interface ToneOptions {
  frequency: number;
  /** Offset in seconds from now. */
  startAt: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
}

let sharedContext: AudioContext | null = null;

function contextConstructor(): typeof AudioContext | null {
  if (typeof window === "undefined") return null;
  const withLegacy = window as Window & { webkitAudioContext?: typeof AudioContext };
  return window.AudioContext ?? withLegacy.webkitAudioContext ?? null;
}

function getSharedContext(): AudioContext | null {
  if (sharedContext) {
    return sharedContext.state === "closed" ? null : sharedContext;
  }
  const Ctor = contextConstructor();
  if (!Ctor) return null;
  try {
    sharedContext = new Ctor();
  } catch {
    return null;
  }
  return sharedContext;
}

function playTone({ frequency, startAt, duration, type = "sine", gain = 0.06 }: ToneOptions): void {
  const context = getSharedContext();
  if (!context) return;
  try {
    if (context.state === "suspended") void context.resume();
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now + startAt);
    envelope.gain.setValueAtTime(0.0001, now + startAt);
    envelope.gain.exponentialRampToValueAtTime(Math.max(gain, 0.0002), now + startAt + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + startAt + duration);
    oscillator.connect(envelope);
    envelope.connect(context.destination);
    oscillator.start(now + startAt);
    oscillator.stop(now + startAt + duration + 0.02);
  } catch {
    /* Audio must never break the UI. */
  }
}

/** Audible only when the client allows sound: client-side, unmuted, full motion. */
function canPlay(): boolean {
  if (typeof window === "undefined") return false;
  if (isMuted()) return false;
  if (prefersReducedMotion()) return false;
  return contextConstructor() !== null;
}

/** Short UI click for toggles and buttons. */
export function playClick(): void {
  if (!canPlay()) return;
  playTone({ frequency: 660, startAt: 0, duration: 0.06, type: "square", gain: 0.03 });
}

/** Soft key tick for typewriter/progress moments. */
export function playType(): void {
  if (!canPlay()) return;
  playTone({ frequency: 880, startAt: 0, duration: 0.035, type: "sine", gain: 0.025 });
}

/** Two-note ascending chime for unlocks. */
export function playUnlock(): void {
  if (!canPlay()) return;
  playTone({ frequency: 523.25, startAt: 0, duration: 0.12, type: "sine", gain: 0.06 });
  playTone({ frequency: 783.99, startAt: 0.1, duration: 0.18, type: "sine", gain: 0.06 });
}

/** Four-note arpeggio for challenge solves. */
export function playFanfare(): void {
  if (!canPlay()) return;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((frequency, index) => {
    playTone({ frequency, startAt: index * 0.11, duration: 0.2, type: "triangle", gain: 0.06 });
  });
}
