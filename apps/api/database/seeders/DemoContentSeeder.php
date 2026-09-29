<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Actions\SetChallengeFlagAction;
use App\Enums\ContentStatus;
use App\Enums\Difficulty;
use App\Enums\QuizQuestionType;
use App\Enums\Role;
use App\Models\Category;
use App\Models\Challenge;
use App\Models\ChallengeFile;
use App\Models\ChallengeHint;
use App\Models\Lesson;
use App\Models\Path;
use App\Models\PathModule;
use App\Models\Quiz;
use App\Models\Tag;
use App\Models\User;
use App\Services\FlagCryptoService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DemoContentSeeder extends Seeder
{
    public function run(): void
    {
        $author = User::query()->firstOrCreate(
            ['email' => 'author@example.com'],
            [
                'name' => 'Demo Author',
                'password' => Hash::make('ChangeMe-Author-Passw0rd!'),
                'email_verified_at' => now(),
            ]
        );
        if ($author->role === null || $author->role === Role::User) {
            $author->forceFill(['role' => Role::Moderator->value])->save();
        }

        $dfir = Category::query()->where('slug', 'digital-forensics')->firstOrFail();
        $crypto = Category::query()->where('slug', 'cryptography')->firstOrFail();
        $osint = Category::query()->where('slug', 'osint')->firstOrFail();
        $tag = Tag::query()->where('slug', 'beginner-friendly')->first();

        $path = Path::query()->updateOrCreate(
            ['slug' => 'intro-to-dfir'],
            [
                'title' => 'Intro to DFIR',
                'summary' => 'A short path covering forensic fundamentals and a practice challenge.',
                'description' => 'Learn the basics of digital forensics, then practice on a static file challenge.',
                'category_id' => $dfir->id,
                'difficulty' => Difficulty::Beginner->value,
                'estimated_minutes' => 90,
                'status' => ContentStatus::Published->value,
                'published_at' => now(),
                'created_by' => $author->id,
            ]
        );

        $module = PathModule::query()->updateOrCreate(
            ['path_id' => $path->id, 'position' => 1],
            [
                'title' => 'Foundations',
                'description' => 'Core concepts',
                'is_published' => true,
            ]
        );

        $lesson = Lesson::query()->updateOrCreate(
            ['module_id' => $module->id, 'slug' => 'what-is-dfir'],
            [
                'title' => 'What is DFIR?',
                'summary' => 'An overview of digital forensics and incident response.',
                'content' => "# What is DFIR?\n\nDigital Forensics and Incident Response (DFIR) combines evidence collection with investigation workflows.\n\nPractice finding a flag in a simple text artifact.",
                'position' => 1,
                'estimated_minutes' => 15,
                'is_published' => true,
            ]
        );

        $quiz = Quiz::query()->updateOrCreate(
            ['lesson_id' => $lesson->id],
            [
                'title' => 'DFIR Basics Check',
                'description' => 'Quick knowledge check',
                'pass_score' => 70,
                'position' => 1,
                'is_published' => true,
                'module_id' => null,
            ]
        );

        if ($quiz->questions()->count() === 0) {
            $question = $quiz->questions()->create([
                'question' => 'DFIR stands for Digital Forensics and Incident Response.',
                'type' => QuizQuestionType::TrueFalse->value,
                'explanation' => 'Correct — DFIR combines forensics with IR.',
                'points' => 1,
                'position' => 1,
                'is_published' => true,
            ]);
            $question->options()->createMany([
                ['option_text' => 'True', 'is_correct' => true, 'position' => 0],
                ['option_text' => 'False', 'is_correct' => false, 'position' => 1],
            ]);
        }

        $cryptoService = app(FlagCryptoService::class);
        $setFlag = app(SetChallengeFlagAction::class);

        $challenges = [
            [
                'slug' => 'welcome-text-flag',
                'title' => 'Welcome Text Flag',
                'description' => 'Download the text file and find the flag.',
                'scenario' => 'A junior analyst dropped a note with a development flag.',
                'category_id' => $dfir->id,
                'flag' => 'CTF{development_only_example}',
                'points' => 50,
                'file_body' => "Analyst note\n------------\nRemember to rotate flags in prod.\nFlag: CTF{development_only_example}\n",
                'file_name' => 'note.txt',
            ],
            [
                'slug' => 'base64-warmup',
                'title' => 'Base64 Warmup',
                'description' => 'Decode the contents of the file to recover the flag.',
                'scenario' => null,
                'category_id' => $crypto->id,
                'flag' => 'CTF{development_only_crypto}',
                'points' => 75,
                'file_body' => base64_encode('CTF{development_only_crypto}')."\n",
                'file_name' => 'encoded.txt',
            ],
            [
                'slug' => 'osint-handle',
                'title' => 'OSINT Handle',
                'description' => 'The flag is hidden in the scenario text metadata style note.',
                'scenario' => 'Public bio snippet mentions CTF{development_only_osint} as a joke handle.',
                'category_id' => $osint->id,
                'flag' => 'CTF{development_only_osint}',
                'points' => 100,
                'file_body' => "No binary artifacts — read the scenario carefully.\n",
                'file_name' => 'readme.txt',
            ],
        ];

        foreach ($challenges as $i => $row) {
            $challenge = Challenge::query()->updateOrCreate(
                ['slug' => $row['slug']],
                [
                    'title' => $row['title'],
                    'description' => $row['description'],
                    'scenario' => $row['scenario'],
                    'category_id' => $row['category_id'],
                    'difficulty' => Difficulty::Beginner->value,
                    'points' => $row['points'],
                    'estimated_minutes' => 20,
                    'status' => ContentStatus::Published->value,
                    'flag_validation_type' => 'static',
                    'author_id' => $author->id,
                    'published_at' => now(),
                    'solve_count' => 0,
                ]
            );

            if ($tag) {
                $challenge->tags()->syncWithoutDetaching([$tag->id]);
            }

            if ($challenge->flags()->count() === 0) {
                $setFlag->handle($author, $challenge, [
                    'value' => $row['flag'],
                    'label' => 'primary',
                    'case_sensitive' => true,
                ]);
            }

            if ($challenge->hints()->count() === 0) {
                ChallengeHint::query()->create([
                    'challenge_id' => $challenge->id,
                    'content' => 'Look carefully inside the provided text artifact.',
                    'cost_points' => 10,
                    'position' => 1,
                ]);
            }

            if ($challenge->files()->count() === 0) {
                $key = Str::uuid()->toString().'/'.Str::uuid()->toString().'.txt';
                Storage::disk('challenge-files')->put($key, $row['file_body']);
                ChallengeFile::query()->create([
                    'challenge_id' => $challenge->id,
                    'original_name' => $row['file_name'],
                    'storage_disk' => 'challenge-files',
                    'storage_key' => $key,
                    'mime_type' => 'text/plain',
                    'size_bytes' => strlen($row['file_body']),
                    'checksum_sha256' => hash('sha256', $row['file_body']),
                    'visibility' => 'authenticated',
                ]);
            }

            if ($i === 0) {
                $lesson->challenges()->syncWithoutDetaching([$challenge->id]);
            }
        }
    }
}
