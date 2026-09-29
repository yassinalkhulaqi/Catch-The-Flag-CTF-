<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\Difficulty;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePathRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isModerator() ?? false;
    }

    public function rules(): array
    {
        $path = $this->route('path');
        $id = is_object($path) ? $path->id : $path;

        return [
            'title' => ['sometimes', 'string', 'max:160'],
            'slug' => ['sometimes', 'string', 'max:160', Rule::unique('paths', 'slug')->ignore($id)],
            'summary' => ['sometimes', 'string', 'max:400'],
            'description' => ['nullable', 'string'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'difficulty' => ['sometimes', Rule::enum(Difficulty::class)],
            'estimated_minutes' => ['sometimes', 'integer', 'min:0'],
            'prerequisite_ids' => ['sometimes', 'array'],
            'prerequisite_ids.*' => ['integer', 'exists:paths,id'],
        ];
    }
}
