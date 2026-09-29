<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreFlagRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isModerator() ?? false;
    }

    public function rules(): array
    {
        return [
            'value' => ['required', 'string', 'min:1', 'max:500'],
            'label' => ['nullable', 'string', 'max:80'],
            'case_sensitive' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
