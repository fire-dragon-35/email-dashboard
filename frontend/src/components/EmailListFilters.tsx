interface EmailListFiltersProps {
  searchText: string;
  onSearchChange: (value: string) => void;
}

export function EmailListFilters({ searchText, onSearchChange }: EmailListFiltersProps) {
  return (
    <div className="email-list__filters">
      <input
        type="search"
        className="email-list__search"
        placeholder="Search subject/from"
        aria-label="Search subject/from"
        value={searchText}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  );
}
