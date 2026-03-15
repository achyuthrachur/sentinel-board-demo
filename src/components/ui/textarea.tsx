"use client";

import * as React from 'react';

import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<'textarea'>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      className={cn(
        'flex min-h-28 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition-[border-color,box-shadow,background-color] placeholder:text-[#8FE1FF]/60 focus-visible:border-[color:var(--border-active)] focus-visible:bg-white/[0.06] focus-visible:ring-4 focus-visible:ring-[#F5A800]/15 disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';

export { Textarea };
