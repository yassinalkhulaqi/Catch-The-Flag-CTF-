"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/errors";
import type { PathModule } from "@/lib/types";

/**
 * Reorder uses PUT /admin/modules/{id}. Title is required by that request,
 * so each move sends the existing title, description, and the new position.
 */
export function ModuleOrder({ modules }: { modules: PathModule[] }) {
  const router = useRouter();
  const [items, setItems] = useState([...modules].sort((a, b) => a.position - b.position));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function persist(next: PathModule[]) {
    setPending(true);
    setError(null);
    try {
      await Promise.all(
        next.map((module, index) =>
          api.put(`/admin/modules/${module.id}`, {
            title: module.title,
            description: module.description,
            position: index + 1,
          }),
        ),
      );
      setItems(next.map((module, index) => ({ ...module, position: index + 1 })));
      router.refresh();
    } catch (err) {
      setError(errorMessage(err, "Could not save the new order."));
    } finally {
      setPending(false);
    }
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    void persist(arrayMove(items, oldIndex, newIndex));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    void persist(arrayMove(items, index, target));
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted">This path has no modules to order yet.</p>;
  }

  return (
    <section className="space-y-3" aria-labelledby="module-order-heading">
      <h2 id="module-order-heading" className="font-mono text-xs uppercase tracking-[0.16em] text-accent">
        Module order
      </h2>
      <p className="text-sm text-muted">
        Drag a row or use the buttons. Each move updates module positions through the existing module endpoint.
      </p>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <ol className="space-y-2">
            {items.map((module, index) => (
              <SortableModule
                key={module.id}
                module={module}
                index={index}
                total={items.length}
                pending={pending}
                onMove={move}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
    </section>
  );
}

function SortableModule({
  module,
  index,
  total,
  pending,
  onMove,
}: {
  module: PathModule;
  index: number;
  total: number;
  pending: boolean;
  onMove: (index: number, direction: -1 | 1) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: module.id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2"
    >
      <button
        type="button"
        className="cursor-grab font-medium"
        aria-label={`Drag ${module.title}`}
        {...attributes}
        {...listeners}
      >
        {module.position}. {module.title}
      </button>
      <div className="flex gap-1">
        <Button type="button" size="sm" variant="outline" disabled={pending || index === 0} onClick={() => onMove(index, -1)}>
          Move up
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending || index === total - 1}
          onClick={() => onMove(index, 1)}
        >
          Move down
        </Button>
      </div>
    </li>
  );
}
