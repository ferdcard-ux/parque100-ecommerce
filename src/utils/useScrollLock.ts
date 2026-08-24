/**
 * @fileoverview Hook de bloqueo de scroll.
 * Evita el scroll del body cuando hay un modal/panel abierto y
 * restaura el comportamiento al desmontar o liberar el bloqueo.
 */
import { useEffect } from 'react';

/**
 * Bloquea (o libera) el scroll del documento segun el estado dado.
 *
 * @param {boolean} locked - true para ocultar el overflow del body.
 */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (locked) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [locked]);
}
