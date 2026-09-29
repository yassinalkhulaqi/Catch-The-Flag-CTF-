<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreQuizRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isModerator() ?? false;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:160'],
            'description' => ['nullable', 'string'],
            'pass_score' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'position' => ['sometimes', 'integer', 'min:0'],
            'is_published' => ['sometimes', 'boolean'],
            'module_id' => ['nullable', 'integer', 'exists:path_modules,id', 'required_without:lesson_id'],
            'lesson_id' => ['nullable', 'integer', 'exists:lessons,id', 'required_without:module_id'],
        ];
    }
}
