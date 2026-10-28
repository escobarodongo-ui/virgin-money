import { SearchIcon } from "./icons";

export function TransactionSearch({
  query,
  onQuery,
  onClear,
}: {
  query: string;
  onQuery: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex h-11 items-center gap-2 bg-[#f2f2f4] px-4" role="search">
      <SearchIcon />
      <label className="sr-only" htmlFor="transaction-search">
        Search transactions
      </label>
      <input
        id="transaction-search"
        value={query}
        onChange={(event) => onQuery(event.target.value)}
        placeholder="Search transactions"
        className="min-w-0 flex-1 border-0 bg-transparent text-[14px] text-ink shadow-none outline-none placeholder:text-ink-soft focus:outline-none"
      />
      {query.length > 0 && (
        <button type="button" aria-label="Clear search" className="shrink-0 text-[13px] font-medium text-brand" onClick={onClear}>
          Clear
        </button>
      )}
    </div>
  );
}
