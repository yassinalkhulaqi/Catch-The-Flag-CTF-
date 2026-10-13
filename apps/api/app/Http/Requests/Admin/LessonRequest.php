<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\Lesson;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LessonRequest extends FormRequest
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

        $bound = $this->route('lesson');
        $moduleId = $this->route('module')?->id ?? ($bound instanceof Lesson ? $bound->module_id : null);
        $ignoreId = $bound instanceof Lesson ? $bound->id : $bound;

        return [
            'title' => [$required, 'string', 'max:160'],
            'slug' => [
                'sometimes', 'nullable', 'string', 'alpha_dash', 'max:160',
                Rule::unique('lessons', 'slug')->where('module_id', $moduleId)->ignore($ignoreId),
            ],
            'summary' => ['sometimes', 'nullable', 'string', 'max:400'],
            'content' => [$required, 'string'],
            'position' => ['sometimes', 'integer', 'min:0', 'max:100000'],
            'estimated_minutes' => ['sometimes', 'integer', 'min:0', 'max:100000'],
            'is_published' => ['sometimes', 'boolean'],
        ];
    }
}
