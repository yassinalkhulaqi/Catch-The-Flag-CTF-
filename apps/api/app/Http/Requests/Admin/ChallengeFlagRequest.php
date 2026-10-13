<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Write-only flag validation. The plaintext `flag` is required on
 * create; on update it may be omitted to toggle metadata only.
 * Responses never echo the value back.
 */
class ChallengeFlagRequest extends FormRequest
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
        $valueRule = $this->isMethod('POST') ? 'required' : 'sometimes';

        return [
            'flag' => [$valueRule, 'nullable', 'string', 'max:500'],
            'label' => ['sometimes', 'nullable', 'string', 'max:80'],
            'case_sensitive' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
