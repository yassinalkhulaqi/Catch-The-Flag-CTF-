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

        return [
            'file' => ['required', 'file', "max:{$maxKb}"],
        ];
    }
}
