<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreLessonRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isModerator() ?? false;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:160'],
            'slug' => ['required', 'string', 'max:160'],
            'summary' => ['nullable', 'string', 'max:400'],
            'content' => ['required', 'string'],
            'position' => ['sometimes', 'integer', 'min:0'],
            'estimated_minutes' => ['sometimes', 'integer', 'min:0'],
            'is_published' => ['sometimes', 'boolean'],
        ];
    }
}
