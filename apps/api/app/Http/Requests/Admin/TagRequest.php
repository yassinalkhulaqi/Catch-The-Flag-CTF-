<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\Tag;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TagRequest extends FormRequest
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

        $bound = $this->route('tag');
        $ignoreId = $bound instanceof Tag ? $bound->id : $bound;

        return [
            'name' => [$required, 'string', 'max:80', Rule::unique('tags', 'name')->ignore($ignoreId)],
            'slug' => ['sometimes', 'nullable', 'string', 'alpha_dash', 'max:80', Rule::unique('tags', 'slug')->ignore($ignoreId)],
        ];
    }
}
