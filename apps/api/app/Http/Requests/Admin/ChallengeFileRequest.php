<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Challenge file upload validation. Size caps the configured limit
 * (config/ctf.php); MIME is re-checked server-side by
 * ChallengeFileService — never trust the client here.
 */
class ChallengeFileRequest extends FormRequest
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
        $maxKb = max(1, (int) config('ctf.uploads.max_file_mb') * 1024);
        $mimeTypes = implode(',', array_map('strval', (array) config('ctf.uploads.allowed_mime_types', [])));

        return [
            'file' => ['required', 'file', "max:{$maxKb}", "mimetypes:{$mimeTypes}"],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'file.max' => 'The file may not be larger than :max kilobytes.',
            'file.mimetypes' => 'This file type is not allowed.',
        ];
    }
}
