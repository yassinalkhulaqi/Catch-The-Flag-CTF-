<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\Category;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CategoryRequest extends FormRequest
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
        $required = $this->isMethod('POST') ? 'required' : 'sometimes';

        $bound = $this->route('category');
        $ignoreId = $bound instanceof Category ? $bound->id : $bound;

        return [
            'name' => [$required, 'string', 'max:80'],
            'slug' => ['sometimes', 'nullable', 'string', 'alpha_dash', 'max:80', Rule::unique('categories', 'slug')->ignore($ignoreId)],
            'description' => ['sometimes', 'nullable', 'string', 'max:500'],
            'color' => ['sometimes', 'nullable', 'string', 'max:9'],
            'icon' => ['sometimes', 'nullable', 'string', 'max:60'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:100000'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
