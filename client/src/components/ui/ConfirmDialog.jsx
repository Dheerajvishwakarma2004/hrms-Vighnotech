import { useRef } from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import Button from './Button';
import Modal from './Modal';

/**
 * Confirmation modal for destructive / important actions.
 * @param {() => void} onConfirm
 * @param {'danger'|'primary'} [variant]
 * @param {boolean} [loading] disables dismissal and shows a spinner on the confirm button
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  children,
}) {
  const cancelRef = useRef(null);
  const Icon = variant === 'danger' ? AlertTriangle : HelpCircle;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      dismissible={!loading}
      initialFocusRef={cancelRef}
      footer={
        <>
          <Button ref={cancelRef} variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-4">
        <span
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
            variant === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-primary-100 text-primary-600',
          )}
        >
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
        <div className="space-y-2 text-sm text-slate-600">
          {message && <p>{message}</p>}
          {children}
        </div>
      </div>
    </Modal>
  );
}
