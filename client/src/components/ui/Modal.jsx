import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { lockBodyScroll, popLayer, pushLayer, isTopLayer, getFocusable } from './overlay';

const SIZES = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
};

/**
 * Accessible dialog rendered in a portal. Full-screen on mobile, centered card from `sm` up.
 * Esc / overlay click close it, focus is trapped inside and restored on close.
 *
 * @param {boolean} open
 * @param {() => void} onClose
 * @param {import('react').ReactNode} title
 * @param {import('react').ReactNode} [description]
 * @param {import('react').ReactNode} [footer] action buttons (a submit button can target a form via `form="<form id>"`)
 * @param {'sm'|'md'|'lg'|'xl'} [size]
 * @param {boolean} [dismissible] when false, Esc/overlay/close button are disabled (e.g. while saving)
 * @param {import('react').RefObject} [initialFocusRef] element focused on open
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  dismissible = true,
  initialFocusRef,
  className,
  bodyClassName,
}) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const dismissibleRef = useRef(dismissible);

  useEffect(() => {
    onCloseRef.current = onClose;
    dismissibleRef.current = dismissible;
  });

  useEffect(() => {
    if (!open) return undefined;

    const layer = pushLayer();
    const unlockScroll = lockBodyScroll();
    const previouslyFocused = document.activeElement;
    const panel = panelRef.current;

    const focusTarget = initialFocusRef?.current ?? getFocusable(panel)[0] ?? panel;
    focusTarget?.focus({ preventScroll: true });

    const onKeyDown = (event) => {
      if (!isTopLayer(layer)) return;
      if (event.key === 'Escape') {
        event.stopPropagation();
        if (dismissibleRef.current) onCloseRef.current?.();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = getFocusable(panel);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      popLayer(layer);
      unlockScroll();
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus({ preventScroll: true });
    };
  }, [open, initialFocusRef]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-stretch justify-center sm:items-center sm:p-4">
      <div
        aria-hidden="true"
        className="absolute inset-0 animate-fade-in bg-slate-900/40"
        onClick={() => dismissible && onClose?.()}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'relative flex h-full w-full animate-scale-in flex-col bg-white shadow-popover focus:outline-none',
          'sm:h-auto sm:max-h-[min(90vh,52rem)] sm:rounded-2xl sm:border sm:border-slate-200/60',
          SIZES[size],
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold text-slate-900">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-0.5 text-sm text-slate-500">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={!dismissible}
            className="-mr-2 -mt-1 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        <div className={cn('flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6', bodyClassName)}>{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-3.5 sm:flex-row sm:justify-end sm:rounded-b-2xl sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
