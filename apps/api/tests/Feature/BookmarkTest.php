<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Bookmark;
use App\Models\Challenge;
use App\Models\Lesson;
use App\Models\Path;
use App\Models\PathModule;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Learner bookmarks (docs/product.md §6): upsert semantics, private notes,
 * invisible drafts, and ownership.
 */
class BookmarkTest extends TestCase
{
    use RefreshDatabase;

    public function test_add_list_update_and_remove_a_bookmark(): void
    {
        $user = User::factory()->create();
        $challenge = Challenge::factory()->create();

        $create = $this->postJson(
            '/api/v1/me/bookmarks',
            ['type' => 'challenge', 'id' => $challenge->id, 'note' => 'do later'],
            $this->headersFor($user),
        );

        $create->assertStatus(201);
        $this->assertSame('do later', $create->json('data.note'));
        $this->assertSame('challenge', $create->json('data.type'));

        $bookmarkId = $create->json('data.id');

        $list = $this->getJson('/api/v1/me/bookmarks', $this->headersFor($user))->assertOk();
        $this->assertCount(1, $list->json('data'));

        $this->patchJson(
            "/api/v1/me/bookmarks/{$bookmarkId}",
            ['note' => 'solved this once'],
            $this->headersFor($user),
        )->assertOk();

        $this->assertSame(
            'solved this once',
            Bookmark::find($bookmarkId)?->note,
        );

        $this->deleteJson(
            "/api/v1/me/bookmarks/{$bookmarkId}",
            [],
            $this->headersFor($user),
        )->assertOk();

        $this->assertDatabaseMissing('bookmarks', ['id' => $bookmarkId]);
    }

    public function test_reposting_the_same_target_is_an_upsert(): void
    {
        $user = User::factory()->create();
        $challenge = Challenge::factory()->create();

        $this->postJson('/api/v1/me/bookmarks', ['type' => 'challenge', 'id' => $challenge->id, 'note' => 'a'], $this->headersFor($user));
        $this->postJson('/api/v1/me/bookmarks', ['type' => 'challenge', 'id' => $challenge->id, 'note' => 'b'], $this->headersFor($user));

        $this->assertSame(1, Bookmark::where('user_id', $user->id)->count());
        $this->assertSame('b', Bookmark::where('user_id', $user->id)->first()->note);
    }

    public function test_a_learner_cannot_bookmark_an_invisible_draft(): void
    {
        $user = User::factory()->create();
        $draft = Challenge::factory()->draft()->create();

        $this->postJson(
            '/api/v1/me/bookmarks',
            ['type' => 'challenge', 'id' => $draft->id],
            $this->headersFor($user),
        )->assertNotFound();

        $this->assertSame(0, Bookmark::count());
    }

    public function test_a_note_on_someone_elses_bookmark_is_never_readable_or_writable(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $challenge = Challenge::factory()->create();

        $this->postJson(
            '/api/v1/me/bookmarks',
            ['type' => 'challenge', 'id' => $challenge->id, 'note' => 'owner only'],
            $this->headersFor($owner),
        )->assertStatus(201);

        $bookmark = Bookmark::first();

        $this->patchJson(
            "/api/v1/me/bookmarks/{$bookmark->id}",
            ['note' => 'stolen'],
            $this->headersFor($other),
        )->assertForbidden();

        $this->deleteJson(
            "/api/v1/me/bookmarks/{$bookmark->id}",
            [],
            $this->headersFor($other),
        )->assertForbidden();
    }

    public function test_bookmarking_a_lesson_and_a_path(): void
    {
        $user = User::factory()->create();

        $path = Path::factory()->create();
        $module = PathModule::factory()->create(['path_id' => $path->id]);
        $lesson = Lesson::factory()->create(['module_id' => $module->id]);

        $lessonBookmark = $this->postJson(
            '/api/v1/me/bookmarks',
            ['type' => 'lesson', 'id' => $lesson->id],
            $this->headersFor($user),
        )->assertStatus(201);

        $pathBookmark = $this->postJson(
            '/api/v1/me/bookmarks',
            ['type' => 'path', 'id' => $path->id],
            $this->headersFor($user),
        )->assertStatus(201);

        $this->assertSame($lesson->id, $lessonBookmark->json('data.target.id'));
        $this->assertSame($path->id, $pathBookmark->json('data.target.id'));
    }

    /**
     * @return array<string, string>
     */
    private function headersFor(User $user): array
    {
        $token = $user->createToken('web', ['*'], now()->addDay())->plainTextToken;

        return ['Authorization' => "Bearer {$token}"];
    }
}
