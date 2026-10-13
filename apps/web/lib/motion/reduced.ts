"use client";

import { useSyncExternalStore } from "react";

function motionQuery(): MediaQueryList | null {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return null;
  return window.matchMedia("(prefers-reduced-motion: reduce)");
}

function subscribeReduced(onChange: () => void): () => void {
  const query = motionQuery();
  if (!query) return () => undefined;
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function reducedSnapshot(): boolean {
  return motionQuery()?.matches ?? false;
}

/** True when the user asked the OS to reduce motion. */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReduced, reducedSnapshot, () => false);
}

function ambientSnapshot(): boolean {
  if (reducedSnapshot()) return false;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (connection?.saveData) return false;
  if (typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 2) return false;
  return true;
}

/**
 * Ambient canvas is allowed only when motion is welcome, data-saver is off,
 * and the device reports more than two cores.
 */
export function useAmbientAllowed(): boolean {
  return useSyncExternalStore(subscribeReduced, ambientSnapshot, () => false);
}

export function prefersReducedMotion(): boolean {
  return reducedSnapshot();
}
