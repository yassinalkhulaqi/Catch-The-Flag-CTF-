import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PathModule } from "@/lib/types";

type NodeState = "locked" | "complete" | "current" | "upcoming";

/**
 * Visual order of modules. Locked means the server said the path cannot start.
 * Complete and current come from lesson counts on the path payload.
 */
export function PathMap({
  modules,
  locked,
  canOpen,
}: {
  modules: PathModule[];
  locked: boolean;
  canOpen: boolean;
}) {
  const ordered = [...modules].sort((a, b) => a.position - b.position);
  const currentIndex = locked
    ? -1
    : ordered.findIndex(
        (module) => module.lesson_count === 0 || module.completed_lesson_count < module.lesson_count,
      );

  return (
    <ol className="relative space-y-0 border-s border-border ps-6">
      {ordered.map((module, index) => {
        const done = module.lesson_count > 0 && module.completed_lesson_count >= module.lesson_count;
        const state: NodeState = locked ? "locked" : done ? "complete" : index === currentIndex ? "current" : "upcoming";
        return (
          <li key={module.id} className="relative pb-6">
            <span
              aria-hidden="true"
              className={cn(
                "absolute -start-[1.7rem] top-1 size-3 rounded-full border-2 border-background",
                state === "complete" && "bg-success",
                state === "current" && "path-node-current bg-accent",
                state === "upcoming" && "bg-border-strong",
                state === "locked" && "bg-surface-raised",
              )}
            />
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="font-mono text-[11px] uppercase text-faint">
                Module {module.position}
                <span className="ms-2">{labelFor(state)}</span>
              </p>
              <h3 className="mt-1 text-base font-semibold">{module.title}</h3>
              {module.description ? <p className="mt-1 text-sm text-muted">{module.description}</p> : null}
              {state === "locked" ? (
                <p className="mt-2 text-sm text-muted">Complete the required paths before this module opens.</p>
              ) : (
                <p className="mt-2 font-mono text-xs text-faint">
                  {module.completed_lesson_count}/{module.lesson_count} lessons
                </p>
              )}
              {canOpen && state !== "locked" ? (
                <Link href={`/modules/${module.id}`} className={cn(buttonVariants("outline", "sm"), "mt-3")}>
                  Open module
                </Link>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function labelFor(state: NodeState): string {
  if (state === "complete") return "Complete";
  if (state === "current") return "Current";
  if (state === "locked") return "Locked";
  return "Ahead";
}
