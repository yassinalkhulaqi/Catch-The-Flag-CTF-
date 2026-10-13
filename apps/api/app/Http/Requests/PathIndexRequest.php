<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\ContentStatus;
use App\Enums\Difficulty;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validates path listing filters (docs/api.md §1.2, §3).
 * The `progress` filter applies to authenticated learners only and
 * is ignored for guests.
 */
class PathIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
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
            'status' => ['sometimes', 'nullable', 'string', Rule::in($this->statusValues())],
            'progress' => ['sometimes', 'nullable', 'string', Rule::in(['in_progress', 'completed', 'not_started'])],
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
        return ['created_at', '-created_at', 'title', '-title', 'estimated_minutes', '-estimated_minutes'];
    }
}
