<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\Difficulty;
use App\Models\Path;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdatePathRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isModerator() ?? false;
    }

    public function rules(): array
    {
        $path = $this->route('path');
        $id = is_object($path) ? $path->id : $path;

        return [
            'title' => ['sometimes', 'string', 'max:160'],
            'slug' => ['sometimes', 'string', 'max:160', Rule::unique('paths', 'slug')->ignore($id)],
            'summary' => ['sometimes', 'string', 'max:400'],
            'description' => ['nullable', 'string'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'difficulty' => ['sometimes', Rule::enum(Difficulty::class)],
            'estimated_minutes' => ['sometimes', 'integer', 'min:0'],
            'prerequisite_ids' => ['sometimes', 'array'],
            'prerequisite_ids.*' => ['integer', 'exists:paths,id'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->has('prerequisite_ids') || ! $this->exists('prerequisite_ids')) {
                    return;
                }

                $ids = array_map('intval', $this->input('prerequisite_ids', []));
                $path = $this->route('path');
                $pathId = $path instanceof Path ? (int) $path->id : (int) $path;

                if (in_array($pathId, $ids, true)) {
                    $validator->errors()->add('prerequisite_ids', 'A path cannot require itself.');

                    return;
                }

                if ($this->createsCycle($pathId, $ids)) {
                    $validator->errors()->add('prerequisite_ids', 'Prerequisites cannot form a cycle.');
                }
            },
        ];
    }

    /**
     * @param  list<int>  $nextIds
     */
    private function createsCycle(int $pathId, array $nextIds): bool
    {
        $seen = [];
        $queue = $nextIds;

        while ($queue !== []) {
            $id = array_pop($queue);
            if ($id === $pathId) {
                return true;
            }
            if (isset($seen[$id])) {
                continue;
            }
            $seen[$id] = true;

            $parents = DB::table('path_prerequisites')
                ->where('path_id', $id)
                ->pluck('prerequisite_path_id');

            foreach ($parents as $parentId) {
                $queue[] = (int) $parentId;
            }
        }

        return false;
    }
}
