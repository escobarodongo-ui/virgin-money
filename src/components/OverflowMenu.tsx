interface OverflowMenuProps {
  open: boolean
  onClose: () => void
  onOpenAccountInfo: () => void
  onOpenPreferences: () => void
  onOpenAbout: () => void
}

export function OverflowMenu({
  open,
  onClose,
  onOpenAccountInfo,
  onOpenPreferences,
  onOpenAbout,
}: OverflowMenuProps) {
  if (!open) return null

  return (
    <>
      <button type="button" className="sheet-backdrop" aria-label="Dismiss menu" onClick={onClose} />
      <div className="menu-panel" role="menu" aria-label="Account options">
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onOpenAccountInfo()
            onClose()
          }}
        >
          Account information
        </button>
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onOpenPreferences()
            onClose()
          }}
        >
          Display preferences
        </button>
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onOpenAbout()
            onClose()
          }}
        >
          Application information
        </button>
      </div>
    </>
  )
}
