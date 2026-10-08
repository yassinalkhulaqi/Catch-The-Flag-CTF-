<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\AchievementCriteriaType;
use Illuminate\Validation\Rule;

/**
 * Shared criteria shape for achievement create/update.
 * Evaluation reads this JSON in AchievementService — keep the rules aligned.
 */
final class AchievementCriteriaRules
{
    /**
     * @return array<string, mixed>
     */
    public static function rules(bool $required): array
    {
        $presence = $required ? 'required' : 'required_with:criteria';

        return [
            'criteria' => [$required ? 'required' : 'sometimes', 'array'],
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
    public static function messages(): array
    {
        return [
            'criteria.type.enum' => 'Criteria type must be one of the supported achievement rules.',
            'criteria.category_id.required' => 'A category is required for category solve achievements.',
            'criteria.category_id.required_with' => 'A category is required for category solve achievements.',
            'criteria.category_id.exists' => 'The selected category does not exist.',
        ];
    }
}
