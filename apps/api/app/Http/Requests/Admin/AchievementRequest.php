<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\AchievementCriteriaType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Shared create/update validation for achievement badges. Criteria rules
 * mirror the shapes AchievementEvaluator actually evaluates; the DB CHECK
 * on achievements.criteria is the second layer.
 */
class AchievementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // role gating handled by the admin route middleware
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $creating = $this->isMethod('POST');
        $presence = $creating ? 'required' : 'sometimes';

        return [
            'key' => $creating
                ? ['required', 'string', 'max:80', 'regex:/^[a-z0-9_]+$/', 'unique:achievements,key']
                : ['prohibited'],
            'title' => [$presence, 'string', 'max:160'],
            'description' => [$presence, 'string', 'max:400'],
            'icon' => ['sometimes', 'nullable', 'string', 'max:60', 'regex:/^[a-z0-9_-]+$/'],
            'points' => ['sometimes', 'integer', 'min:0', 'max:10000'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:10000'],
            'criteria' => [$presence, 'array'],
            'criteria.type' => [$presence, Rule::enum(AchievementCriteriaType::class)],
            'criteria.threshold' => [$presence, 'integer', 'min:1', 'max:1000000'],
            'criteria.category_id' => [
                'exclude_unless:criteria.type,'.AchievementCriteriaType::CategorySolves->value,
                $presence,
                'integer',
                'exists:categories,id',
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'key.regex' => 'The key may only contain lowercase letters, numbers, and underscores.',
            'key.prohibited' => 'The achievement key cannot be changed.',
            'icon.regex' => 'The icon may only contain lowercase letters, numbers, hyphens, and underscores.',
            'criteria.type.enum' => 'Criteria type must be one of the supported achievement rules.',
            'criteria.category_id.required' => 'A category is required for category solve achievements.',
            'criteria.category_id.exists' => 'The selected category does not exist.',
        ];
    }
}
