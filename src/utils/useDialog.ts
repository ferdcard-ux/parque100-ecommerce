/**
 * @fileoverview Hook de comportamiento accesible para modales.
 * Cierra con `Escape`, mueve el foco al abrir, lo restaura al cerrar
 * y mantiene el foco ciclando dentro del panel (trampa de foco simple).
 */
import { useEffect, useRef, type RefObject } from 'react';

/** Selectores considerados enfocables dentro del panel. */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Activa el comportamiento de dialogo sobre un panel ya montado.
 *
 * @param {boolean} open - true mientras el modal esta visible.
 * @param {() => void} onClose - Cierra el modal (Escape).
 * @param {RefObject<HTMLElement | null>} panelRef - Referencia al panel con `role="dialog"`.
 * @returns {void}
 */
export function useDialogBehavior(
  open: boolean,
  onClose: () => void,
  panelRef: RefObject<HTMLElement | null>,
) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const target =
      panel?.querySelector<HTMLElement>('[data-autofocus]') ??
      panel?.querySelector<HTMLElement>(FOCUSABLE);
    target?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previous?.focus?.();
    };
  }, [open, panelRef]);
}
