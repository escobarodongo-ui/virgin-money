interface PayIdSheetProps {
  open: boolean
  onClose: () => void
}

export function PayIdSheet({ open, onClose }: PayIdSheetProps) {
  if (!open) return null

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label="Manage PayID">
      <button type="button" className="sheet__handle-space" aria-label="Close" onClick={onClose} />
      <div className="sheet__panel">
        <div
          style={{
            display: 'grid',
            height: 48,
            gridTemplateColumns: '60px 1fr 60px',
            alignItems: 'center',
            padding: '0 13px',
          }}
        >
          <button type="button" className="text-brand" style={{ textAlign: 'left', fontSize: 13, fontWeight: 600 }} onClick={onClose}>
            Close
          </button>
          <h2 className="text-ink" style={{ margin: 0, textAlign: 'center', fontSize: 13, fontWeight: 500 }}>
            Manage PayID
          </h2>
        </div>
        <p className="text-ink-soft" style={{ margin: 0, padding: '16px 13px 8px', fontSize: 11.5, lineHeight: '15px' }}>
          Receive payments to a specific account, without having to remember the BSB and account number. Demo PayIDs
          only.
        </p>
        <p className="text-ink-soft" style={{ margin: 0, padding: '8px 13px', fontSize: 11.5 }}>
          Your PayIDs
        </p>
        <div className="surface-card" style={{ margin: '0 13px' }}>
          {[
            { id: 'u85i31@virginmoney.com.au', note: 'Linked to an external account' },
            { id: 'panosaudisho123@gmail.com', note: 'Unverified email address' },
          ].map((item, index, arr) => (
            <button
              key={item.id}
              type="button"
              style={{
                display: 'flex',
                width: '100%',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 13,
                textAlign: 'left',
                borderBottom: index < arr.length - 1 ? '1px solid var(--line)' : undefined,
              }}
            >
              <span>
                <span style={{ display: 'block', fontSize: 12.5, fontWeight: 500 }}>{item.id}</span>
                <span className="text-ink-soft" style={{ display: 'block', fontSize: 12 }}>
                  {item.note}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
