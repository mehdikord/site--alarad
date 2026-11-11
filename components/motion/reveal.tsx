'use client';

import * as React from 'react';
import { motion, type Variants } from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1] as const;

/** Fade + rise + micro blur — the core entrance used across the site. */
export function Reveal({
  children,
  delay = 0,
  y = 18,
  once = true,
  className,
  as = 'div',
  amount = 0.2,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  once?: boolean;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'span';
  amount?: number;
}) {
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once, amount }}
      transition={{ duration: 0.72, delay, ease: EASE }}
    >
      {children}
    </Comp>
  );
}

export const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 22, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.66, ease: EASE } },
};

/** Wrap grids in this to cascade children. */
export function Stagger({
  children,
  className,
  amount = 0.12,
  once = true,
}: {
  children: React.ReactNode;
  className?: string;
  amount?: number;
  once?: boolean;
}) {
  return (
    <motion.div
      className={className}
      variants={staggerParent}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={staggerChild} className={className}>
      {children}
    </motion.div>
  );
}
