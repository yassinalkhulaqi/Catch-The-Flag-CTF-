<?php

declare(strict_types=1);

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'min:2', 'max:80'],
            'bio' => ['sometimes', 'nullable', 'string', 'max:500'],
            // Only allow relative public-disk avatar keys (no absolute/remote paths).
            'avatar_path' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
                'regex:/^avatars\/[A-Za-z0-9._-]+$/',
            ],
        ];
    }
}
