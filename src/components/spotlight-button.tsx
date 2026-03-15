'use client';

import React, { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const spotlightButtonVariants = cva(
  [
    'spotlight-button',
    'inline-flex items-center justify-center whitespace-nowrap',
    'rounded-lg text-base font-bold text-white',
    'min-w-[140px] px-8 py-4',
    'font-sans',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/50',
    'disabled:pointer-events-none disabled:opacity-50',
    'transition-all duration-300',
  ],
  {
    variants: {
      variant: {
        default: 'spotlight-button-default',
        variant: 'spotlight-button-variant',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface SpotlightButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof spotlightButtonVariants> {
  asChild?: boolean;
}

export const SpotlightButton = forwardRef<HTMLButtonElement, SpotlightButtonProps>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      const target = e.currentTarget;
      const rect = target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      target.style.setProperty('--mouse-x', `${x}px`);
      target.style.setProperty('--mouse-y', `${y}px`);
    };

    return (
      <Comp
        className={cn(spotlightButtonVariants({ variant, className }))}
        ref={ref}
        onMouseMove={handleMouseMove}
        {...props}
      />
    );
  }
);
SpotlightButton.displayName = 'SpotlightButton';
