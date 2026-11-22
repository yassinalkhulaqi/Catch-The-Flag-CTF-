"use client";

import { Focus, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/en";
import { cn } from "@/lib/utils";

export function FocusToggle({
  active,
  onToggle,
  copy,
  className,
}: {
  active: boolean;
  onToggle: () => void;
  copy: Dictionary["focus"];
  className?: string;
}) {
  const Icon = active ? Minimize2 : Focus;
  return (
    <Button
      variant={active ? "secondary" : "primary"}
      size="sm"
      onClick={onToggle}
      aria-pressed={active}
      className={cn("shadow-[var(--shadow-float)]", className)}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {active ? copy.disable : copy.enable}
    </Button>
  );
}
