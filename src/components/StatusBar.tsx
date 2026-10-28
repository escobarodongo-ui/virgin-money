export function StatusBar({ light = true }: { light?: boolean }) {
  return (
    <div className={`status-bar ${light ? 'status-bar--light' : 'status-bar--dark'}`}>
      <span className="status-bar__left">
        06:28
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
          <path d="M10.5 7.5A5 5 0 0 1 4.5 1.5a5 5 0 1 0 6 6Z" fill="currentColor" />
        </svg>
      </span>
      <span className="status-bar__right">
        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor" aria-hidden>
          <rect x="0" y="7" width="3" height="4" rx="0.7" />
          <rect x="4.5" y="5" width="3" height="6" rx="0.7" />
          <rect x="9" y="2.5" width="3" height="8.5" rx="0.7" opacity="0.4" />
          <rect x="13.5" y="0" width="3" height="11" rx="0.7" />
        </svg>
        <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor" aria-hidden>
          <path d="M7.5 9.5a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4Zm-3.2-2.1a4.5 4.5 0 0 1 6.4 0l.9-.9a5.8 5.8 0 0 0-8.2 0l.9.9Zm-2-2a7.4 7.4 0 0 1 10.4 0l.9-.9a8.7 8.7 0 0 0-12.2 0l.9.9Z" />
        </svg>
        <span className="status-bar__battery" aria-hidden>
          <span className="status-bar__battery-fill" />
        </span>
      </span>
    </div>
  )
}
