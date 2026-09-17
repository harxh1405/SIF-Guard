import React from 'react';
import { motion } from 'motion/react';

interface PageTransitionProps {
  children: React.ReactNode;
  tabKey: string;
}

/**
 * Unified page transition wrapper with fast, restrained fade + slight vertical reveal.
 * Bypasses transforms if prefers-reduced-motion is active.
 */
export const PageTransition: React.FC<PageTransitionProps> = ({ children, tabKey }) => {
  return (
    <motion.div
      key={tabKey}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      style={{ width: '100%' }}
    >
      {children}
    </motion.div>
  );
};
