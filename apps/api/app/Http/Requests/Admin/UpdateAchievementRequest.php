<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAchievementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isModerator() ?? false;
    }

    public function rules(): array
    {
        return [
            'key' => ['prohibited'],
            'title' => ['sometimes', 'string', 'max:160'],
            'description' => ['sometimes', 'string', 'max:400'],
            'icon' => ['sometimes', 'nullable', 'string', 'max:60', 'regex:/^[a-z0-9_-]+$/'],
            'points' => ['sometimes', 'integer', 'min:0', 'max:10000'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:10000'],
            ...AchievementCriteriaRules::rules(required: false),
        ];
    }

    public function messages(): array
    {
        return [
            'key.prohibited' => 'The achievement key cannot be changed.',
            'icon.regex' => 'The icon may only contain lowercase letters, numbers, hyphens, and underscores.',
            ...AchievementCriteriaRules::messages(),
        ];
    }
}
