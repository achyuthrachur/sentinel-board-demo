'use client';

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';

type EdgeVariant = 'default' | 'conditional' | 'loop';

interface AnimatedEdgeData {
  edgeType?: EdgeVariant;
}

export function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  data,
  markerEnd,
  style,
}: EdgeProps) {
  const edgeType = (data as AnimatedEdgeData)?.edgeType ?? 'default';
  const isLoop = edgeType === 'loop';
  const isConditional = edgeType === 'conditional';

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeColor = isLoop
    ? '#E5376B'
    : isConditional
      ? '#F5A800'
      : 'rgba(255,255,255,0.18)';

  const strokeDasharray = isLoop ? '6 4' : isConditional ? '4 3' : undefined;

  return (
    <>
      {/* Base path (static, subtle) */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: edgeColor,
          strokeWidth: 1.5,
          strokeDasharray,
          ...style,
        }}
      />

      {/* Traveling dot animation overlay */}
      <path
        id={`${id}-travel`}
        d={edgePath}
        fill="none"
        stroke={edgeColor}
        strokeWidth={2}
        strokeDasharray="6 18"
        strokeLinecap="round"
        style={{
          animation: 'edge-dot-travel 1.2s linear infinite',
        }}
      />

      {/* Edge label badge */}
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
          >
            <span
              className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest"
              style={{
                backgroundColor: isLoop
                  ? '#E5376B22'
                  : isConditional
                    ? '#F5A80022'
                    : 'rgba(0,46,98,0.9)',
                color: isLoop ? '#E5376B' : isConditional ? '#F5A800' : 'rgba(255,255,255,0.5)',
                border: `1px solid ${edgeColor}44`,
                fontFamily: 'var(--font-mono)',
              }}
            >
              {String(label)}
            </span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
