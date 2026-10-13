<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class HintRequest extends FormRequest
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
        $required = $this->isMethod('POST') ? 'required' : 'sometimes';

        return [
            'content' => [$required, 'string'],
            'cost_points' => [$required, 'integer', 'min:0', 'max:10000'],
            'position' => ['sometimes', 'integer', 'min:0', 'max:100000'],
        ];
    }
}
