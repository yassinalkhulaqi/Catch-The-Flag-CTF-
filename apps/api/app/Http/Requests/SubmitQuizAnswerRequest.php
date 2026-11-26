<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates one answer to a quiz question. Business rules (option belongs to
 * the question, correct selection count) stay in QuizAction.
 */
class SubmitQuizAnswerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'question_id' => ['required', 'integer', 'min:1'],
            'selected_option_ids' => ['required', 'array', 'min:1'],
            'selected_option_ids.*' => ['integer', 'min:1'],
        ];
    }
}
