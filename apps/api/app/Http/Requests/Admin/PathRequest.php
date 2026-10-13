<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\Path;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Path validation. No `status` field — publishing flows through the
 * dedicated transition endpoints only.
 */
class PathRequest extends FormRequest
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

        $bound = $this->route('path');
        $ignoreId = $bound instanceof Path ? $bound->id : $bound;

        return [
            'title' => [$required, 'string', 'max:160'],
            'slug' => ['sometimes', 'nullable', 'string', 'alpha_dash', 'max:160', Rule::unique('paths', 'slug')->ignore($ignoreId)],
            'summary' => [$required, 'string', 'max:400'],
            'description' => ['sometimes', 'nullable', 'string'],
            'thumbnail_path' => ['sometimes', 'nullable', 'string', 'max:255'],
            'category_id' => ['sometimes', 'nullable', 'integer', 'exists:categories,id'],
            'difficulty' => [$required, 'string', Rule::in(['beginner', 'intermediate', 'advanced', 'expert'])],
            'estimated_minutes' => ['sometimes', 'integer', 'min:0', 'max:100000'],
        ];
    }
}
