<?php

declare(strict_types=1);

namespace App\Http\Requests\Challenge;

use Illuminate\Foundation\Http\FormRequest;

class SubmitFlagRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'flag' => ['required', 'string', 'min:1', 'max:500'],
        ];
    }
}
