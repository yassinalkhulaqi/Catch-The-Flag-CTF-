"use client";

import { Volume2, VolumeX } from "lucide-react";
import { playClick, setMuted, useMuted } from "@/lib/audio";
import { cn } from "@/lib/utils";

/** Global mute toggle for UI sound effects. Persists via lib/audio. */
export function SoundToggle({ className }: { className?: string }) {
  const muted = useMuted();

  function toggle(): void {
    if (muted) {
      // Unmute first so the confirmation click is audible.
      setMuted(false);
      playClick();
    } else {
      playClick();
      setMuted(true);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={muted}
      aria-label={muted ? "Unmute sound effects" : "Mute sound effects"}
      title={muted ? "Unmute sound effects" : "Mute sound effects"}
      className={cn(
        "inline-flex items-center rounded-md border border-border px-2 py-1 text-xs text-muted transition-colors hover:text-foreground",
        className,
      )}
    >
      {muted ? (
        <VolumeX size={14} aria-hidden="true" />
      ) : (
        <Volume2 size={14} aria-hidden="true" />
      )}
    </button>
  );
}
