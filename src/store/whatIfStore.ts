import { create } from 'zustand';
import type { PresetId, LeverKey, ToggleKey, WhatIfControls } from '@/types/whatIf';
import { LEVERS, TOGGLES, PRESETS, DEFAULT_CONTROLS } from '@/data/whatIfConfig';

interface WhatIfState {
  isWhatIfActive: boolean;
  activePreset: PresetId;
  controls: WhatIfControls;
}

interface WhatIfActions {
  toggleWhatIf: () => void;
  setSlider: (key: LeverKey, value: number) => void;
  setToggle: (key: ToggleKey, active: boolean) => void;
  applyPreset: (id: PresetId) => void;
  resetToBaseline: () => void;
}

function clampSlider(key: LeverKey, value: number): number {
  const lever = LEVERS.find((l) => l.key === key);
  if (!lever) return value;
  return Math.max(lever.min, Math.min(lever.max, value));
}

export const useWhatIfStore = create<WhatIfState & WhatIfActions>()((set) => ({
  isWhatIfActive: false,
  activePreset: 'baseline',
  controls: { ...DEFAULT_CONTROLS, sliders: { ...DEFAULT_CONTROLS.sliders }, toggles: { ...DEFAULT_CONTROLS.toggles } },

  toggleWhatIf: () =>
    set((s) => ({
      isWhatIfActive: !s.isWhatIfActive,
      // Reset to baseline when toggling off
      ...(!s.isWhatIfActive
        ? {}
        : {
            activePreset: 'baseline' as PresetId,
            controls: { sliders: { ...DEFAULT_CONTROLS.sliders }, toggles: { ...DEFAULT_CONTROLS.toggles } },
          }),
    })),

  setSlider: (key, value) =>
    set((s) => ({
      activePreset: 'custom',
      controls: {
        ...s.controls,
        sliders: { ...s.controls.sliders, [key]: clampSlider(key, value) },
      },
    })),

  setToggle: (key, active) =>
    set((s) => {
      const toggle = TOGGLES.find((t) => t.key === key);
      if (!toggle) return s;

      const newSliders = { ...s.controls.sliders };

      // Apply or remove toggle effects
      for (const [leverKey, delta] of Object.entries(toggle.effects)) {
        const k = leverKey as LeverKey;
        if (active) {
          newSliders[k] = clampSlider(k, newSliders[k] + delta);
        } else {
          newSliders[k] = clampSlider(k, newSliders[k] - delta);
        }
      }

      return {
        activePreset: 'custom',
        controls: {
          sliders: newSliders,
          toggles: { ...s.controls.toggles, [key]: active },
        },
      };
    }),

  applyPreset: (id) => {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset || id === 'custom') return;

    const sliders = { ...DEFAULT_CONTROLS.sliders };
    for (const [key, value] of Object.entries(preset.sliders)) {
      sliders[key as LeverKey] = value;
    }

    const toggles = { ...DEFAULT_CONTROLS.toggles };
    for (const [key, value] of Object.entries(preset.toggles)) {
      toggles[key as ToggleKey] = value;
    }

    set({ activePreset: id, controls: { sliders, toggles } });
  },

  resetToBaseline: () =>
    set({
      activePreset: 'baseline',
      controls: { sliders: { ...DEFAULT_CONTROLS.sliders }, toggles: { ...DEFAULT_CONTROLS.toggles } },
    }),
}));
