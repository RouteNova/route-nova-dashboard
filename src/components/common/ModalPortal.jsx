import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Componente Portal para renderizar modales directamente en document.body.
 * Esto garantiza que el modal siempre aparezca centrado en el viewport visible del usuario,
 * independientemente del nivel de scroll de la página o transformaciones CSS de contenedores padre.
 */
export default function ModalPortal({ children }) {
  useEffect(() => {
    // Bloquear el scroll de fondo suavemente mientras el modal permanece abierto
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return createPortal(children, document.body);
}
