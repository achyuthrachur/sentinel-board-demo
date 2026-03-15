'use client';

import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'motion/react';
import type { HTMLMotionProps } from 'motion/react';

import { cn } from '@/lib/utils';

interface SpotlightCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  radius?: number;
  spotlightColor?: string;
}

export function SpotlightCard({
  children,
  className,
  radius = 240,
  spotlightColor = 'rgba(245, 168, 0, 0.18)',
  onPointerMove,
  onPointerLeave,
  ...props
}: SpotlightCardProps) {
  const mouseX = useMotionValue(-999);
  const mouseY = useMotionValue(-999);

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();

    mouseX.set(event.clientX - rect.left);
    mouseY.set(event.clientY - rect.top);
    onPointerMove?.(event);
  }

  function handlePointerLeave(event: ReactPointerEvent<HTMLDivElement>) {
    mouseX.set(-999);
    mouseY.set(-999);
    onPointerLeave?.(event);
  }

  return (
    <motion.div
      className={cn(
        'group relative overflow-hidden rounded-[1.25rem] border border-white/8 bg-[rgba(255,255,255,0.02)]',
        className,
      )}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      {...props}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`radial-gradient(${radius}px circle at ${mouseX}px ${mouseY}px, ${spotlightColor}, transparent 72%)`,
        }}
      />
      <div className="pointer-events-none absolute inset-px rounded-[calc(1.25rem-1px)] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.015))]" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
