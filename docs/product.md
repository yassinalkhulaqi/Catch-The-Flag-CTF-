# Catch The Flag — Product Specification

> Vision, scope boundaries, and user journeys
> Companion: [roadmap.md](roadmap.md) · [architecture.md](architecture.md)

---

## 1. What Catch The Flag is

**Catch The Flag (CTF)** is a modern cybersecurity learning and CTF platform.
Learners follow structured **paths** (theory → practice → challenge), solve
**static/file-based challenges** across core security disciplines, earn **XP**,
unlock **achievements**, and climb the **leaderboard**.

It is *not* a collection of live hackable machines in V1 — and that is a
deliberate product decision: static challenges (forensics, malware, crypto,
RE, OSINT, steganography) require zero infrastructure risk, are cheap to scale,
and already form the backbone of real CTF competitions.

**Positioning:** professional training ground for SOC analysts, DFIR
practitioners, and CTF players — technical, credible, calm. Not a "hacker meme"
aesthetic, not a clone of existing platforms.

---

## 2. Product pillars

1. **Security first** — flags, files, accounts, and admin actions are hardened
   by design (security.md).
2. **Structured learning** — paths with modules, lessons, quizzes, and linked
   challenges turn scattered challenges into a curriculum.
3. **Honest progression** — deterministic XP, progress, and leaderboard rules;
   everything computed server-side.
4. **Content at scale without code** — admins author complete challenges
   (files, hints, flags, categories) through the admin panel.
5. **Extensible foundation** — the same core will later host interactive labs
   without a rewrite.

---

## 3. Domain at a glance

```
                CATCH THE FLAG
                       │
      ┌────────────────┴────────────────┐
      │                                 │
   LEARNING                           CTF
      │                                 │
   Paths                          Challenges
      │                                 │
 ┌────┴─────┐                    ┌──────┴──────┐
 │          │                    │             │
Theory   Practice             Static         Labs
 (V1)       (V1)            (V1: files)   (V2+: machines,
 │                                         web, VPN, AD)
Courses / Certificates (V3)
```

### V1 challenge categories (data-driven, extensible)
SOC · Digital Forensics / DFIR · Network Forensics · Malware Analysis ·
Reverse Engineering · Cryptography · OSINT · Steganography
*(new categories = admin action, never a code change — ADR-0005)*

---

## 4. User journeys (V1)

### Learner
```
Discover (home / search)
   → Choose Path
   → Start Path (progress row created)
   → Study Lesson (theory)
   → Practice linked Challenge (download files, submit flag)
   → Earn XP + unlock hints cost points
   → Complete Quiz (knowledge check)
   → Module complete → Path complete
   → Achievement unlocked → Leaderboard rank updates
   → Continue next Path
```

### Player (challenge-first)
```
Browse/filter challenges → Detail (scenario, files, hints)
   → Solve → instant feedback → XP/leaderboard → related challenges
```

### Author/Admin
```
Draft challenge → scenario/category/difficulty/points
   → upload files → add hints → configure flag (write-only)
   → preview → Review → Publish (audited) → stats/audit trail
```

---

## 5. V1 scope (in)

Authentication & profiles · dashboard · paths/modules/lessons · quizzes ·
challenges (files, flags, hints, tags, categories, difficulty, points) ·
submissions & solves · XP ledger · deterministic progress · global leaderboard ·
achievements · search & filtering · admin content workflow
(draft→review→published→archived) · secure file uploads/downloads ·
rate limiting · audit logging · notifications (achievement/path) ·
tests & documentation.

## 6. Explicitly out of scope for V1

Live machines · VPS · Docker labs · VPN · pentest targets · Windows/Linux
target VMs · Active Directory labs · browser-based Kali · web exploitation
sandboxes · real-time shells · container orchestration · Kubernetes · teams ·
CTF events · courses/certificates · weekly leaderboards.

These are **product decisions**, not forgotten features — see roadmap.md for
when they arrive and what architecture already anticipates them.

---

## 7. UX / visual identity

- **Dark-first**, with a light theme and a system theme for signed-in users. Technical, clean, high readability, strong hierarchy;
  one restrained accent (signal amber) + neutral graphite surfaces. No neon
  washes, no glow-everything.
- Original identity for **Catch The Flag / CTF**: a "flag marker" motif,
  monospace technical labels, data-dense but calm layouts.
- Responsive across mobile → desktop; accessible (keyboard, focus states,
  contrast ≥ WCAG AA, ARIA on interactive patterns).
- Admin panel optimized for the authoring flow: one screen per step
  (info → scenario → files → hints → flag → preview → publish).

---

## 8. Definition of Done (V1)

Runs locally (web + api + db) · migrations & seeds work · auth + roles work ·
admin can author paths/lessons/challenges/files/hints/flags and publish ·
learners can browse paths, study lessons, download files, submit flags ·
correct flag → solve + XP + progress + leaderboard update; duplicates handled ·
security & critical-flow tests pass · README/architecture/security/deployment
docs complete and accurate · AGENTS.md truthful.
