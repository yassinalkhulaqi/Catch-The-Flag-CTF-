<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\ContentStatus;
use App\Enums\Difficulty;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validates challenge listing filters (docs/api.md §1.2, §3).
 * Unknown query params are ignored; invalid values → 422.
 */
class ChallengeIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $tags = $this->query('tags');

        if (is_string($tags)) {
            $this->merge([
                'tags' => array_values(array_filter(array_map(
                    static fn (string $slug): string => trim($slug),
                    explode(',', $tags),
                ))),
            ]);
        }
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'q' => ['sometimes', 'nullable', 'string', 'max:255'],
            'category' => ['sometimes', 'nullable', 'string', 'max:80', 'exists:categories,slug'],
            'difficulty' => ['sometimes', 'nullable', 'string', Rule::in($this->difficultyValues())],
            'tags' => ['sometimes', 'nullable', 'array', 'max:20'],
            'tags.*' => ['string', 'max:80', 'exists:tags,slug'],
            'min_points' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:10000'],
            'max_points' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:10000'],
            // Query strings arrive as 'true'/'false'; the boolean rule
            // only accepts 1/0, so allowlist the string forms too and
            // let the search service coerce to bool.
            'solved' => ['sometimes', 'nullable', Rule::in([true, false, 1, 0, '1', '0', 'true', 'false'])],
            'status' => ['sometimes', 'nullable', 'string', Rule::in($this->statusValues())],
            'sort' => ['sometimes', 'nullable', 'string', Rule::in($this->sortValues())],
            'per_page' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['sometimes', 'nullable', 'integer', 'min:1'],
        ];
    }

    /**
     * @return list<string>
     */
    private function difficultyValues(): array
    {
        return array_map(static fn (Difficulty $case): string => $case->value, Difficulty::cases());
    }

    /**
     * @return list<string>
     */
    private function statusValues(): array
    {
        return array_map(static fn (ContentStatus $case): string => $case->value, ContentStatus::cases());
    }

    /**
     * @return list<string>
     */
    private function sortValues(): array
    {
        return ['points', '-points', 'created_at', '-created_at', 'title', '-title', 'solve_count', '-solve_count'];
    }
}
