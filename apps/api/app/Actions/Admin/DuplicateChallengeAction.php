<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Enums\ContentStatus;
use App\Models\Challenge;
use App\Models\ChallengeHint;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Clone a challenge as a new draft with its hints and tag links.
 *
 * Deliberately NOT cloned: files (payloads stay with the original), flags
 * (the clone must get its own flags via the flag manager — cloning would
 * silently duplicate the same flag value onto two challenges), and solve
 * statistics (the copy starts at zero).
 */
class DuplicateChallengeAction
{
    public function execute(User $actor, Challenge $source, Request $request): Challenge
    {
        return DB::transaction(function () use ($actor, $source, $request): Challenge {
            $copy = $source->replicate(except: [
                'slug', 'status', 'published_at', 'solve_count',
            ]);

            $copy->title = $source->title.' (Copy)';
            $copy->slug = $this->uniqueSlug($copy->title);
            $copy->status = ContentStatus::Draft->value;
            $copy->published_at = null;
            $copy->solve_count = 0;
            $copy->author_id = $actor->id;
            $copy->save();

            foreach ($source->hints as $hint) {
                $copyHint = ChallengeHint::create([
                    'challenge_id' => $copy->id,
                    'content' => $hint->content,
                    'cost_points' => $hint->cost_points,
                    'position' => $hint->position,
                ]);
            }

            $copy->tags()->syncWithoutDetaching($source->tags()->pluck('tags.id')->all());

            AuditLogger::log(
                $actor,
                'challenge.duplicated',
                Challenge::class,
                $copy->id,
                ['before' => null, 'after' => ['slug' => $copy->slug, 'title' => $copy->title, 'source_id' => $source->id]],
                $request,
            );

            return $copy;
        });
    }

    private function uniqueSlug(string $title): string
    {
        $base = substr(strtolower((string) preg_replace('/[^a-z0-9]+/', '-', $title)), 0, 120);

        if ($base === '' || $base === '-') {
            $base = 'challenge-copy';
        }

        do {
            $slug = rtrim($base, '-').'-'.random_int(10000, 99999);
        } while (Challenge::where('slug', $slug)->exists());

        return $slug;
    }
}
