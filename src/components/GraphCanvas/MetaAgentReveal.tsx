'use client';

import { AnimatePresence, motion } from 'motion/react';
import { Brain, Network } from 'lucide-react';

interface MetaAgentRevealProps {
  visible: boolean;
  rationale: string;
  nodeCount: number;
  onDismiss: () => void;
}

export function MetaAgentReveal({
  visible,
  rationale,
  nodeCount,
  onDismiss,
}: MetaAgentRevealProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute inset-0 z-50 flex flex-col items-center justify-center"
          style={{ backgroundColor: 'rgba(1,30,65,0.88)', backdropFilter: 'blur(4px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Orchestrator node reveal */}
          <motion.div
            className="mb-6 flex flex-col items-center"
            initial={{ scale: 0.5, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, type: 'spring', stiffness: 200 }}
          >
            {/* Violet glow orb */}
            <motion.div
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: '#B14FC514',
                border: '1px solid #B14FC566',
              }}
              animate={{
                boxShadow: [
                  '0 0 0px 0px #B14FC500, 0 0 20px 4px #B14FC540',
                  '0 0 0px 0px #B14FC500, 0 0 36px 10px #B14FC570',
                  '0 0 0px 0px #B14FC500, 0 0 20px 4px #B14FC540',
                ],
              }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Brain size={28} style={{ color: '#B14FC5' }} strokeWidth={1.5} />
            </motion.div>

            {/* Badge */}
            <motion.div
              className="mb-1 flex items-center gap-2 rounded-full px-3 py-1"
              style={{
                backgroundColor: '#B14FC518',
                border: '1px solid #B14FC544',
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <Network size={10} style={{ color: '#B14FC5' }} />
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: '#B14FC5', fontFamily: 'var(--font-mono)' }}
              >
                Meta-Agent · Graph Constructor
              </span>
            </motion.div>
          </motion.div>

          {/* Rationale card */}
          <motion.div
            className="mx-auto max-w-sm rounded-xl p-5 text-center"
            style={{
              backgroundColor: 'rgba(0,46,98,0.9)',
              border: '1px solid rgba(177,79,197,0.3)',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.4 }}
          >
            <p
              className="mb-3 text-xs leading-relaxed text-white"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {rationale}
            </p>

            {/* Node count badge */}
            <motion.div
              className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5"
              style={{ backgroundColor: '#B14FC522', border: '1px solid #B14FC555' }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.75, type: 'spring', stiffness: 300 }}
            >
              <span
                className="text-sm font-bold"
                style={{ color: '#B14FC5', fontFamily: 'var(--font-display)' }}
              >
                {nodeCount}
              </span>
              <span
                className="text-[10px] uppercase tracking-widest"
                style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-mono)' }}
              >
                Agents Selected
              </span>
            </motion.div>

            {/* CTA */}
            <motion.button
              className="w-full rounded-lg py-2 text-sm font-bold uppercase tracking-widest transition-colors"
              style={{
                backgroundColor: '#B14FC5',
                color: '#011E41',
                fontFamily: 'var(--font-display)',
              }}
              onClick={onDismiss}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              whileHover={{ scale: 1.02, backgroundColor: '#C861D6' }}
              whileTap={{ scale: 0.98 }}
            >
              Assemble Graph
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
