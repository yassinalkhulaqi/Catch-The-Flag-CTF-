<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\ContentStatus;
use App\Enums\Difficulty;
use App\Enums\FlagValidationType;
use App\Models\Category;
use App\Models\Challenge;
use App\Models\ChallengeFile;
use App\Models\ChallengeFlag;
use App\Models\ChallengeHint;
use App\Models\Tag;
use App\Models\User;
use App\Services\FlagValidator;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * 8 playable static challenges (one per category minimum).
 *
 * Idempotency: challenges keyed on slug (updateOrCreate), flags and files
 * use first-or-skip (an existing active flag / same-named file is reused),
 * hints converge on (challenge_id, position), tag links use
 * syncWithoutDetaching.
 *
 * Flag hygiene: flag plaintext only ever exists in a local variable. It is
 * generated deterministically from the challenge slug, stored ONLY as
 * FlagValidator::encrypt() ciphertext + FlagValidator::hash() HMAC, and
 * never logged. File artifacts embed the flag at runtime so every
 * challenge is genuinely solvable from its download.
 */
class ChallengeSeeder extends Seeder
{
    public function run(): void
    {
        $authorId = User::where('email', (string) (env('SEED_ADMIN_EMAIL') ?: 'admin@example.com'))->first()?->id;

        foreach ($this->definitions() as $def) {
            $category = Category::where('slug', $def['category'])->firstOrFail();

            $challenge = Challenge::updateOrCreate(
                ['slug' => $def['slug']],
                [
                    'title' => $def['title'],
                    'description' => $def['description'],
                    'scenario' => $def['scenario'],
                    'category_id' => $category->id,
                    'difficulty' => $def['difficulty'],
                    'points' => $def['points'],
                    'estimated_minutes' => $def['minutes'],
                    'flag_validation_type' => FlagValidationType::Static,
                    'author_id' => $authorId,
                ],
            );

            // Guarded fields (status / published_at) are not mass-assignable.
            $challenge->forceFill(['status' => ContentStatus::Published->value]);
            if ($challenge->published_at === null) {
                $challenge->forceFill(['published_at' => now()]);
            }
            if ($challenge->isDirty()) {
                $challenge->save();
            }

            $this->seedFlag($challenge, $def['slug']);
            $this->seedHints($challenge, $def['hints']);

            $flag = $this->flagPlaintext($def['slug']);
            $this->seedFile($challenge, $def['file_name'], $this->fileContent($def['slug'], $flag));

            $this->attachTags($challenge, $def['tags']);
        }
    }

    /**
     * Deterministic, unique-per-challenge flag. Derived from the slug so
     * reseeds converge; never persisted or logged as plaintext.
     */
    private function flagPlaintext(string $slug): string
    {
        return sprintf('CTF{%s-%s}', $slug, substr(md5($slug), 0, 4));
    }

    private function seedFlag(Challenge $challenge, string $slug): void
    {
        $exists = ChallengeFlag::where('challenge_id', $challenge->id)
            ->where('is_active', true)
            ->exists();

        if ($exists) {
            return;
        }

        $flag = new ChallengeFlag([
            'challenge_id' => $challenge->id,
            'label' => 'flag',
            'case_sensitive' => true,
            'is_active' => true,
        ]);
        $plaintext = $this->flagPlaintext($slug);
        $flag->forceFill([
            'flag_ciphertext' => FlagValidator::encrypt($plaintext),
            'flag_hash' => FlagValidator::hash($plaintext),
        ]);
        $flag->save();
    }

    /**
     * @param  list<array{content: string, cost: int}>  $hints
     */
    private function seedHints(Challenge $challenge, array $hints): void
    {
        foreach ($hints as $position => $hint) {
            ChallengeHint::updateOrCreate(
                ['challenge_id' => $challenge->id, 'position' => $position],
                ['content' => $hint['content'], 'cost_points' => $hint['cost']],
            );
        }
    }

    private function seedFile(Challenge $challenge, string $originalName, string $content): void
    {
        $exists = ChallengeFile::where('challenge_id', $challenge->id)
            ->where('original_name', $originalName)
            ->exists();

        if ($exists) {
            return;
        }

        $storageKey = (string) Str::uuid();
        Storage::disk('challenge-files')->put($storageKey, $content);

        $file = new ChallengeFile([
            'challenge_id' => $challenge->id,
            'original_name' => $originalName,
            'storage_disk' => 'challenge-files',
            'mime_type' => 'text/plain',
            'size_bytes' => strlen($content),
            'checksum_sha256' => hash('sha256', $content),
            'visibility' => 'private',
        ]);
        $file->forceFill(['storage_key' => $storageKey]);
        $file->save();
    }

    /**
     * @param  list<string>  $slugs
     */
    private function attachTags(Challenge $challenge, array $slugs): void
    {
        $ids = [];
        foreach ($slugs as $slug) {
            $tag = Tag::firstOrCreate(
                ['slug' => $slug],
                ['name' => ucwords(str_replace('-', ' ', $slug))],
            );
            $ids[] = $tag->id;
        }
        $challenge->tags()->syncWithoutDetaching($ids);
    }

    /**
     * @return list<array{slug: string, title: string, description: string, scenario: string, category: string, difficulty: Difficulty, points: int, minutes: int, tags: list<string>, hints: list<array{content: string, cost: int}>, file_name: string}>
     */
    private function definitions(): array
    {
        return [
            [
                'slug' => 'sqli-login-bypass',
                'title' => 'Login Bypass',
                'description' => 'A vulnerable shop login builds its SQL query with string interpolation. Log in as the administrator without credentials.',
                'scenario' => 'You are testing VulnShop, a demo storefront. The login form at /login.php talks to a users table with an administrator account. Source code was leaked — find the injection and read the admin bio.',
                'category' => 'web',
                'difficulty' => Difficulty::Beginner,
                'points' => 100,
                'minutes' => 20,
                'tags' => ['sql-injection'],
                'hints' => [
                    ['content' => 'The query interpolates input directly. What happens when the username contains a single quote?', 'cost' => 10],
                    ['content' => 'Try admin as the username with a comment sequence, or an OR-based tautology, and anything as the password.', 'cost' => 20],
                ],
                'file_name' => 'login.php',
            ],
            [
                'slug' => 'rsa-small-n',
                'title' => 'Small Modulus',
                'description' => 'A training vault encrypted a one-byte demo message with textbook RSA and a factorable modulus. Recover the method, then open the vault entry.',
                'scenario' => 'Captured parameters from a legacy training vault: n is only 12 bits. Factor it, rebuild the private key, decrypt the demo byte, and read the vault entry bundled with the capture.',
                'category' => 'crypto',
                'difficulty' => Difficulty::Beginner,
                'points' => 100,
                'minutes' => 30,
                'tags' => ['rsa'],
                'hints' => [
                    ['content' => 'n = 3233 is small enough to factor by hand, with trial division, or with a five-line script.', 'cost' => 10],
                    ['content' => 'Recover p and q, compute phi, then d as the modular inverse of e. The demo byte decrypts to ASCII A.', 'cost' => 20],
                ],
                'file_name' => 'rsa-capture.txt',
            ],
            [
                'slug' => 'hidden-in-plain-sight',
                'title' => 'Hidden in Plain Sight',
                'description' => 'A poster image was exfiltrated as a base64 blob. Something is embedded in the decoded bytes — extract it.',
                'scenario' => 'Incident response recovered a suspicious blob from a compromised workstation. The file command says ASCII text, but the contents look encoded. Decode it and look for what does not belong.',
                'category' => 'forensics',
                'difficulty' => Difficulty::Beginner,
                'points' => 150,
                'minutes' => 20,
                'tags' => ['steg'],
                'hints' => [
                    ['content' => 'The blob is base64. Decode it and read the resulting note carefully.', 'cost' => 10],
                ],
                'file_name' => 'poster.b64',
            ],
            [
                'slug' => 'overflow-101',
                'title' => 'Overflow 101',
                'description' => 'A small C program copies user input into a fixed buffer with strcpy. Audit the source and find the debug backdoor credential.',
                'scenario' => 'A vendor shipped the source of an internal login helper. The code has a classic memory-safety bug and a leftover debug credential. Read the source like an auditor would.',
                'category' => 'pwn',
                'difficulty' => Difficulty::Intermediate,
                'points' => 150,
                'minutes' => 30,
                'tags' => ['elf'],
                'hints' => [
                    ['content' => 'strcpy does not check lengths. Which input overwrites the adjacent auth flag variable?', 'cost' => 10],
                    ['content' => 'Check the comments and the debug branch — developers sometimes leave credentials in source.', 'cost' => 20],
                ],
                'file_name' => 'buffer.c',
            ],
            [
                'slug' => 'strings-attached',
                'title' => 'Strings Attached',
                'description' => 'A stripped binary refuses to reveal its secrets to a disassembler-only approach. Start with the simplest static technique: strings.',
                'scenario' => 'You intercepted a Linux binary but have no time for a full reversing session. Run strings over it and look for an embedded secret among the library noise.',
                'category' => 'reverse',
                'difficulty' => Difficulty::Intermediate,
                'points' => 200,
                'minutes' => 25,
                'tags' => ['elf', 'ghidra'],
                'hints' => [
                    ['content' => 'Run `strings app.bin | grep -i ctf` and see what stands out.', 'cost' => 10],
                    ['content' => 'Real secrets often sit near error messages and usage text. Check the lines around licensing output.', 'cost' => 15],
                ],
                'file_name' => 'app.strings.txt',
            ],
            [
                'slug' => 'username-hunt',
                'title' => 'Username Hunt',
                'description' => 'A threat actor reused one handle across forums. Correlate the scraped profiles and find the leaked secret in an old bio.',
                'scenario' => 'OSINT exercise: the handle `northwind_drifter` appears on three sites. One profile still shows a bio from before the account was scrubbed. Pivot on the username and read every bio.',
                'category' => 'osint',
                'difficulty' => Difficulty::Intermediate,
                'points' => 150,
                'minutes' => 20,
                'tags' => ['osint-usernames'],
                'hints' => [
                    ['content' => 'Same handle, three sites — but only one bio was never updated.', 'cost' => 10],
                ],
                'file_name' => 'profiles.txt',
            ],
            [
                'slug' => 'suspicious-beacon',
                'title' => 'Suspicious Beacon',
                'description' => 'A tshark export shows a workstation beaconing to an odd external host. Follow the HTTP stream and find the exfiltrated token.',
                'scenario' => 'SOC handoff: 10.42.0.23 makes periodic HTTP requests to an unknown server. The export below is a text rendering of the capture. Find the beacon and the token it carries.',
                'category' => 'network',
                'difficulty' => Difficulty::Advanced,
                'points' => 250,
                'minutes' => 45,
                'tags' => ['pcap', 'wireshark'],
                'hints' => [
                    ['content' => 'Filter mentally for the odd destination: most traffic is DNS and LAN noise, one host is not.', 'cost' => 15],
                    ['content' => 'The beacon is an HTTP GET with a query-string token. Follow that stream to the end.', 'cost' => 25],
                ],
                'file_name' => 'capture.txt',
            ],
            [
                'slug' => 'caesar-salad',
                'title' => 'Caesar Salad',
                'description' => 'A trivia bot ROT13-encodes its answers to avoid spoilers. Decode the final answer and claim it.',
                'scenario' => 'The #trivia channel bot obfuscates answers with ROT13. The export below contains the last round. Decode the winning answer — it is in flag format.',
                'category' => 'misc',
                'difficulty' => Difficulty::Expert,
                'points' => 300,
                'minutes' => 15,
                'tags' => ['misc-trivia', 'aes'],
                'hints' => [
                    ['content' => 'ROT13 is its own inverse: apply it again to decode. Try `tr a-zA-Z n-za-mN-ZA-M`.', 'cost' => 10],
                ],
                'file_name' => 'trivia.txt',
            ],
        ];
    }

    private function fileContent(string $slug, string $flag): string
    {
        $rot13 = str_rot13($flag);

        return match ($slug) {
            'sqli-login-bypass' => <<<TXT
                <?php
                // VulnShop login.php (leaked source, v2.3.1)
                \$username = \$_POST['username'] ?? '';
                \$password = \$_POST['password'] ?? '';
                \$query = "SELECT id, username, bio FROM users WHERE username = '\$username' AND password = '\$password'";
                // \$result = \$db->query(\$query);
                //
                // -- admin support dump (ticket #4182) --
                // id: 1, username: admin, bio: {$flag}
                TXT,
            'rsa-small-n' => <<<TXT
                # Legacy training-vault capture
                # Algorithm: textbook RSA (no padding — schoolbook demo)
                n = 3233
                e = 17
                c = 2790
                # Demo: decrypting c yields byte 0x41 ('A').
                # Factor n, rebuild d, verify the demo, then open the vault entry:
                vault["flag"] = "{$flag}"
                TXT,
            'hidden-in-plain-sight' => base64_encode(
                "Field note — Lakeside poster fair.\nStall 7 handed out USB sticks shaped like badges.\nEmbedded contact card reads: {$flag}\nRemainder of poster is vector noise.\n"
            )."\n",
            'overflow-101' => <<<TXT
                #include <stdio.h>
                #include <string.h>

                // Internal login helper — DO NOT SHIP (shipped anyway, v0.9)
                int main(int argc, char **argv) {
                    char name[32];
                    int is_admin = 0;

                    if (argc < 2) {
                        printf("usage: %s <name>\n", argv[0]);
                        return 1;
                    }

                    strcpy(name, argv[1]);  // TODO: bounds check before release
                    if (is_admin) {
                        // debug backdoor credential (remove before release):
                        // {$flag}
                        printf("welcome back, admin %s\n", name);
                    } else {
                        printf("hello %s\n", name);
                    }
                    return 0;
                }
                TXT,
            'strings-attached' => <<<TXT
                __libc_start_main
                GLIBC_2.2.5
                usage: app.bin --verify <key>
                checking license...
                license server unreachable, using offline key:
                {$flag}
                verification failed
                success
                .rodata
                .comment
                GCC: (Debian 12.2.0) 12.2.0
                TXT,
            'username-hunt' => <<<TXT
                OSINT scrape — handle: northwind_drifter (2024-11-02)
                === forum.oldskool.example/u/northwind_drifter ===
                bio: "retro computing enjoyer | restoring a Zenith Z-171"
                === codegit.example/northwind_drifter ===
                bio: "dotfiles and radio stuff"
                === microblog.example/@northwind_drifter (archived 2023) ===
                bio: "test account, ignore — {$flag}"
                TXT,
            'suspicious-beacon' => <<<TXT
                tshark -r suspicious.pcap -Y http -T fields -e frame.number -e ip.src -e ip.dst -e http.request.uri
                1	10.42.0.23	10.42.0.1	-
                2	10.42.0.23	8.8.8.8	-
                3	10.42.0.23	93.184.216.34	/news
                4	10.42.0.23	185.220.101.4	/beacon?id=10.42.0.23&token={$flag}
                5	185.220.101.4	10.42.0.23	-
                6	10.42.0.23	185.220.101.4	/beacon?id=10.42.0.23&status=ok
                TXT,
            'caesar-salad' => <<<TXT
                #trivia export — answers ROT13-encoded to avoid spoilers
                Q: Final round answer (decode me):
                {$rot13}
                (tip: ROT13 is its own inverse)
                TXT,
            default => "See the challenge description.\n",
        };
    }
}
