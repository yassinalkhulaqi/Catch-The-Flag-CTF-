<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\Difficulty;
use App\Enums\FlagValidationType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateChallengeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isModerator() ?? false;
    }

    public function rules(): array
    {
        $challenge = $this->route('challenge');
        $id = is_object($challenge) ? $challenge->id : $challenge;

        return [
            'title' => ['sometimes', 'string', 'max:160'],
            'slug' => ['sometimes', 'string', 'max:160', Rule::unique('challenges', 'slug')->ignore($id)],
            'description' => ['sometimes', 'string'],
            'scenario' => ['nullable', 'string'],
            'category_id' => ['sometimes', 'integer', 'exists:categories,id'],
            'difficulty' => ['sometimes', Rule::enum(Difficulty::class)],
            'points' => ['sometimes', 'integer', 'min:1', 'max:10000'],
            'estimated_minutes' => ['sometimes', 'integer', 'min:0'],
            'flag_validation_type' => ['sometimes', Rule::in([FlagValidationType::Static->value])],
            'max_attempts' => ['nullable', 'integer', 'min:1'],
            'tag_ids' => ['sometimes', 'array'],
            'tag_ids.*' => ['integer', 'exists:tags,id'],
        ];
    }
}
