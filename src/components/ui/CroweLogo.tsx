'use client';

import Image from 'next/image';

interface CroweLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CONFIG = {
  sm: { logoHeight: 18, sentinelText: 'text-[11px]', gap: 'gap-2.5' },
  md: { logoHeight: 24, sentinelText: 'text-sm',     gap: 'gap-3'   },
  lg: { logoHeight: 36, sentinelText: 'text-xl',     gap: 'gap-4'   },
};

export function CroweLogo({ size = 'md', className }: CroweLogoProps) {
  const { logoHeight, sentinelText, gap } = SIZE_CONFIG[size];

  return (
    <div className={`flex items-center ${gap} ${className ?? ''}`}>
      <Image
        src="/crowe-logo-white.svg"
        alt="Crowe"
        height={logoHeight}
        width={logoHeight * (79.72 / 22.5)} // preserve viewBox aspect ratio
        priority
      />
      <div
        className="shrink-0 self-stretch w-px opacity-25"
        style={{ backgroundColor: 'white' }}
      />
      <span
        className={`font-normal tracking-widest ${sentinelText}`}
        style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.6)' }}
      >
        SENTINEL
      </span>
    </div>
  );
}
