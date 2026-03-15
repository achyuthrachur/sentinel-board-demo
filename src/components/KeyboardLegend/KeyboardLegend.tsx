'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Keyboard } from 'lucide-react';

const SHORTCUTS = [
  { key: 'Space', desc: 'Run selected scenario' },
  { key: 'R',     desc: 'Reset' },
  { key: '1 / 2 / 3', desc: 'Select scenario' },
  { key: 'S / N / F', desc: 'Speed: slow / normal / fast' },
  { key: 'C',     desc: 'Toggle compare mode' },
];

export function KeyboardLegend() {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors"
        style={{
          borderColor: open ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
          backgroundColor: open ? 'rgba(255,255,255,0.06)' : 'transparent',
          color: open ? 'var(--text-primary)' : 'var(--text-muted)',
        }}
        aria-label="Keyboard shortcuts"
      >
        <Keyboard size={14} strokeWidth={1.5} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute right-0 top-10 z-50 w-56 rounded-xl p-3"
            style={{
              backgroundColor: 'rgba(0,46,98,0.97)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(12px)',
            }}
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.18 }}
          >
            {/* Header */}
            <p
              className="mb-2.5 text-[9px] font-bold uppercase tracking-widest"
              style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
            >
              Keyboard Shortcuts
            </p>

            <div className="flex flex-col gap-1.5">
              {SHORTCUTS.map(({ key, desc }) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <span
                    className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold"
                    style={{
                      backgroundColor: 'rgba(245,168,0,0.12)',
                      border: '1px solid rgba(245,168,0,0.25)',
                      color: 'var(--accent)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {key}
                  </span>
                  <span
                    className="text-right text-[10px] opacity-70"
                    style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}
                  >
                    {desc}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
