<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UploadChallengeFileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isModerator() ?? false;
    }

    public function rules(): array
    {
        $maxKb = (int) config('ctf.uploads.max_file_mb', 64) * 1024;

        return [
            'file' => ['required', 'file', 'max:'.$maxKb],
        ];
    }
}
