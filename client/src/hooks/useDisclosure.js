import { useCallback, useState } from 'react';

/**
 * Open/close state for modals, drawers and menus, with an optional payload
 * (e.g. the record being edited): `open(record)` → `data === record`.
 */
export function useDisclosure(initialOpen = false) {
  const [state, setState] = useState({ isOpen: initialOpen, data: null });

  const open = useCallback((data = null) => setState({ isOpen: true, data }), []);
  const close = useCallback(() => setState((prev) => ({ ...prev, isOpen: false })), []);
  const toggle = useCallback(() => setState((prev) => ({ ...prev, isOpen: !prev.isOpen })), []);

  return { isOpen: state.isOpen, data: state.data, open, close, toggle };
}
