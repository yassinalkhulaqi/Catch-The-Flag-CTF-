<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\Challenge;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Challenge create/update validation. Deliberately has NO status,
 * flag, XP, or role fields: those travel through dedicated endpoints
 * only. Unknown inputs are ignored (only validated() reaches actions).
 */
class ChallengeRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Authentication + staff role are enforced by route middleware.
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $required = $this->isMethod('POST') ? 'required' : 'sometimes';

        $bound = $this->route('challenge');
        $ignoreId = $bound instanceof Challenge ? $bound->id : $bound;

        return [
            'title' => [$required, 'string', 'max:160'],
            'slug' => ['sometimes', 'nullable', 'string', 'alpha_dash', 'max:160', Rule::unique('challenges', 'slug')->ignore($ignoreId)],
            'description' => [$required, 'string'],
            'scenario' => ['sometimes', 'nullable', 'string'],
            'solution_walkthrough' => ['sometimes', 'nullable', 'string'],
            'category_id' => [$required, 'integer', 'exists:categories,id'],
            'difficulty' => [$required, 'string', Rule::in(['beginner', 'intermediate', 'advanced', 'expert'])],
            'points' => [$required, 'integer', 'min:1', 'max:10000'],
            'estimated_minutes' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:100000'],
            'flag_validation_type' => ['sometimes', 'string', Rule::in(['static'])],
            'max_attempts' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:100000'],
            'tag_ids' => ['sometimes', 'array', 'max:25'],
            'tag_ids.*' => ['integer', 'exists:tags,id'],
        ];
    }
}
