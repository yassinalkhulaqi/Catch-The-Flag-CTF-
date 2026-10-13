<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\Path;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Staff path shape: all scalar fields plus workflow status, drafts
 * included. Modules embed when eager-loaded.
 *
 * @mixin Path
 */
class AdminPathResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'summary' => $this->summary,
            'description' => $this->description,
            'thumbnail_path' => $this->thumbnail_path,
            'category_id' => $this->category_id,
            'difficulty' => $this->difficulty->value,
            'estimated_minutes' => (int) $this->estimated_minutes,
            'status' => $this->status->value,
            'published_at' => $this->published_at?->toISOString(),
            'created_by' => $this->created_by,
            'modules' => AdminModuleResource::collection($this->whenLoaded('modules')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
