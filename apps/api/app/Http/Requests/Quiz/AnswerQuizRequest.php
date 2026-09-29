<?php

declare(strict_types=1);

namespace App\Http\Requests\Quiz;

use Illuminate\Foundation\Http\FormRequest;

class AnswerQuizRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'question_id' => ['required', 'integer', 'exists:quiz_questions,id'],
            'selected_option_ids' => ['required', 'array', 'min:0'],
            'selected_option_ids.*' => ['integer', 'exists:quiz_question_options,id'],
        ];
    }
}
