import { X } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Checkbox } from './ui';

export { Checkbox };

type Id = string | number;

// The ids selected in a list. Ids that leave the list leave the selection.
export function useSelection<T extends Id>(ids: T[]) {
  const [picked, setPicked] = useState<Set<T>>(new Set());
  const present = new Set(ids);
  const selected = new Set([...picked].filter((id) => present.has(id)));
  const all = ids.length > 0 && selected.size === ids.length;
  return {
    selected,
    ids: [...selected],
    count: selected.size,
    all,
    some: selected.size > 0 && !all,
    has: (id: T) => selected.has(id),
    toggle: (id: T) =>
      setPicked((current) => {
        const next = new Set(current);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    toggleAll: () => setPicked(all ? new Set() : new Set(ids)),
    clear: () => setPicked(new Set()),
  };
}

// The header row of a selectable list: select all and the count on the left, filters on the right. While rows are
// selected, a bar floats at the bottom of the screen with the count, the actions for those rows, and a clear button.
export function SelectionBar({
  count,
  total,
  all,
  some,
  onToggleAll,
  onClear,
  noun,
  children,
  extra,
}: {
  count: number;
  total: number;
  all: boolean;
  some: boolean;
  onToggleAll: () => void;
  onClear: () => void;
  noun: string;
  children?: ReactNode;
  extra?: ReactNode;
}) {
  return (
    <>
      <div className="flex min-h-12 flex-wrap items-center gap-3 border-b border-line px-4 py-2">
        <Checkbox checked={all} mixed={some} onChange={onToggleAll} label={all ? 'Clear the selection' : `Select all ${noun}`} />
        <span className="text-xs text-muted tabular-nums">
          {count ? `${count} of ${total} selected` : `${total} ${noun}`}
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-2">{extra}</div>
      </div>
      {count ? (
        <div
          role="toolbar"
          aria-label={`Actions for ${count} selected`}
          className="fixed inset-x-4 bottom-5 z-30 mx-auto flex w-fit max-w-[calc(100%-2rem)] animate-in flex-wrap items-center gap-2 rounded-xl border border-line bg-panel py-1.5 pr-1.5 pl-3 shadow-lg"
        >
          <span className="text-sm font-medium tabular-nums">{count} selected</span>
          <span aria-hidden className="mx-1 h-4 w-px bg-line" />
          {children}
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear the selection"
            title="Clear the selection"
            className="flex size-8 cursor-pointer items-center justify-center rounded-md text-muted hover:bg-panel-2 hover:text-fg"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : null}
    </>
  );
}
