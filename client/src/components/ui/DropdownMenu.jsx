import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';
import { cn } from '@/lib/cn';

const MENU_GAP = 6;
const VIEWPORT_PADDING = 8;
const ITEM_SELECTOR = '[role="menuitem"]:not([disabled])';

/**
 * Accessible action menu rendered in a portal (never clipped by scrolling tables).
 *
 * @param {Array<{ label: string, icon?: import('react').ComponentType, onClick: () => void,
 *   danger?: boolean, disabled?: boolean, hidden?: boolean }>} items
 * @param {import('react').ReactNode} [trigger] custom trigger content (defaults to a kebab icon)
 * @param {string} [label] accessible name for the trigger button
 * @param {import('react').ReactNode} [header] non-interactive content at the top of the menu
 * @param {'start'|'end'} [align] horizontal alignment relative to the trigger
 */
export default function DropdownMenu({
  items = [],
  trigger,
  label = 'Open actions menu',
  header,
  align = 'end',
  triggerClassName,
  menuClassName,
}) {
  const menuId = useId();
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const visibleItems = items.filter((item) => !item.hidden);

  const close = useCallback((restoreFocus = true) => {
    setOpen(false);
    setPosition(null);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  const getMenuItems = () => Array.from(menuRef.current?.querySelectorAll(ITEM_SELECTOR) ?? []);

  /** Places the menu next to the trigger, flipping above it / clamping it so it stays inside the viewport. */
  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !menuRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menu = menuRef.current.getBoundingClientRect();
    const fitsBelow = rect.bottom + MENU_GAP + menu.height <= window.innerHeight - VIEWPORT_PADDING;
    const top = fitsBelow ? rect.bottom + MENU_GAP : Math.max(VIEWPORT_PADDING, rect.top - MENU_GAP - menu.height);
    const preferredLeft = align === 'end' ? rect.right - menu.width : rect.left;
    const left = Math.min(Math.max(VIEWPORT_PADDING, preferredLeft), window.innerWidth - menu.width - VIEWPORT_PADDING);
    setPosition((current) => (current?.top === top && current?.left === left ? current : { top, left }));
  }, [align]);

  useLayoutEffect(() => {
    if (open) updatePosition();
  }, [open, updatePosition]);

  // Focus the first item once the menu has been positioned (it is invisible until then) — not on later repositions.
  const isPositioned = position !== null;
  useEffect(() => {
    if (isPositioned) menuRef.current?.querySelector(ITEM_SELECTOR)?.focus({ preventScroll: true });
  }, [isPositioned]);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (menuRef.current?.contains(event.target) || triggerRef.current?.contains(event.target)) return;
      close(false);
    };
    // Follow the trigger while the page (or a scrolling table) moves; close once it has scrolled out of view.
    const onScrollOrResize = (event) => {
      if (menuRef.current?.contains(event.target)) return;
      const rect = triggerRef.current?.getBoundingClientRect();
      const triggerVisible = rect && rect.bottom > 0 && rect.top < window.innerHeight;
      if (triggerVisible) updatePosition();
      else close(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [open, close, updatePosition]);

  const onMenuKeyDown = (event) => {
    const menuItems = getMenuItems();
    const index = menuItems.indexOf(document.activeElement);
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        menuItems[(index + 1) % menuItems.length]?.focus();
        break;
      case 'ArrowUp':
        event.preventDefault();
        menuItems[(index - 1 + menuItems.length) % menuItems.length]?.focus();
        break;
      case 'Home':
        event.preventDefault();
        menuItems[0]?.focus();
        break;
      case 'End':
        event.preventDefault();
        menuItems[menuItems.length - 1]?.focus();
        break;
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        close();
        break;
      case 'Tab':
        close(false);
        break;
      default:
        break;
    }
  };

  if (visibleItems.length === 0 && !header) return null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={label}
        onClick={(event) => {
          event.stopPropagation();
          if (open) close(false);
          else setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' && !open) {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className={cn(
          'inline-flex items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
          !trigger && 'h-10 w-10 sm:h-9 sm:w-9',
          open && 'bg-slate-100 text-slate-700',
          triggerClassName,
        )}
      >
        {trigger ?? <MoreVertical aria-hidden="true" className="h-4 w-4" />}
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-label={label}
            onKeyDown={onMenuKeyDown}
            onClick={(event) => event.stopPropagation()}
            style={position ?? { top: 0, left: 0, visibility: 'hidden' }}
            className={cn(
              'fixed z-[60] min-w-[11rem] max-w-[calc(100vw-1rem)] animate-fade-in overflow-hidden rounded-xl border border-slate-200/80 bg-white p-1 shadow-popover',
              menuClassName,
            )}
          >
            {header && <div className="mb-1 border-b border-slate-100 px-3 pb-3 pt-2">{header}</div>}
            {visibleItems.map(({ label: itemLabel, icon: Icon, onClick, danger, disabled }) => (
              <button
                key={itemLabel}
                type="button"
                role="menuitem"
                disabled={disabled}
                onClick={() => {
                  close();
                  onClick?.();
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                  danger
                    ? 'text-rose-600 hover:bg-rose-50 focus:bg-rose-50'
                    : 'text-slate-700 hover:bg-slate-50 focus:bg-slate-100',
                )}
              >
                {Icon && <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />}
                {itemLabel}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
