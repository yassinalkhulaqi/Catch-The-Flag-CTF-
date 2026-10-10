"use client";

import { useRef, useState } from "react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Accordion } from "@/components/ui/accordion";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { DropdownMenu } from "@/components/ui/dropdown";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Popover } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { Tooltip } from "@/components/ui/tooltip";
import { CATEGORY_FALLBACKS } from "@/lib/design/category";
import { COLOR_TOKENS, MOTION, RADIUS_SCALE, Z_INDEX } from "@/lib/design/tokens";
import { levelFromXp } from "@/lib/design/level";
import { prefersReducedMotion } from "@/lib/motion/reduced";
import { playSolve } from "@/lib/motion/solve";

const DIFFICULTIES = ["beginner", "intermediate", "advanced", "expert"] as const;

export function DesignGallery() {
  const toast = useToast();
  const [dialog, setDialog] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [points, setPoints] = useState(250);
  const [enabled, setEnabled] = useState(true);
  const [discipline, setDiscipline] = useState("dfir");
  const level = levelFromXp(450);
  const solveRef = useRef<HTMLDivElement>(null);
  const [previewPoints, setPreviewPoints] = useState<number | null>(null);
  const [burstPlayed, setBurstPlayed] = useState(false);

  return (
    <div className="mx-auto max-w-6xl space-y-16 px-4 py-10">
      <header className="space-y-3">
        <p className="type-eyebrow text-accent">Dev only</p>
        <h1 className="type-display">Design system</h1>
        <p className="max-w-2xl text-muted">
          Tokens, type, and components for Catch The Flag. Graphite surfaces, one signal amber,
          and motion that stays quiet unless the moment earns it.
        </p>
        <ThemeSwitcher initial="dark" signedIn={false} />
      </header>

      <section className="space-y-4" aria-labelledby="type-heading">
        <h2 id="type-heading" className="type-heading">Type</h2>
        <p className="type-display">Catch the flag</p>
        <p className="type-title">Learn. Hunt. Capture.</p>
        <p className="type-eyebrow text-accent">Eyebrow / mono</p>
        <p className="max-w-prose text-muted">
          Source Sans for reading. Fraunces for titles. IBM Plex Mono for flags, points, and
          terminal copy. IBM Plex Sans Arabic takes over when the document is RTL.
        </p>
        <p className="font-mono text-sm text-accent">CTF{"{"}development_only_example{"}"}</p>
      </section>

      <section className="space-y-4" aria-labelledby="color-heading">
        <h2 id="color-heading" className="type-heading">Color</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COLOR_TOKENS.map((token) => (
            <li key={token.name} className="flex items-center gap-3 rounded-lg border border-border p-3">
              <span
                aria-hidden="true"
                className="size-10 shrink-0 rounded-md border border-border"
                style={{ background: `var(${token.cssVar})` }}
              />
              <span>
                <span className="block font-mono text-xs">{token.name}</span>
                <span className="block text-xs text-muted">{token.role}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4" aria-labelledby="difficulty-heading">
        <h2 id="difficulty-heading" className="type-heading">Difficulty and disciplines</h2>
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map((difficulty) => (
            <Badge key={difficulty} className="normal-case" style={{ color: `var(--difficulty-${difficulty})` }}>
              {difficulty}
            </Badge>
          ))}
        </div>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORY_FALLBACKS.map((category) => (
            <li key={category.slug} className="flex items-center gap-2 text-sm">
              <span className="size-2.5 rounded-full" style={{ background: `var(${category.token})` }} />
              {category.label}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4" aria-labelledby="scale-heading">
        <h2 id="scale-heading" className="type-heading">Radius, elevation, motion, z-index</h2>
        <div className="flex flex-wrap gap-3">
          {RADIUS_SCALE.map((radius) => (
            <div
              key={radius.name}
              className="grid size-16 place-items-center border border-border bg-surface text-xs"
              style={{ borderRadius: `var(${radius.cssVar})` }}
            >
              {radius.name}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="rounded-lg bg-surface px-4 py-3 shadow-sm">shadow-sm</div>
          <div className="rounded-lg bg-surface px-4 py-3 shadow-md">shadow-md</div>
          <div className="rounded-lg bg-surface px-4 py-3 shadow-glow">glow</div>
        </div>
        <p className="font-mono text-xs text-muted">
          {Object.entries(MOTION.duration)
            .map(([name, ms]) => `${name} ${ms}ms`)
            .join(" · ")}
        </p>
        <p className="font-mono text-xs text-faint">
          {Z_INDEX.map((layer) => `${layer.name}:${layer.value}`).join("  ")}
        </p>
      </section>

      <section className="space-y-4" aria-labelledby="button-heading">
        <h2 id="button-heading" className="type-heading">Buttons</h2>
        <div className="flex flex-wrap gap-2">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button loading>Saving</Button>
          <Button disabled>Disabled</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2" aria-labelledby="field-heading">
        <div className="space-y-4">
          <h2 id="field-heading" className="type-heading">Fields</h2>
          <Field label="Flag" htmlFor="gallery-flag" hint="The server compares this. Nothing is stored in the page.">
            <Input id="gallery-flag" placeholder="flag{…}" autoComplete="off" />
          </Field>
          <Field label="Notes" htmlFor="gallery-notes" error="Keep flags out of the write-up.">
            <Textarea id="gallery-notes" defaultValue="Triage the auth log before the pcap." />
          </Field>
          <Select
            id="gallery-discipline"
            label="Discipline"
            value={discipline}
            onValueChange={setDiscipline}
            options={[
              { value: "soc", label: "SOC" },
              { value: "dfir", label: "Digital forensics" },
              { value: "malware", label: "Malware analysis" },
            ]}
          />
          <Slider id="gallery-points" label="Points filter" min={0} max={1000} step={50} value={points} onValueChange={setPoints} />
          <div className="flex items-center gap-3">
            <Switch checked={enabled} onCheckedChange={setEnabled} label="Show solved challenges" />
            <span className="text-sm text-muted">{enabled ? "Solved visible" : "Solved hidden"}</span>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Level is a view of XP</CardTitle>
            <CardDescription>450 XP sits halfway through level {level.level}. The API still owns the number.</CardDescription>
          </CardHeader>
          <Progress value={level.into} max={level.span} label="XP toward next level" />
          <div className="mt-4 flex items-center gap-3">
            <Avatar name="Amina Farouk" />
            <div>
              <p className="text-sm font-semibold">Amina Farouk</p>
              <p className="font-mono text-xs text-muted">Level {level.level}</p>
            </div>
          </div>
        </Card>
      </section>

      <section className="space-y-4" aria-labelledby="solve-heading" ref={solveRef}>
        <h2 id="solve-heading" className="type-heading">Solve moment</h2>
        <p className="max-w-2xl text-sm text-muted">
          This preview uses 120 points locally. A real solve waits for the server, then runs the same timeline. Reduced motion skips the burst and shows the final number.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={() => {
              const rect = solveRef.current?.getBoundingClientRect();
              void playSolve({
                origin: rect ? { x: rect.left + rect.width / 2, y: rect.top + 24 } : null,
                points: 120,
                reduced: prefersReducedMotion(),
              }).then((plan) => {
                setPreviewPoints(plan.points);
                setBurstPlayed(plan.celebrate);
              });
            }}
          >
            Play solve preview
          </Button>
          {previewPoints !== null ? (
            <p role="status" className="text-sm text-success">
              Final points {previewPoints}. Burst {burstPlayed ? "played" : "skipped"}.
            </p>
          ) : null}
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="overlay-heading">
        <h2 id="overlay-heading" className="type-heading">Overlays</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => setDialog(true)}>Open dialog</Button>
          <Button variant="outline" onClick={() => setSheet(true)}>Open sheet</Button>
          <Popover label="Hint cost" trigger={<Button variant="secondary">Popover</Button>}>
            Unlocking this hint costs 20 points. The deduction happens on the server.
          </Popover>
          <DropdownMenu
            label="Challenge actions"
            trigger={<Button variant="outline">Menu</Button>}
            items={[
              { id: "copy", label: "Copy link", onSelect: () => toast.push({ tone: "info", title: "Link copied" }) },
              { id: "save", label: "Save for later", onSelect: () => toast.push({ tone: "success", title: "Saved on this device" }) },
            ]}
          />
          <Tooltip content="Files are downloaded, never executed.">
            <button type="button" className="rounded-md border border-border px-3 py-2 text-sm">
              Tooltip
            </button>
          </Tooltip>
          <Button
            variant="ghost"
            onClick={() => toast.push({ tone: "success", title: "Correct flag", description: "+120 XP from the server." })}
          >
            Toast
          </Button>
        </div>
        <Breadcrumb
          items={[
            { href: "/", label: "Home" },
            { href: "/challenges", label: "Challenges" },
            { label: "Auth log triage" },
          ]}
        />
        <p className="text-sm text-muted">
          Shortcut hint <Kbd>Ctrl</Kbd> <Kbd>K</Kbd>
        </p>
      </section>

      <Tabs
        label="Component samples"
        items={[
          {
            id: "table",
            label: "Table",
            panel: (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead>XP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-mono text-accent">#1</TableCell>
                    <TableCell>Amina Farouk</TableCell>
                    <TableCell className="font-mono">12,480</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-accent">#2</TableCell>
                    <TableCell>Jonas Keller</TableCell>
                    <TableCell className="font-mono">11,020</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            ),
          },
          {
            id: "accordion",
            label: "Accordion",
            panel: (
              <Accordion
                items={[
                  { id: "files", title: "Treat every file as hostile", content: "Downloads are attachments. The platform never runs them." },
                  { id: "flags", title: "Flags stay on the server", content: "The page posts the guess and renders only correct, incorrect, or already solved." },
                ]}
              />
            ),
          },
          {
            id: "skeleton",
            label: "Skeleton",
            panel: (
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/3" label="Loading title" />
                <Skeleton className="h-16 w-full" label="Loading card" />
              </div>
            ),
          },
        ]}
      />

      <Dialog open={dialog} onClose={() => setDialog(false)} title="Submit this flag?" description="The server decides. This dialog does not award points.">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDialog(false)}>Cancel</Button>
          <Button onClick={() => setDialog(false)}>Submit</Button>
        </div>
      </Dialog>
      <Sheet open={sheet} onClose={() => setSheet(false)} title="Challenge filters">
        <p className="text-sm text-muted">Category, difficulty, and points stay in the URL when you apply them on the challenge list.</p>
      </Sheet>
    </div>
  );
}
