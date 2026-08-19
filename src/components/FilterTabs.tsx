import { LayoutList, CheckCircle2, Circle, AlertCircle } from 'lucide-react';

export type FilterType = 'all' | 'active' | 'completed' | 'overdue';

interface FilterTabsProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  counts: Record<FilterType, number>;
}

const filters: { value: FilterType; label: string; icon: typeof LayoutList }[] = [
  { value: 'all', label: 'All', icon: LayoutList },
  { value: 'active', label: 'Active', icon: Circle },
  { value: 'completed', label: 'Done', icon: CheckCircle2 },
  { value: 'overdue', label: 'Overdue', icon: AlertCircle },
];

export default function FilterTabs({ activeFilter, onFilterChange, counts }: FilterTabsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {filters.map((filter) => {
        const Icon = filter.icon;
        const isActive = activeFilter === filter.value;
        const count = counts[filter.value];

        return (
          <button
            key={filter.value}
            onClick={() => onFilterChange(filter.value)}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
              isActive
                ? 'bg-slate-800 text-white shadow-sm dark:bg-slate-700'
                : 'bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
            }`}
          >
            <Icon className="h-4 w-4" />
            {filter.label}
            {count > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-700'}`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
