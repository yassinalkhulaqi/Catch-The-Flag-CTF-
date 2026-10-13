<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\ContentStatus;
use App\Enums\Difficulty;
use App\Enums\QuizQuestionType;
use App\Models\Category;
use App\Models\Challenge;
use App\Models\Lesson;
use App\Models\Path;
use App\Models\PathModule;
use App\Models\Quiz;
use App\Models\QuizOption;
use App\Models\QuizQuestion;
use Illuminate\Database\Seeder;

/**
 * The demo learning path "DFIR Fundamentals": 2 modules, 4 lessons with
 * real markdown content, 1 lesson-attached quiz (module_id/lesson_id XOR),
 * and 2 challenges linked via the lesson_challenge pivot.
 *
 * Idempotency: paths keyed on slug, modules on (path_id, title), lessons
 * on (module_id, slug), quizzes on (lesson_id, title), questions on
 * (quiz_id, position), options on (question_id, position), pivots via
 * syncWithoutDetaching.
 */
class PathSeeder extends Seeder
{
    public function run(): void
    {
        $categoryId = Category::where('slug', 'forensics')->firstOrFail()->id;

        $path = Path::updateOrCreate(
            ['slug' => 'dfir-fundamentals'],
            [
                'title' => 'DFIR Fundamentals',
                'summary' => 'Learn digital forensics and incident response: evidence handling, disk forensics, and network evidence.',
                'description' => 'A beginner-friendly path through the core DFIR workflow — from first principles and chain of custody to hands-on disk and network evidence analysis.',
                'category_id' => $categoryId,
                'difficulty' => Difficulty::Beginner,
                'estimated_minutes' => 120,
            ],
        );
        $path->forceFill(['status' => ContentStatus::Published->value]);
        if ($path->published_at === null) {
            $path->forceFill(['published_at' => now()]);
        }
        if ($path->isDirty()) {
            $path->save();
        }

        $foundations = $this->module($path, 'Foundations of DFIR', 'What DFIR is and how to handle evidence without destroying it.', 0);
        $analysis = $this->module($path, 'Evidence Analysis', 'Hands-on techniques for disk and network evidence.', 1);

        $intro = $this->lesson($foundations, 'what-is-dfir', 'What is DFIR?', 'Digital forensics meets incident response.', 0, 15, <<<'MD'
            # What is DFIR?

            **Digital Forensics and Incident Response (DFIR)** combines two disciplines:

            - **Digital forensics** — the science of recovering and investigating material found in digital devices: disk images, memory dumps, logs, and network captures.
            - **Incident response** — the organized process of detecting, containing, eradicating, and recovering from security incidents.

            ## The incident response lifecycle

            1. **Preparation** — build playbooks, tooling, and baselines before anything happens.
            2. **Detection & analysis** — triage alerts, scope the incident, preserve evidence.
            3. **Containment** — short-term isolation, then long-term fixes that keep the attacker out.
            4. **Eradication & recovery** — remove the cause and restore systems safely.
            5. **Post-incident review** — write the timeline, fix the gaps, update the playbooks.

            ## Order of volatility

            Collect the most ephemeral evidence first: CPU registers and cache, memory, network state, running processes, disk, and finally archival media. Every reboot or delay destroys something.

            > Key takeaway: DFIR is a methodical process. Tools find data; analysts build timelines; timelines tell the story.
            MD);

        $handling = $this->lesson($foundations, 'evidence-handling', 'Handling Evidence', 'Chain of custody and write-blocking basics.', 1, 20, <<<'MD'
            # Handling Evidence

            Evidence you cannot defend in front of an auditor — or a court — is just trivia. Two practices protect it:

            ## Chain of custody

            Document **who** collected **what**, **when**, **where**, and **why** — plus every transfer afterwards. A minimal log entry records the collector, timestamp, source device, acquisition method, and the SHA-256 hash of the image.

            ## Write blocking

            Never analyze the original. Acquire a **bit-for-bit image** through a hardware or software write blocker, verify the hash matches the source, then work only on copies. Mount images read-only (`-o ro,loop`) and keep the original sealed.

            ## Practical checklist

            - Photograph the scene and note running state before touching anything.
            - Capture memory before disk (volatility order).
            - Hash everything at acquisition time; re-verify before analysis.
            - Store hashes separately from the images.

            > Key takeaway: image first, hash always, touch the original never.
            MD);

        $disk = $this->lesson($analysis, 'disk-forensics-strings', 'Disk Forensics with Strings', 'Carving secrets out of raw bytes with strings.', 0, 25, <<<'MD'
            # Disk Forensics with Strings

            The humble `strings` utility extracts printable sequences from any file — and it is often the fastest first pass over an unknown binary or image.

            ## Basic workflow

            ```bash
            strings -n 8 suspicious.bin | less
            strings -n 8 suspicious.bin | grep -i -E 'ctf|flag|key|pass'
            ```

            The `-n` flag sets the minimum length; the default of 4 drowns you in noise on large images.

            ## What to look for

            - Embedded secrets, credentials, and keys near usage or error text.
            - URLs, IP addresses, and file paths that reveal intent.
            - Compiler banners that identify the toolchain.

            ## Limits

            `strings` misses encoded, encrypted, or wide-character data. Pair it with entropy analysis (`binwalk -E`), targeted carving, and — when the binary warrants it — a disassembler.

            > Key takeaway: start cheap with strings, then spend expensive analysis only where the strings point.
            MD);

        $pcap = $this->lesson($analysis, 'network-pcap-basics', 'Network Evidence Basics', 'Reading packet captures and spotting beacons.', 1, 30, <<<'MD'
            # Network Evidence Basics

            Packet captures are ground truth for what crossed the wire. Even a text export of one answers the core questions: **who talked to whom, when, and what did they say?**

            ## Triage with tshark

            ```bash
            tshark -r capture.pcap -Y dns          # name resolution first
            tshark -r capture.pcap -Y http         # cleartext requests stand out
            tshark -r capture.pcap -T fields -e ip.src -e ip.dst -e http.request.uri
            ```

            ## Spotting beacons

            Malware check-ins are **periodic** and **small**: same destination, same interval, same URI shape, often with an encoded token in the query string. Baseline the LAN noise (DNS, updates, NTP), then investigate the host that does not fit.

            ## Follow the stream

            Once you find the beacon, reassemble the conversation (`Follow → HTTP Stream` in Wireshark) and extract every token, command, and exfiltrated blob before scoping the host itself.

            > Key takeaway: baseline first, hunt the outlier, then follow its stream to the end.
            MD);

        $this->quizForLesson($pcap);
        $this->linkChallenge($disk, 'hidden-in-plain-sight');
        $this->linkChallenge($pcap, 'suspicious-beacon');
    }

    private function module(Path $path, string $title, string $description, int $position): PathModule
    {
        return PathModule::updateOrCreate(
            ['path_id' => $path->id, 'title' => $title],
            [
                'description' => $description,
                'position' => $position,
                'is_published' => true,
            ],
        );
    }

    private function lesson(PathModule $module, string $slug, string $title, string $summary, int $position, int $minutes, string $content): Lesson
    {
        return Lesson::updateOrCreate(
            ['module_id' => $module->id, 'slug' => $slug],
            [
                'title' => $title,
                'summary' => $summary,
                'content' => $content,
                'position' => $position,
                'estimated_minutes' => $minutes,
                'is_published' => true,
            ],
        );
    }

    private function quizForLesson(Lesson $lesson): void
    {
        // Attached to the lesson (lesson_id set, module_id null) to satisfy
        // the quizzes_parent_xor CHECK constraint.
        $quiz = Quiz::updateOrCreate(
            ['lesson_id' => $lesson->id, 'title' => 'Network Evidence Check'],
            [
                'description' => 'Two questions on beacon triage from the Network Evidence Basics lesson.',
                'pass_score' => 70,
                'position' => 0,
                'is_published' => true,
                'module_id' => null,
            ],
        );

        $q1 = QuizQuestion::updateOrCreate(
            ['quiz_id' => $quiz->id, 'position' => 0],
            [
                'question' => 'Which traffic pattern most strongly suggests a malware beacon?',
                'type' => QuizQuestionType::Single,
                'explanation' => 'Beacons are periodic check-ins: same destination and interval with small, regular requests.',
                'points' => 1,
                'position' => 0,
                'is_published' => true,
            ],
        );
        $this->option($q1, 'Periodic small requests to the same external host at a fixed interval', 0, true);
        $this->option($q1, 'One large download from a software update server', 1, false);
        $this->option($q1, 'DNS queries to the configured LAN resolver', 2, false);

        $q2 = QuizQuestion::updateOrCreate(
            ['quiz_id' => $quiz->id, 'position' => 1],
            [
                'question' => 'After identifying a suspicious HTTP beacon, what is the best next step?',
                'type' => QuizQuestionType::Single,
                'explanation' => 'Reassembling the full stream shows every token and command before host scoping.',
                'points' => 1,
                'position' => 1,
                'is_published' => true,
            ],
        );
        $this->option($q2, 'Follow the HTTP stream to recover the full conversation', 0, true);
        $this->option($q2, 'Delete the capture to save disk space', 1, false);
        $this->option($q2, 'Reboot the suspected workstation immediately', 2, false);
    }

    private function option(QuizQuestion $question, string $text, int $position, bool $correct): void
    {
        // is_correct is guarded by design; assign via forceFill.
        $option = QuizOption::updateOrCreate(
            ['question_id' => $question->id, 'position' => $position],
            ['option_text' => $text],
        );
        if ($option->is_correct !== $correct) {
            $option->forceFill(['is_correct' => $correct])->save();
        }
    }

    private function linkChallenge(Lesson $lesson, string $challengeSlug): void
    {
        $challenge = Challenge::where('slug', $challengeSlug)->firstOrFail();
        $lesson->challenges()->syncWithoutDetaching([$challenge->id]);
    }
}
