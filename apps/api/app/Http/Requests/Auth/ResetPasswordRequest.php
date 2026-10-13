<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use App\Rules\NotCommonPassword;
use Illuminate\Foundation\Http\FormRequest;

class ResetPasswordRequest extends FormRequest
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
        return [
            'token' => ['required', 'string'],
            'email' => ['required', 'string', 'email:rfc', 'max:255'],
            'password' => ['required', 'string', 'min:12', 'max:255', 'confirmed', new NotCommonPassword],
        ];
    }
}
