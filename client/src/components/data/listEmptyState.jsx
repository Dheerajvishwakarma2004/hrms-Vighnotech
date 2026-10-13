import { FilterX, RotateCcw } from 'lucide-react';
import Button from '@/components/ui/Button';

/**
 * DataTable `empty` props for a filterable list: "No <noun> match your filters" + Clear filters when
 * filters are active, otherwise the list's own "nothing here yet" state.
 *
 * @param {boolean} filtered whether any filter is active
 * @param {string} noun plural item name, e.g. "candidates"
 * @param {() => void} onReset clears the filters
 * @param {{ icon, title, description, action }} empty state shown when the list has no data at all
 */
export function getListEmptyState({ filtered, noun, onReset, empty }) {
  if (!filtered) return empty;
  return {
    icon: FilterX,
    title: `No ${noun} match your filters`,
    description: 'Try a different search term or clear the filters.',
    action: (
      <Button variant="secondary" size="sm" icon={RotateCcw} onClick={onReset}>
        Clear filters
      </Button>
    ),
  };
}
