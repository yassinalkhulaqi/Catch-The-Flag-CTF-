<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreAchievementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isModerator() ?? false;
    }

    public function rules(): array
    {
        return [
            'key' => ['required', 'string', 'max:80', 'unique:achievements,key'],
            'title' => ['required', 'string', 'max:160'],
            'description' => ['required', 'string', 'max:400'],
            'icon' => ['nullable', 'string', 'max:60'],
            'criteria' => ['required', 'array'],
            'criteria.type' => ['required', 'string'],
            'points' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer'],
        ];
    }
}
