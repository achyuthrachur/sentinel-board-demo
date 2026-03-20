'use client';

import { Slider } from '@/components/ui/slider';
import { useWhatIfStore } from '@/store/whatIfStore';
import { LEVERS, TOGGLES, PRESETS } from '@/data/whatIfConfig';
import type { LeverGroup, LeverKey, ToggleKey, PresetId } from '@/types/whatIf';

const GROUP_ORDER: LeverGroup[] = ['financial', 'capital', 'credit'];
const GROUP_LABELS: Record<LeverGroup, string> = {
  financial: 'Financial',
  capital: 'Capital',
  credit: 'Credit',
};

function formatValue(value: number, unit: string, step: number): string {
  const prefix = value >= 0 ? '+' : '';
  const decimals = step < 0.1 ? 2 : step < 1 ? 1 : 0;
  return `${prefix}${value.toFixed(decimals)}${unit}`;
}

export function WhatIfLeverPanel() {
  const activePreset = useWhatIfStore((s) => s.activePreset);
  const controls = useWhatIfStore((s) => s.controls);
  const setSlider = useWhatIfStore((s) => s.setSlider);
  const setToggle = useWhatIfStore((s) => s.setToggle);
  const applyPreset = useWhatIfStore((s) => s.applyPreset);
  const resetToBaseline = useWhatIfStore((s) => s.resetToBaseline);

  const grouped = GROUP_ORDER.map((g) => ({
    group: g,
    label: GROUP_LABELS[g],
    levers: LEVERS.filter((l) => l.group === g),
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Preset chips */}
      <div style={{ padding: '10px 14px 6px', flexShrink: 0 }}>
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 4,
        }}>
          {PRESETS.filter((p) => p.id !== 'custom').map((preset) => {
            const isActive = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 12,
                  border: 'none',
                  fontSize: 10,
                  fontWeight: 600,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  background: isActive ? '#F5A800' : 'rgba(255,255,255,0.06)',
                  color: isActive ? '#011E41' : 'rgba(255,255,255,0.6)',
                  transition: 'all 0.15s ease',
                }}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sliders by group */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 14px 12px' }}>
        {grouped.map(({ group, label, levers }) => (
          <div key={group} style={{ marginBottom: 12 }}>
            <div style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.4)',
              fontFamily: 'var(--font-mono)',
              marginBottom: 8,
              paddingTop: 8,
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}>
              {label}
            </div>

            {levers.map((lever) => {
              const value = controls.sliders[lever.key];
              const isNonZero = Math.abs(value) > 0.001;
              return (
                <div key={lever.key} style={{ marginBottom: 10 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: 4,
                  }}>
                    <span style={{
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.8)',
                      fontWeight: 500,
                    }}>
                      {lever.label}
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginLeft: 4 }}>
                        ({lever.unit})
                      </span>
                    </span>
                    <span style={{
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      color: isNonZero ? '#F5A800' : 'rgba(255,255,255,0.3)',
                      minWidth: 52,
                      textAlign: 'right',
                    }}>
                      {formatValue(value, lever.unit, lever.step)}
                    </span>
                  </div>
                  <Slider
                    min={lever.min}
                    max={lever.max}
                    step={lever.step}
                    value={[value]}
                    onValueChange={([v]) => setSlider(lever.key, v)}
                  />
                </div>
              );
            })}
          </div>
        ))}

        {/* Stress scenario toggles */}
        <div style={{
          paddingTop: 8,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          marginBottom: 12,
        }}>
          <div style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.4)',
            fontFamily: 'var(--font-mono)',
            marginBottom: 8,
          }}>
            Stress Scenarios
          </div>
          {TOGGLES.map((toggle) => {
            const isActive = controls.toggles[toggle.key];
            return (
              <button
                key={toggle.key}
                type="button"
                onClick={() => setToggle(toggle.key, !isActive)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '7px 10px',
                  marginBottom: 4,
                  borderRadius: 6,
                  border: 'none',
                  background: isActive ? 'rgba(245,168,0,0.1)' : 'rgba(255,255,255,0.03)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Toggle indicator */}
                <div style={{
                  width: 28,
                  height: 16,
                  borderRadius: 8,
                  background: isActive ? '#F5A800' : 'rgba(255,255,255,0.15)',
                  position: 'relative',
                  transition: 'background 0.2s ease',
                  flexShrink: 0,
                }}>
                  <div style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    background: '#FFFFFF',
                    position: 'absolute',
                    top: 2,
                    left: isActive ? 14 : 2,
                    transition: 'left 0.2s ease',
                  }} />
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: isActive ? '#F5A800' : 'rgba(255,255,255,0.8)' }}>
                    {toggle.label}
                  </div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)' }}>
                    {toggle.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Reset button */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '10px 14px',
        flexShrink: 0,
      }}>
        <button
          type="button"
          onClick={resetToBaseline}
          style={{
            width: '100%',
            height: 32,
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 5,
            background: 'transparent',
            color: 'rgba(255,255,255,0.6)',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          Reset to Baseline
        </button>
      </div>
    </div>
  );
}
