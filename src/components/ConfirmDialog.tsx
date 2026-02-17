'use client'

import { useEffect, useRef, memo } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default memo(function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) {
      dialog.showModal()
      // Focus the cancel button for safety (destructive actions should not be auto-triggered)
      cancelRef.current?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  // Close on backdrop click
  const handleClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onCancel()
    }
  }

  // Close on Escape
  const handleCancel = (e: React.SyntheticEvent) => {
    e.preventDefault()
    onCancel()
  }

  if (!open) return null

  return (
    <dialog
      ref={dialogRef}
      onClick={handleClick}
      onCancel={handleCancel}
      className="fixed inset-0 z-50 m-auto rounded-xl border border-navy-200 bg-white p-0 shadow-xl backdrop:bg-black/40 backdrop:backdrop-blur-sm max-w-sm w-[calc(100%-2rem)]"
    >
      <div className="p-5">
        <h2 className="text-base font-bold text-navy-900 mb-1">{title}</h2>
        <p className="text-sm text-navy-500">{message}</p>
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-navy-100 px-5 py-3">
        <button
          ref={cancelRef}
          onClick={onCancel}
          className="rounded-lg border border-navy-200 bg-white px-4 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 focus-visible:ring-offset-2"
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
            destructive
              ? 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-400'
              : 'bg-navy-900 hover:bg-navy-800 focus-visible:ring-navy-400'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  )
})
