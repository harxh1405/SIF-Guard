import { create } from 'zustand';

export interface DashboardFilters {
  dateRange: {
    from: string | null;
    to: string | null;
  };
  locations: string[];
  activities: string[];
  hazards: string[];
  barriers: string[];
  sifClassification: string[];
  lifeSavingRules: string[];
  patterns: string[];
  searchQuery: string;
}

interface FilterState {
  filters: DashboardFilters;
  setDateRange: (from: string | null, to: string | null) => void;
  toggleFilter: (
    key: keyof Omit<DashboardFilters, 'dateRange' | 'searchQuery'>,
    value: string
  ) => void;
  setFilterList: (
    key: keyof Omit<DashboardFilters, 'dateRange' | 'searchQuery'>,
    values: string[]
  ) => void;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;
  hasActiveFilters: () => boolean;
}

const initialFilters: DashboardFilters = {
  dateRange: { from: null, to: null },
  locations: [],
  activities: [],
  hazards: [],
  barriers: [],
  sifClassification: [],
  lifeSavingRules: [],
  patterns: [],
  searchQuery: '',
};

export const useFilterStore = create<FilterState>((set, get) => ({
  filters: initialFilters,

  setDateRange: (from, to) =>
    set((state) => ({
      filters: { ...state.filters, dateRange: { from, to } },
    })),

  toggleFilter: (key, value) =>
    set((state) => {
      const currentList = state.filters[key] as string[];
      const exists = currentList.includes(value);
      const newList = exists
        ? currentList.filter((v) => v !== value)
        : [...currentList, value];
      return {
        filters: { ...state.filters, [key]: newList },
      };
    }),

  setFilterList: (key, values) =>
    set((state) => ({
      filters: { ...state.filters, [key]: values },
    })),

  setSearchQuery: (searchQuery) =>
    set((state) => ({
      filters: { ...state.filters, searchQuery },
    })),

  clearFilters: () =>
    set({
      filters: initialFilters,
    }),

  hasActiveFilters: () => {
    const { filters } = get();
    return (
      Boolean(filters.dateRange.from || filters.dateRange.to) ||
      filters.locations.length > 0 ||
      filters.activities.length > 0 ||
      filters.hazards.length > 0 ||
      filters.barriers.length > 0 ||
      filters.sifClassification.length > 0 ||
      filters.lifeSavingRules.length > 0 ||
      filters.patterns.length > 0 ||
      filters.searchQuery.trim().length > 0
    );
  },
}));
