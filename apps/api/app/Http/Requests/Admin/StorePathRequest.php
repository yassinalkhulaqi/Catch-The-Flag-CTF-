<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\Difficulty;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePathRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isModerator() ?? false;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:160'],
            'slug' => ['required', 'string', 'max:160', 'unique:paths,slug'],
            'summary' => ['required', 'string', 'max:400'],
            'description' => ['nullable', 'string'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'difficulty' => ['required', Rule::enum(Difficulty::class)],
            'estimated_minutes' => ['sometimes', 'integer', 'min:0'],
            'prerequisite_ids' => ['sometimes', 'array'],
            'prerequisite_ids.*' => ['integer', 'exists:paths,id'],
        ];
    }
}
