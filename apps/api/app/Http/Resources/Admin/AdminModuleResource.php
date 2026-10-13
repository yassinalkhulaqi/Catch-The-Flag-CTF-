<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\PathModule;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin PathModule
 */
class AdminModuleResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'path_id' => $this->path_id,
            'title' => $this->title,
            'description' => $this->description,
            'position' => (int) $this->position,
            'is_published' => (bool) $this->is_published,
            'lessons' => AdminLessonResource::collection($this->whenLoaded('lessons')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
