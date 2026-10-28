import { SearchIcon } from './icons'

interface TransactionSearchProps {
  value: string
  active: boolean
  onChange: (value: string) => void
  onActivate: () => void
  onCancel: () => void
}

export function TransactionSearch({
  value,
  active,
  onChange,
  onActivate,
  onCancel,
}: TransactionSearchProps) {
  if (!active) {
    return (
      <button
        type="button"
        className="list-row"
        onClick={onActivate}
        aria-label="Search transactions"
      >
        <span className="list-row__label">Search transactions</span>
        <span className="list-row__right">
          <SearchIcon />
        </span>
      </button>
    )
  }

  return (
    <div className="search-bar">
      <SearchIcon />
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search transactions"
        aria-label="Search transactions"
      />
      {value ? (
        <button
          type="button"
          className="text-brand"
          style={{ fontSize: 13, fontWeight: 500 }}
          onClick={() => onChange('')}
        >
          Clear
        </button>
      ) : null}
      <button
        type="button"
        className="text-brand"
        style={{ fontSize: 13, fontWeight: 500 }}
        onClick={onCancel}
      >
        Cancel
      </button>
    </div>
  )
}
