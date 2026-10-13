<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class QuestionRequest extends FormRequest
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
            'question' => [$required, 'string'],
            'type' => [$required, 'string', Rule::in(['single', 'multiple', 'true_false'])],
            'explanation' => ['sometimes', 'nullable', 'string'],
            'points' => ['sometimes', 'integer', 'min:1', 'max:10000'],
            'position' => ['sometimes', 'integer', 'min:0', 'max:100000'],
            'is_published' => ['sometimes', 'boolean'],
        ];
    }
}
