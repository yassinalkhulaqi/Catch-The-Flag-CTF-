<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Challenge;
use App\Models\ChallengeFile;
use App\Models\ChallengeFlag;
use App\Models\ChallengeHint;
use App\Models\ChallengeSolve;
use App\Models\ChallengeSubmission;
use App\Models\HintUnlock;
use App\Models\Lesson;
use App\Models\LessonCompletion;
use App\Models\Path;
use App\Models\PathModule;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class ContentTest extends TestCase
{
    use RefreshDatabase;

    private Category $dfir;

    private Category $soc;

    private User $user;

    private User $admin;

    private User $moderator;

    protected function setUp(): void
    {
        parent::setUp();

        $this->dfir = Category::create([
            'name' => 'Digital Forensics / DFIR',
            'slug' => 'dfir',
            'description' => 'Forensics challenges.',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $this->soc = Category::create([
            'name' => 'Security Operations',
            'slug' => 'soc',
            'description' => 'SOC challenges.',
            'sort_order' => 2,
            'is_active' => true,
        ]);

        Category::create([
            'name' => 'Hidden Discipline',
            'slug' => 'hidden',
            'is_active' => false,
        ]);

        Tag::create(['name' => 'OSINT', 'slug' => 'osint']);
        Tag::create(['name' => 'Malware', 'slug' => 'malware']);

        $this->user = User::factory()->create();
        $this->admin = User::factory()->admin()->create();
        $this->moderator = User::factory()->moderator()->create();
    }

    private function apiGet(string $uri, ?User $viewer = null): TestResponse
    {
        // Feature tests share one app per test and Laravel caches the
        // resolved guard user; production boots fresh per request.
        $this->app['auth']->forgetGuards();

        $headers = $viewer !== null
            ? ['Authorization' => 'Bearer '.$viewer->createToken('web', ['*'], now()->addDay())->plainTextToken]
            : [];

        return $this->getJson($uri, $headers);
    }

    /**
     * Mass-assignment-safe creation: fillable attributes are filled,
     * privileged/server-side attributes (status, counters, flag
     * material, storage keys) are applied via forceFill exactly as
     * application actions would.
     *
     * @param  array<string, mixed>  $attributes
     */
    private function makeChallenge(array $attributes = []): Challenge
    {
        $model = new Challenge;
        $fillable = $model->getFillable();

        $model->fill(array_intersect_key($attributes, array_flip($fillable)));
        $model->title ??= 'Challenge '.Str::random(8);
        $model->slug ??= Str::slug($model->title.' '.Str::random(6));
        $model->description ??= 'Analyze the artifact and recover the flag.';
        $model->category_id ??= $this->dfir->id;

        $model->save();

        $guarded = array_diff_key($attributes, array_flip($fillable));

        if ($guarded !== []) {
            $model->forceFill($guarded)->save();
        }

        return $model->refresh();
    }

    private function makeFlag(Challenge $challenge): ChallengeFlag
    {
        $flag = new ChallengeFlag(['challenge_id' => $challenge->id, 'label' => 'primary']);
        $flag->forceFill([
            'flag_ciphertext' => 'ciphertext-'.Str::random(16),
            'flag_hash' => hash('sha256', 'flag{'.Str::random(16).'}'),
        ])->save();

        return $flag->refresh();
    }

    private function makeFile(Challenge $challenge): ChallengeFile
    {
        $file = new ChallengeFile([
            'challenge_id' => $challenge->id,
            'original_name' => 'evidence.pcap',
            'mime_type' => 'application/vnd.tcpdump.pcap',
            'size_bytes' => 1024,
            'checksum_sha256' => hash('sha256', Str::random(16)),
        ]);
        $file->forceFill(['storage_key' => Str::uuid().'/'.Str::uuid().'.pcap'])->save();

        return $file->refresh();
    }

    private function makeHint(Challenge $challenge, int $cost = 0, int $position = 0): ChallengeHint
    {
        return ChallengeHint::create([
            'challenge_id' => $challenge->id,
            'content' => 'Look at the DNS queries near the end.',
            'cost_points' => $cost,
            'position' => $position,
        ]);
    }

    private function makeSolve(Challenge $challenge, User $user, int $points = 100): ChallengeSolve
    {
        $solve = new ChallengeSolve(['challenge_id' => $challenge->id, 'user_id' => $user->id]);
        $solve->forceFill(['points_awarded' => $points, 'hints_used' => 0])->save();

        return $solve->refresh();
    }

    private function makeUnlock(Challenge $challenge, ChallengeHint $hint, User $user): HintUnlock
    {
        $unlock = new HintUnlock([
            'user_id' => $user->id,
            'challenge_id' => $challenge->id,
            'hint_id' => $hint->id,
        ]);
        $unlock->forceFill(['points_cost' => $hint->cost_points])->save();

        return $unlock->refresh();
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function makePath(array $attributes = []): Path
    {
        $model = new Path;
        $fillable = $model->getFillable();

        $model->fill(array_intersect_key($attributes, array_flip($fillable)));
        $model->title ??= 'Path '.Str::random(8);
        $model->slug ??= Str::slug($model->title.' '.Str::random(6));
        $model->summary ??= 'Learn the fundamentals.';
        $model->category_id ??= $this->dfir->id;

        $model->save();

        $guarded = array_diff_key($attributes, array_flip($fillable));

        if ($guarded !== []) {
            $model->forceFill($guarded)->save();
        }

        return $model->refresh();
    }

    private function assertNoSecrets(TestResponse $response): void
    {
        foreach (['flag_ciphertext', 'flag_hash', 'flag_plaintext', 'storage_key'] as $needle) {
            $response->assertDontSee($needle, false);
        }
    }

    // ---- visibility ----------------------------------------------------

    public function test_guest_challenge_index_lists_only_published(): void
    {
        $visible = $this->makeChallenge(['title' => 'Visible challenge', 'status' => 'published', 'published_at' => now()]);
        $this->makeChallenge(['title' => 'Draft challenge', 'status' => 'draft']);
        $this->makeChallenge(['title' => 'Archived challenge', 'status' => 'archived']);

        $response = $this->apiGet('/api/v1/challenges');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $visible->id);

        $this->assertNoSecrets($response);
    }

    public function test_guest_challenge_show_draft_returns_404(): void
    {
        $draft = $this->makeChallenge(['status' => 'draft']);

        $this->apiGet("/api/v1/challenges/{$draft->id}")
            ->assertNotFound()
            ->assertJsonPath('error.code', 'not_found');

        $this->apiGet("/api/v1/challenges/{$draft->slug}")
            ->assertNotFound()
            ->assertJsonPath('error.code', 'not_found');
    }

    public function test_regular_user_cannot_view_draft_challenge(): void
    {
        $draft = $this->makeChallenge(['status' => 'draft']);

        $this->apiGet("/api/v1/challenges/{$draft->slug}", $this->user)->assertNotFound();
    }

    public function test_moderator_and_admin_can_view_draft_challenge(): void
    {
        $draft = $this->makeChallenge(['title' => 'Draft for staff', 'status' => 'draft']);
        $this->makeFlag($draft);

        $this->apiGet("/api/v1/challenges/{$draft->id}", $this->moderator)
            ->assertOk()
            ->assertJsonPath('data.title', 'Draft for staff');

        $staffResponse = $this->apiGet("/api/v1/challenges/{$draft->slug}", $this->admin)->assertOk();

        $this->assertNoSecrets($staffResponse);
    }

    public function test_staff_can_filter_challenges_by_status(): void
    {
        $draft = $this->makeChallenge(['status' => 'draft']);
        $this->makeChallenge(['status' => 'published', 'published_at' => now()]);

        $this->apiGet('/api/v1/challenges?status=draft', $this->admin)
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $draft->id);

        // Guests are forced to published even when asking for drafts.
        $this->apiGet('/api/v1/challenges?status=draft')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    // ---- filters -------------------------------------------------------

    private function seedFilterSet(): array
    {
        $osint = Tag::where('slug', 'osint')->firstOrFail();
        $malware = Tag::where('slug', 'malware')->firstOrFail();

        $pcap = $this->makeChallenge([
            'title' => 'Zerithian pcap hunt',
            'slug' => 'zerithian-pcap-hunt',
            'description' => 'Hunt the zerithian beacon in this capture.',
            'category_id' => $this->dfir->id,
            'difficulty' => 'beginner',
            'points' => 100,
            'status' => 'published',
            'published_at' => now(),
        ]);
        $pcap->tags()->attach($osint);

        $malwareChallenge = $this->makeChallenge([
            'title' => 'Ransom note triage',
            'slug' => 'ransom-note-triage',
            'description' => 'Triage the ransom note sample.',
            'category_id' => $this->soc->id,
            'difficulty' => 'intermediate',
            'points' => 300,
            'status' => 'published',
            'published_at' => now(),
        ]);
        $malwareChallenge->tags()->attach($malware);

        $combo = $this->makeChallenge([
            'title' => 'Beacon and binary',
            'slug' => 'beacon-and-binary',
            'description' => 'Correlate the beacon with the binary.',
            'category_id' => $this->dfir->id,
            'difficulty' => 'advanced',
            'points' => 500,
            'status' => 'published',
            'published_at' => now(),
        ]);
        $combo->tags()->attach([$osint->id, $malware->id]);

        return [$pcap, $malwareChallenge, $combo];
    }

    public function test_filter_by_category(): void
    {
        [$pcap, $malwareChallenge, $combo] = $this->seedFilterSet();

        $response = $this->apiGet('/api/v1/challenges?category=dfir')->assertOk();

        $ids = $response->json('data.*.id');
        sort($ids);
        $expected = [$pcap->id, $combo->id];
        sort($expected);
        $this->assertSame($expected, $ids);
        $this->assertNotContains($malwareChallenge->id, $ids);
    }

    public function test_filter_by_difficulty(): void
    {
        [$pcap, $malwareChallenge] = $this->seedFilterSet();

        $this->apiGet('/api/v1/challenges?difficulty=intermediate')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $malwareChallenge->id);

        $this->assertNotContains(
            $pcap->id,
            $this->apiGet('/api/v1/challenges?difficulty=intermediate')->json('data.*.id')
        );
    }

    public function test_filter_by_tags(): void
    {
        [$pcap, $malwareChallenge, $combo] = $this->seedFilterSet();

        $osintIds = $this->apiGet('/api/v1/challenges?tags=osint')->assertOk()->json('data.*.id');
        sort($osintIds);
        $expected = [$pcap->id, $combo->id];
        sort($expected);
        $this->assertSame($expected, $osintIds);

        $bothIds = $this->apiGet('/api/v1/challenges?tags=osint,malware')->assertOk()->json('data.*.id');
        $this->assertContains($combo->id, $bothIds);
        $this->assertNotContains($malwareChallenge->id, $this->apiGet('/api/v1/challenges?tags=osint')->json('data.*.id'));
    }

    public function test_filter_by_points_range(): void
    {
        [$pcap, $malwareChallenge, $combo] = $this->seedFilterSet();

        $ids = $this->apiGet('/api/v1/challenges?min_points=200&max_points=300')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->json('data.*.id');

        $this->assertSame([$malwareChallenge->id], $ids);
        $this->assertNotContains($pcap->id, $ids);
        $this->assertNotContains($combo->id, $ids);
    }

    public function test_filter_by_solved_state(): void
    {
        [$pcap, $malwareChallenge] = $this->seedFilterSet();
        $this->makeSolve($pcap, $this->user);

        $solvedIds = $this->apiGet('/api/v1/challenges?solved=true', $this->user)
            ->assertOk()
            ->json('data.*.id');
        $this->assertContains($pcap->id, $solvedIds);
        $this->assertNotContains($malwareChallenge->id, $solvedIds);

        $unsolvedIds = $this->apiGet('/api/v1/challenges?solved=false', $this->user)
            ->assertOk()
            ->json('data.*.id');
        $this->assertNotContains($pcap->id, $unsolvedIds);
        $this->assertContains($malwareChallenge->id, $unsolvedIds);

        // Guests have no solve state: the filter is ignored, all
        // published challenges are returned.
        $this->assertCount(3, $this->apiGet('/api/v1/challenges?solved=true')->json('data'));
    }

    public function test_fulltext_search_on_q(): void
    {
        [$pcap] = $this->seedFilterSet();

        $this->apiGet('/api/v1/challenges?q=zerithian')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $pcap->id);

        // Below the configured minimum query length the term is
        // ignored instead of producing an empty/error result.
        $this->apiGet('/api/v1/challenges?q=x')->assertOk()->assertJsonCount(3, 'data');
    }

    public function test_combined_filters_are_deterministic(): void
    {
        $this->seedFilterSet();

        $first = $this->apiGet('/api/v1/challenges?category=dfir&max_points=500&sort=points')->json('data.*.id');
        $second = $this->apiGet('/api/v1/challenges?category=dfir&max_points=500&sort=points')->json('data.*.id');

        $this->assertSame($first, $second);
        $this->assertSame(
            $this->apiGet('/api/v1/challenges?category=dfir&max_points=500&sort=points')->json('data.*.points'),
            [100, 500]
        );
    }

    public function test_sorting_allowlist_and_direction(): void
    {
        $this->seedFilterSet();

        $asc = $this->apiGet('/api/v1/challenges?sort=points')->assertOk()->json('data.*.points');
        $this->assertSame([100, 300, 500], $asc);

        $desc = $this->apiGet('/api/v1/challenges?sort=-points')->assertOk()->json('data.*.points');
        $this->assertSame([500, 300, 100], $desc);
    }

    public function test_invalid_filter_values_return_422(): void
    {
        $this->apiGet('/api/v1/challenges?difficulty=bogus')
            ->assertUnprocessable()
            ->assertJsonPath('error.code', 'validation_failed');

        $this->apiGet('/api/v1/challenges?per_page=101')->assertUnprocessable();
        $this->apiGet('/api/v1/challenges?sort=bogus')->assertUnprocessable();
        $this->apiGet('/api/v1/challenges?min_points=0')->assertUnprocessable();
        $this->apiGet('/api/v1/challenges?category=no-such-category')->assertUnprocessable();
    }

    public function test_pagination_envelope_shape(): void
    {
        $this->seedFilterSet();

        $response = $this->apiGet('/api/v1/challenges?per_page=2&page=1')->assertOk();

        $response->assertJsonStructure([
            'data',
            'meta' => ['current_page', 'per_page', 'total', 'last_page'],
            'links' => ['next', 'prev'],
        ]);

        $response->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.per_page', 2)
            ->assertJsonPath('meta.total', 3)
            ->assertJsonPath('meta.last_page', 2)
            ->assertJsonCount(2, 'data');

        $this->assertNotNull($response->json('links.next'));

        $pageTwo = $this->apiGet('/api/v1/challenges?per_page=2&page=2')->assertOk();
        $pageTwo->assertJsonCount(1, 'data')->assertJsonPath('meta.current_page', 2);
    }

    // ---- challenge detail ----------------------------------------------

    public function test_challenge_detail_shape_and_secret_absence(): void
    {
        $challenge = $this->makeChallenge([
            'title' => 'Secret-shape probe',
            'description' => 'Full detail rendering.',
            'scenario' => 'You are the on-call analyst.',
            'status' => 'published',
            'published_at' => now(),
        ]);
        $challenge->tags()->attach(Tag::where('slug', 'osint')->firstOrFail());
        $this->makeFlag($challenge);
        $file = $this->makeFile($challenge);
        $hint = $this->makeHint($challenge, 30);

        $response = $this->apiGet("/api/v1/challenges/{$challenge->slug}")->assertOk();

        $response->assertJsonPath('data.title', 'Secret-shape probe')
            ->assertJsonPath('data.description', 'Full detail rendering.')
            ->assertJsonPath('data.scenario', 'You are the on-call analyst.')
            ->assertJsonPath('data.points_remaining', 100)
            ->assertJsonStructure([
                'data' => [
                    'id', 'title', 'slug', 'description', 'category', 'difficulty',
                    'points', 'tags', 'files', 'hints', 'solve_count', 'related',
                ],
            ]);

        $fileRow = $response->json('data.files.0');
        $this->assertSame($file->id, $fileRow['id']);
        $this->assertSame('evidence.pcap', $fileRow['original_name']);
        $this->assertArrayNotHasKey('storage_key', $fileRow);

        $hintRow = $response->json('data.hints.0');
        $this->assertSame($hint->id, $hintRow['id']);
        $this->assertSame(30, $hintRow['cost_points']);
        $this->assertFalse($hintRow['unlocked']);
        $this->assertArrayNotHasKey('content', $hintRow);

        // Guests get no solve state.
        $this->assertArrayNotHasKey('solved', $response->json('data'));

        $this->assertNoSecrets($response);
    }

    public function test_challenge_detail_solved_and_points_remaining_for_viewer(): void
    {
        $challenge = $this->makeChallenge(['points' => 100, 'status' => 'published', 'published_at' => now()]);
        $hint = $this->makeHint($challenge, 30);

        $before = $this->apiGet("/api/v1/challenges/{$challenge->id}", $this->user)->assertOk();
        $before->assertJsonPath('data.solved', false)->assertJsonPath('data.points_remaining', 100);

        $this->makeUnlock($challenge, $hint, $this->user);
        $this->makeSolve($challenge, $this->user, 70);

        $after = $this->apiGet("/api/v1/challenges/{$challenge->id}", $this->user)->assertOk();
        $after->assertJsonPath('data.solved', true)
            ->assertJsonPath('data.points_remaining', 70)
            ->assertJsonPath('data.hints.0.unlocked', true);

        $this->assertNoSecrets($after);
    }

    // ---- paths ----------------------------------------------------------

    public function test_path_visibility_and_detail_shape(): void
    {
        $prereq = $this->makePath(['title' => 'Prereq path', 'status' => 'published', 'published_at' => now()]);
        $path = $this->makePath(['title' => 'DFIR path', 'status' => 'published', 'published_at' => now()]);
        $path->prerequisites()->attach($prereq->id);
        $draft = $this->makePath(['title' => 'Draft path', 'status' => 'draft']);

        $visible = PathModule::create(['path_id' => $path->id, 'title' => 'Module one', 'position' => 1]);
        PathModule::create(['path_id' => $path->id, 'title' => 'Hidden module', 'position' => 2, 'is_published' => false]);

        Lesson::create([
            'module_id' => $visible->id, 'title' => 'Lesson one', 'slug' => 'lesson-one',
            'summary' => 'First lesson.', 'content' => '# Secret body', 'position' => 1,
        ]);
        Lesson::create([
            'module_id' => $visible->id, 'title' => 'Hidden lesson', 'slug' => 'hidden-lesson',
            'summary' => 'Not visible.', 'content' => '# Hidden body', 'position' => 2,
            'is_published' => false,
        ]);

        $this->apiGet("/api/v1/paths/{$draft->slug}")->assertNotFound();
        $this->apiGet("/api/v1/paths/{$draft->slug}", $this->user)->assertNotFound();
        $this->apiGet("/api/v1/paths/{$draft->slug}", $this->admin)->assertOk();

        $index = $this->apiGet('/api/v1/paths')->assertOk();
        $this->assertContains($path->id, $index->json('data.*.id'));
        $this->assertNotContains($draft->id, $index->json('data.*.id'));
        $this->assertNoSecrets($index);

        $detail = $this->apiGet("/api/v1/paths/{$path->slug}")->assertOk();

        $detail->assertJsonPath('data.title', 'DFIR path')
            ->assertJsonCount(1, 'data.modules')
            ->assertJsonCount(1, 'data.modules.0.lessons')
            ->assertJsonPath('data.modules.0.lessons.0.slug', 'lesson-one')
            ->assertJsonCount(1, 'data.prerequisites')
            ->assertJsonPath('data.prerequisites.0.slug', $prereq->slug);

        $lessonRow = $detail->json('data.modules.0.lessons.0');
        $this->assertArrayNotHasKey('content', $lessonRow);

        // Guests get no progress state.
        $this->assertArrayNotHasKey('progress_percent', $detail->json('data'));

        $this->assertNoSecrets($detail);
    }

    public function test_path_progress_percent_for_authenticated_learner(): void
    {
        $path = $this->makePath(['status' => 'published', 'published_at' => now()]);
        $module = PathModule::create(['path_id' => $path->id, 'title' => 'Module one', 'position' => 1]);

        $first = Lesson::create([
            'module_id' => $module->id, 'title' => 'Lesson one', 'slug' => 'lesson-one',
            'content' => 'Body one.', 'position' => 1,
        ]);
        $second = Lesson::create([
            'module_id' => $module->id, 'title' => 'Lesson two', 'slug' => 'lesson-two',
            'content' => 'Body two.', 'position' => 2,
        ]);

        $uri = "/api/v1/paths/{$path->id}";

        $this->apiGet($uri, $this->user)->assertOk()->assertJsonPath('data.progress_percent', 0);

        LessonCompletion::create(['user_id' => $this->user->id, 'lesson_id' => $first->id]);
        $this->apiGet($uri, $this->user)->assertOk()->assertJsonPath('data.progress_percent', 50);

        LessonCompletion::create(['user_id' => $this->user->id, 'lesson_id' => $second->id]);
        $this->apiGet($uri, $this->user)->assertOk()->assertJsonPath('data.progress_percent', 100);
    }

    public function test_path_filters_and_pagination(): void
    {
        $this->makePath(['title' => 'DFIR basics', 'category_id' => $this->dfir->id, 'difficulty' => 'beginner', 'status' => 'published', 'published_at' => now()]);
        $this->makePath(['title' => 'SOC triage', 'category_id' => $this->soc->id, 'difficulty' => 'intermediate', 'status' => 'published', 'published_at' => now()]);

        $this->apiGet('/api/v1/paths?category=soc')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'SOC triage');

        $this->apiGet('/api/v1/paths?difficulty=beginner')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'DFIR basics');

        $paged = $this->apiGet('/api/v1/paths?per_page=1')->assertOk();
        $paged->assertJsonStructure(['data', 'meta' => ['current_page', 'per_page', 'total', 'last_page'], 'links']);
        $paged->assertJsonPath('meta.total', 2);
    }

    // ---- taxonomy --------------------------------------------------------

    public function test_category_index_active_only_for_guests(): void
    {
        $guest = $this->apiGet('/api/v1/categories')->assertOk();
        $slugs = $guest->json('data.*.slug');

        $this->assertContains('dfir', $slugs);
        $this->assertNotContains('hidden', $slugs);
        $this->assertNoSecrets($guest);

        $staff = $this->apiGet('/api/v1/categories', $this->admin)->assertOk();
        $this->assertContains('hidden', $staff->json('data.*.slug'));
    }

    public function test_tag_index(): void
    {
        $response = $this->apiGet('/api/v1/tags')->assertOk();

        $slugs = $response->json('data.*.slug');
        $this->assertContains('osint', $slugs);
        $this->assertContains('malware', $slugs);
        $this->assertNoSecrets($response);
    }

    // ---- mass assignment ---------------------------------------------------

    public function test_privileged_attributes_are_not_mass_assignable(): void
    {
        $challenge = Challenge::create([
            'title' => 'Guarded challenge',
            'slug' => 'guarded-challenge',
            'description' => 'Body.',
            'category_id' => $this->dfir->id,
            // Privileged: must be ignored by fill().
            'status' => 'published',
            'solve_count' => 999,
        ]);

        $challenge->refresh();
        $this->assertSame('draft', $challenge->status->value);
        $this->assertSame(0, $challenge->solve_count);

        $path = Path::create([
            'title' => 'Guarded path',
            'slug' => 'guarded-path',
            'summary' => 'Summary.',
            'category_id' => $this->dfir->id,
            'status' => 'published',
        ]);
        $this->assertSame('draft', $path->refresh()->status->value);

        $this->assertArrayNotHasKey('flag_ciphertext', (new ChallengeFlag(['flag_ciphertext' => 'x']))->getAttributes());
        $this->assertArrayNotHasKey('flag_hash', (new ChallengeFlag(['flag_hash' => 'y']))->getAttributes());
        $this->assertArrayNotHasKey('storage_key', (new ChallengeFile(['storage_key' => 'evil']))->getAttributes());
        $this->assertArrayNotHasKey('flag_hash', (new ChallengeSubmission(['flag_hash' => 'z']))->getAttributes());
    }
}
