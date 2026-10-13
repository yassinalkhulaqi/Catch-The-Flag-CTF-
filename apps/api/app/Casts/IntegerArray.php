<?php

declare(strict_types=1);

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * PostgreSQL integer[] columns. Eloquent's `array` cast targets JSON;
 * this cast speaks native Postgres array literals (`{1,2}`).
 *
 * @implements CastsAttributes<list<int>, list<int>>
 */
class IntegerArray implements CastsAttributes
{
    /**
     * @return list<int>
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): array
    {
        if (is_array($value)) {
            return array_values(array_map(intval(...), $value));
        }

        $value = trim((string) $value, '{}');

        if ($value === '') {
            return [];
        }

        return array_values(array_map(intval(...), explode(',', $value)));
    }

    /**
     * @param  list<int>  $value
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): string
    {
        $ints = array_values(array_map(intval(...), (array) $value));

        return '{'.implode(',', $ints).'}';
    }
}
