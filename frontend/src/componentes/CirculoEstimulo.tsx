// componentes/CirculoEstimulo.tsx — Círculo pulsante do estímulo visual

import { useEffect } from 'react';
import { motion, useAnimation } from 'motion/react';

interface Props {
  pulseCount: number;
  visivel: boolean;
}

export function CirculoEstimulo({ pulseCount, visivel }: Props) {
  const controlsCentro = useAnimation();
  const controlsAnel1 = useAnimation();
  const controlsAnel2 = useAnimation();

  useEffect(() => {
    if (pulseCount > 0) {
      // Centro pulsa levemente
      void controlsCentro.start({
        scale: [1, 1.15, 1],
        opacity: [0.8, 1, 0.8],
        transition: { duration: 0.3, ease: 'easeOut' },
      });
      
      // Primeiro anel expande e some
      void controlsAnel1.start({
        scale: [1, 2.5],
        opacity: [0.6, 0],
        transition: { duration: 0.8, ease: 'easeOut' },
      });
      
      // Segundo anel expande e some (com leve atraso)
      void controlsAnel2.start({
        scale: [1, 3],
        opacity: [0.4, 0],
        transition: { duration: 0.9, ease: 'easeOut', delay: 0.15 },
      });
    }
  }, [pulseCount, controlsCentro, controlsAnel1, controlsAnel2]);

  if (!visivel) return null;

  return (
    <div className="relative flex items-center justify-center w-64 h-64">
      {/* Anel 2 (Externo) */}
      <motion.div
        aria-hidden="true"
        initial={{ scale: 1, opacity: 0 }}
        animate={controlsAnel2}
        className="absolute w-32 h-32 rounded-full border-2 border-destaque"
      />
      
      {/* Anel 1 (Interno) */}
      <motion.div
        aria-hidden="true"
        initial={{ scale: 1, opacity: 0 }}
        animate={controlsAnel1}
        className="absolute w-32 h-32 rounded-full border-[3px] border-destaque"
      />
      
      {/* Círculo Central */}
      <motion.div
        role="img"
        aria-label="Estímulo visual — pulso"
        initial={{ scale: 1, opacity: 0.8 }}
        animate={controlsCentro}
        className="absolute w-32 h-32 rounded-full bg-destaque shadow-lg shadow-destaque/30"
        style={{
          transformOrigin: 'center center',
        }}
      />
    </div>
  );
}
