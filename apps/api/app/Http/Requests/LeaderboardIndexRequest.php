<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates public leaderboard pagination. Every other list endpoint already
 * rejects out-of-range values; the leaderboard must behave the same way.
 */
class LeaderboardIndexRequest extends FormRequest
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
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:'.(int) config('ctf.leaderboard.max_page_size', 100)],
        ];
    }
}
