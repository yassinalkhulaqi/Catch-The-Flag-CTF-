<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isModerator() ?? false;
    }

    public function rules(): array
    {
        $id = $this->route('category')?->id ?? $this->route('category');

        return [
            'name' => ['sometimes', 'string', 'max:80'],
            'slug' => ['sometimes', 'string', 'max:80', Rule::unique('categories', 'slug')->ignore($id)],
            'description' => ['nullable', 'string', 'max:500'],
            'color' => ['nullable', 'string', 'max:9'],
            'icon' => ['nullable', 'string', 'max:60'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
