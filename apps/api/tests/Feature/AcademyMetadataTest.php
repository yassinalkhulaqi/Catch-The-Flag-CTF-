<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Challenge;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AcademyMetadataTest extends TestCase
{
    use RefreshDatabase;

    public function test_detail_exposes_tier_and_walkthrough_without_flag_material(): void
    {
        $challenge = Challenge::factory()->create([
            'difficulty' => 'advanced',
            'solution_walkthrough' => '## Solution\n\nDo the thing.',
        ]);

        $response = $this->getJson("/api/v1/challenges/{$challenge->slug}")->assertOk();

        $response->assertJsonPath('data.tier', 'expert')
            ->assertJsonPath('data.solution_walkthrough', '## Solution\n\nDo the thing.');

        $body = $response->getContent() ?: '';
        foreach (['flag_ciphertext', 'flag_hash', 'flag_plaintext', 'storage_key'] as $forbidden) {
            $this->assertStringNotContainsString($forbidden, $body);
        }
    }

    public function test_tier_mapping_covers_all_difficulties(): void
    {
        $map = [
            'beginner' => 'apprentice',
            'intermediate' => 'practitioner',
            'advanced' => 'expert',
            'expert' => 'expert',
        ];

        foreach ($map as $difficulty => $tier) {
            $challenge = Challenge::factory()->create(['difficulty' => $difficulty]);

            $this->getJson("/api/v1/challenges/{$challenge->id}")
                ->assertOk()
                ->assertJsonPath('data.tier', $tier);
        }
    }

    public function test_admin_can_set_walkthrough(): void
    {
        $admin = User::factory()->admin()->create();
        $headers = ['Authorization' => 'Bearer '.$admin->createToken('web', ['*'], now()->addDay())->plainTextToken];
        $category = Category::factory()->create();

        $id = $this->postJson('/api/v1/admin/challenges', [
            'title' => 'Walkthrough Lab',
            'description' => 'Desc.',
            'category_id' => $category->id,
            'difficulty' => 'beginner',
            'points' => 100,
            'solution_walkthrough' => '## Steps',
        ], $headers)->assertCreated()->json('data.id');

        $this->getJson("/api/v1/admin/challenges/{$id}", $headers)->assertOk()
            ->assertJsonPath('data.solution_walkthrough', '## Steps');
    }
}
