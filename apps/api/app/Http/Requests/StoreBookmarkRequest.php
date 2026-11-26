<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates a bookmark upsert. Visibility of the target is checked by the
 * controller through a Policy, so this request only shapes the payload.
 */
class StoreBookmarkRequest extends FormRequest
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
            'type' => ['required', 'string', 'in:challenge,lesson,path'],
            'id' => ['required', 'integer', 'min:1'],
            'note' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ];
    }
}
