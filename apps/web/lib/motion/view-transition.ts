import { prefersReducedMotion } from "@/lib/motion/reduced";

type StartViewTransition = (callback: () => void) => void;

/** Run a navigation inside the View Transitions API when the browser and user allow it. */
export function withViewTransition(run: () => void): void {
  const start =
    typeof document === "undefined"
      ? undefined
      : (document as Document & { startViewTransition?: StartViewTransition }).startViewTransition;
  if (!start || prefersReducedMotion()) {
    run();
    return;
  }
  start(run);
}
