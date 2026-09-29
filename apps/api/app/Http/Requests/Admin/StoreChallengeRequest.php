<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\Difficulty;
use App\Enums\FlagValidationType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreChallengeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isModerator() ?? false;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:160'],
            'slug' => ['required', 'string', 'max:160', 'unique:challenges,slug'],
            'description' => ['required', 'string'],
            'scenario' => ['nullable', 'string'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'difficulty' => ['required', Rule::enum(Difficulty::class)],
            'points' => ['required', 'integer', 'min:1', 'max:10000'],
            'estimated_minutes' => ['sometimes', 'integer', 'min:0'],
            'flag_validation_type' => ['sometimes', Rule::in([FlagValidationType::Static->value])],
            'max_attempts' => ['nullable', 'integer', 'min:1'],
            'tag_ids' => ['sometimes', 'array'],
            'tag_ids.*' => ['integer', 'exists:tags,id'],
        ];
    }
}
