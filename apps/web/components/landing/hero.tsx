"use client";

import Link from "next/link";
import { AmbientGrid } from "@/lib/motion/ambient-grid";
import { GlitchText } from "@/lib/motion/glitch";
import { Magnetic } from "@/lib/motion/magnetic";
import { Typewriter } from "@/lib/motion/typewriter";
import { buttonVariants } from "@/components/ui/button";
import { useDictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LandingHero({ signedIn }: { signedIn: boolean }) {
  const copy = useDictionary();
  return (
    <section className="relative overflow-hidden">
      <AmbientGrid className="pointer-events-none absolute inset-0 opacity-70" />
      <div className="atmosphere relative mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-6xl flex-col justify-center px-4 py-20">
        <p className="type-eyebrow text-accent">{copy.hero.eyebrow}</p>
        <h1 className="type-display mt-4 max-w-4xl text-foreground">
          <GlitchText text={copy.hero.title} />
        </h1>
        <Typewriter
          className="mt-5 max-w-xl font-mono text-sm text-muted sm:text-base"
          lines={[...copy.hero.lines]}
        />
        <div className="mt-10 flex flex-wrap gap-3">
          <Magnetic>
            <Link href={signedIn ? "/dashboard" : "/register"} className={cn(buttonVariants("primary", "lg"))}>
              {signedIn ? copy.hero.continue : copy.hero.start}
            </Link>
          </Magnetic>
          <Link href="/challenges" className={cn(buttonVariants("outline", "lg"))}>
            {copy.hero.browse}
          </Link>
        </div>
      </div>
    </section>
  );
}
