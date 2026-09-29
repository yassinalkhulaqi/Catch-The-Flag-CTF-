<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreHintRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isModerator() ?? false;
    }

    public function rules(): array
    {
        return [
            'content' => ['required', 'string'],
            'cost_points' => ['sometimes', 'integer', 'min:0'],
            'position' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
