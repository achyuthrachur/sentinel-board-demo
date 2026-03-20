'use client';

import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { useEffect } from 'react';

interface DeltaBadgeProps {
  baseline: number;
  adjusted: number;
  unit?: string;
  decimals?: number;
  /** true = higher is better (e.g. CET1), false = lower is better (e.g. NPL) */
  higherIsBetter?: boolean;
}

export function DeltaBadge({ baseline, adjusted, unit = '', decimals = 2, higherIsBetter = true }: DeltaBadgeProps) {
  const delta = adjusted - baseline;
  if (Math.abs(delta) < 0.001) return null;

  const isImprovement = higherIsBetter ? delta > 0 : delta < 0;
  const color = isImprovement ? '#05AB8C' : '#E5376B';
  const prefix = delta >= 0 ? '+' : '';

  const motionVal = useMotionValue(0);
  const display = useTransform(motionVal, (v) => `${v >= 0 ? '+' : ''}${v.toFixed(decimals)}${unit}`);

  useEffect(() => {
    const ctrl = animate(motionVal, delta, { duration: 0.4, ease: 'easeOut' });
    return () => ctrl.stop();
  }, [delta, motionVal]);

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: 10,
        fontWeight: 700,
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.04em',
        padding: '2px 7px',
        borderRadius: 6,
        background: `${color}15`,
        color,
        border: `1px solid ${color}30`,
        marginLeft: 6,
      }}
    >
      <motion.span>{display}</motion.span>
    </motion.span>
  );
}
