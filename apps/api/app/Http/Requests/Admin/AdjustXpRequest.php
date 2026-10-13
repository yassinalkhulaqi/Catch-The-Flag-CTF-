<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Manual XP adjustment. `reason` is mandatory and lands in the ledger
 * note (max 200 per the xp_transactions schema). Bounds come from
 * config/ctf.php — no magic numbers.
 */
class AdjustXpRequest extends FormRequest
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
        $max = max(1, (int) config('ctf.admin.max_xp_adjustment'));

        return [
            'amount' => ['required', 'integer', 'not_in:0', "min:-{$max}", "max:{$max}"],
            'reason' => ['required', 'string', 'max:200'],
        ];
    }
}
